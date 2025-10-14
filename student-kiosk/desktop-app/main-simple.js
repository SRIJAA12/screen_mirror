const { app, BrowserWindow, ipcMain, screen, dialog, globalShortcut, desktopCapturer } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Enable screen capturing
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('auto-select-desktop-capture-source', 'Entire screen');
app.commandLine.appendSwitch('enable-features', 'MediaStream,GetDisplayMedia');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('disable-web-security');

let mainWindow = null;
let currentSession = null;
let sessionActive = false;

// Server URL - updated to current network IP
const SERVER_URL = 'http://10.10.194.103:8000';
const LAB_ID = process.env.LAB_ID || "CC1";
const SYSTEM_NUMBER = process.env.SYSTEM_NUMBER || `CC1-${String(Math.floor(Math.random() * 10) + 1).padStart(2, '0')}`;

// Kiosk mode configuration - DISABLED FOR DEBUGGING
const KIOSK_MODE = false; // Disabled for debugging
let isKioskLocked = false; // System starts unlocked for debugging

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    frame: true,                             // Show frame for debugging
    fullscreen: false,                       // Windowed mode for debugging
    alwaysOnTop: false,                      // Allow other windows
    skipTaskbar: false,                      // Show in taskbar
    kiosk: false,                            // Disable kiosk mode
    resizable: true,                         // Allow resizing
    minimizable: true,                       // Allow minimize
    closable: true,                          // Allow close
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableBlinkFeatures: 'GetDisplayMedia',
      webSecurity: false
    }
  });

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('🔐 Permission requested:', permission);
    if (permission === 'media' || permission === 'display-capture') {
      callback(true);
    } else {
      callback(false);
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    console.log('🔐 Permission check:', permission);
    return true;
  });

  mainWindow.loadFile('student-interface.html');

  // Open DevTools in detached mode for debugging
  mainWindow.webContents.openDevTools({ mode: 'detach' });
  
  console.log('🐛 DEBUG MODE: Kiosk restrictions disabled for development');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    
    console.log(`🐛 DEBUG MODE - System: ${SYSTEM_NUMBER}, Lab: ${LAB_ID} - Server: ${SERVER_URL}`);
  });

  // Allow normal window closure for debugging
  mainWindow.on('close', (e) => {
    if (sessionActive) {
      // Show logout confirmation
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Logout & Close', 'Cancel'],
        defaultId: 1,
        title: 'Confirm Logout',
        message: 'Are you sure you want to logout and close the application?',
        detail: 'Your session will be ended and all work should be saved.'
      });
      
      if (choice === 0) {
        // Perform logout then close
        performLogout().then(() => {
          app.quit();
        });
      } else {
        e.preventDefault();
      }
    }
    // Allow close if not logged in (for debugging)
  });
}

// Handle screen sources request
ipcMain.handle('get-screen-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({ 
      types: ['screen', 'window'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    console.log('✅ desktopCapturer returned', sources.length, 'sources');
    return sources;
  } catch (error) {
    console.error('❌ desktopCapturer error:', error);
    throw error;
  }
});

// Handle student login
ipcMain.handle('student-login', async (event, credentials) => {
  try {
    const creds = {
      studentId: credentials.studentId,
      password: credentials.password,
      labId: LAB_ID,
    };

    console.log('🔐 Attempting authentication for:', creds.studentId);

    const authRes = await fetch(`${SERVER_URL}/api/student-authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const authData = await authRes.json();

    if (!authData.success) {
      console.error('❌ Authentication failed:', authData.error);
      return { success: false, error: authData.error || 'Authentication failed' };
    }

    console.log('✅ Authentication successful for:', authData.student.name);

    const sessionRes = await fetch(`${SERVER_URL}/api/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: authData.student.name,
        studentId: authData.student.studentId,
        computerName: os.hostname(),
        labId: LAB_ID,
        systemNumber: credentials.systemNumber || SYSTEM_NUMBER
      }),
    });
    const sessionData = await sessionRes.json();

    if (!sessionData.success) {
      console.error('❌ Session creation failed:', sessionData.error);
      return { success: false, error: sessionData.error || 'Session creation failed' };
    }

    console.log('✅ Session created:', sessionData.sessionId);

    currentSession = { id: sessionData.sessionId, student: authData.student };
    sessionActive = true;
    isKioskLocked = false; // Unlock the system

    // Update window properties after login (relaxed for debugging)
    mainWindow.setClosable(true); // Allow close for debugging
    mainWindow.setMinimizable(true); // Allow minimize
    mainWindow.setAlwaysOnTop(false); // Allow other windows to come to front

    console.log(`🔓 System unlocked for: ${authData.student.name} (${authData.student.studentId})`);

    // Notify renderer to start screen streaming with delay
    setTimeout(() => {
      console.log('🎬 Sending session-created event to renderer:', sessionData.sessionId);
      mainWindow.webContents.send('session-created', {
        sessionId: sessionData.sessionId,
        serverUrl: SERVER_URL
      });
    }, 1000);

    return { 
      success: true, 
      student: authData.student, 
      sessionId: sessionData.sessionId 
    };
  } catch (error) {
    console.error('❌ Login error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
});

// Handle student logout
ipcMain.handle('student-logout', async () => {
  if (!sessionActive || !currentSession) {
    return { success: false, error: 'No active session' };
  }

  try {
    console.log('🚪 Logging out session:', currentSession.id);

    mainWindow.webContents.send('stop-live-stream');

    await fetch(`${SERVER_URL}/api/student-logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession.id }),
    });

    console.log('✅ Logout successful');

    sessionActive = false;
    currentSession = null;
    isKioskLocked = true; // Lock the system again

    // Restore properties (relaxed for debugging)
    mainWindow.setClosable(true);
    mainWindow.setMinimizable(true);
    mainWindow.setAlwaysOnTop(false);
    
    mainWindow.restore();
    mainWindow.focus();
    
    console.log('🔒 System locked after logout');

    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
});

// Get system information
ipcMain.handle('get-system-info', async () => {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus(),
    memory: os.totalmem()
  };
});

// Get server URL
ipcMain.handle('get-server-url', async () => {
  return SERVER_URL;
});

// Reset Password with Date of Birth verification
ipcMain.handle('reset-password', async (event, data) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// First-time signin
ipcMain.handle('first-time-signin', async (event, data) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/student-first-signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Check student eligibility for first-time signin
ipcMain.handle('check-student-eligibility', async (event, data) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/check-student-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Helper function for logout
async function performLogout() {
  if (sessionActive && currentSession) {
    try {
      console.log('🚪 Performing logout for session:', currentSession.id);
      
      mainWindow.webContents.send('stop-live-stream');
      
      await fetch(`${SERVER_URL}/api/student-logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession.id }),
      });
      
      sessionActive = false;
      currentSession = null;
      isKioskLocked = true;
      
      console.log('✅ Logout completed');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }
}

function gracefulLogout() {
  if (sessionActive && currentSession) {
    performLogout().finally(() => {
      app.quit();
    });
  } else {
    app.quit();
  }
}

process.on('SIGINT', (signal) => {
  console.log('SIGINT received, logging out and quitting...');
  gracefulLogout();
});

process.on('SIGTERM', (signal) => {
  console.log('SIGTERM received, logging out and quitting...');
  gracefulLogout();
});

app.on('before-quit', (e) => {
  if (sessionActive) {
    e.preventDefault();
    gracefulLogout();
  }
});
