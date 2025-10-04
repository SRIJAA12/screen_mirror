console.log('preload loaded!');

const { contextBridge, ipcRenderer } = require('electron');

const config = require('./config.js');

contextBridge.exposeInMainWorld('electronAPI', {
  studentLogin: (credentials) => ipcRenderer.invoke('student-login', credentials),
  studentLogout: () => ipcRenderer.invoke('student-logout'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getServerUrl: () => ipcRenderer.invoke('get-server-url'),
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  forgotPassword: (data) => ipcRenderer.invoke('forgot-password', data),
  verifyDob: (data) => ipcRenderer.invoke('verify-dob', data),
  resetPassword: (data) => ipcRenderer.invoke('reset-password', data),
  onSessionCreated: (callback) => ipcRenderer.on('session-created', (event, data) => callback(data)),
  onStopLiveStream: (callback) => ipcRenderer.on('stop-live-stream', () => callback()),

  // Expose config directly if needed by renderer
  getConfig: () => ({
    SERVER_URL: config.SERVER_URL,
    LAB_ID: config.LAB_ID,
    ADMIN_SERVER_IP: config.ADMIN_SERVER_IP
  })
});

// Security: block context menu and common shortcuts for kiosk
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  console.log('Context menu disabled');
});

document.addEventListener('selectstart', (e) => {
  e.preventDefault();
});
document.addEventListener('dragover', (e) => {
  e.preventDefault();
});
document.addEventListener('drop', (e) => {
  e.preventDefault();
});
window.addEventListener('keydown', (e) => {
  if (
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
    (e.ctrlKey && e.key.toLowerCase() === 'u') ||
    e.key === 'F12'
  ) {
    e.preventDefault();
    console.log(`Blocked shortcut: ${e.key}`);
  }
});

console.log('✅ Preload script loaded with screen sources support via IPC');
