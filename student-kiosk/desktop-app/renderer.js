// FIXED RENDERER - Screen Mirroring Working Version
let socket = null;
let pc = null;
let sessionId = null;
let localStream = null;
const serverUrl = "http://10.10.194.103:7401";

console.log('🎬 FIXED Renderer.js loading...');

// Initialize socket connection
function initializeSocket() {
  console.log('🔌 Initializing socket connection to:', serverUrl);
  
  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    timeout: 5000,
    forceNew: true
  });

  socket.on('connect', () => {
    console.log('✅ Socket.io connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket.io disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connect error:', err);
  });

  // Listen for admin offers
  socket.on('admin-offer', handleAdminOffer);
  
  // Listen for ICE candidates
  socket.on('webrtc-ice-candidate', handleICECandidate);
}

// Initialize immediately
initializeSocket();

// Listen for session creation event from main process
window.electronAPI.onSessionCreated(async (data) => {
  sessionId = data.sessionId;
  console.log('✅ Session created event received:', { sessionId });
  
  // Clean up previous session resources
  if (localStream) {
    console.log('🧹 Cleaning up previous screen stream...');
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  if (pc) {
    console.log('🧹 Cleaning up previous peer connection...');
    pc.close();
    pc = null;
  }

  // Wait for socket connection
  if (!socket || !socket.connected) {
    console.log('⏳ Waiting for socket to connect...');
    await waitForSocketConnection();
  }

  // Register this kiosk with backend
  console.log('📡 Registering kiosk for session:', sessionId);
  socket.emit('register-kiosk', { sessionId });

  // Prepare screen capture (will emit screen-ready when done)
  await prepareScreenCapture();
});

// Wait for socket connection
function waitForSocketConnection() {
  return new Promise((resolve) => {
    if (socket && socket.connected) {
      resolve();
    } else {
      const checkConnection = () => {
        if (socket && socket.connected) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    }
  });
}

// Prepare screen capture with retry logic
async function prepareScreenCapture(retryCount = 0) {
  try {
    console.log(`🎥 Preparing screen capture... (Attempt ${retryCount + 1}/3)`);

    const sources = await window.electronAPI.getScreenSources();
    
    if (!sources || sources.length === 0) {
      throw new Error('No screen sources available');
    }

    console.log(`📺 Found ${sources.length} screen sources:`);
    sources.forEach((s, i) => console.log(`  ${i + 1}. ${s.name} (ID: ${s.id})`));

    const screenSource = sources.find(source => source.id.startsWith('screen')) || sources[0];
    console.log('📺 Selected screen source:', screenSource.name, 'ID:', screenSource.id);

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenSource.id,
          minWidth: 1280,
          maxWidth: 1920,
          minHeight: 720,
          maxHeight: 1080,
          maxFrameRate: 30
        }
      }
    });

    console.log('✅ Screen stream obtained successfully');
    console.log('📊 Stream tracks:', localStream.getTracks().map(t => `${t.kind} (${t.label})`));
    console.log('✅ Ready for admin connections - waiting for offers...');
    
    // CRITICAL: Notify server that kiosk is NOW ready with screen capture
    console.log('\n==============================================');
    console.log('🎉 EMITTING KIOSK-SCREEN-READY EVENT');
    console.log('Session ID:', sessionId);
    console.log('Has Video:', true);
    console.log('==============================================\n');
    
    socket.emit('kiosk-screen-ready', { 
      sessionId, 
      hasVideo: true,
      timestamp: new Date().toISOString() 
    });
    
    console.log('✅ Screen ready event emitted successfully');

  } catch (error) {
    console.error(`❌ Error preparing screen capture (Attempt ${retryCount + 1}/3):`, error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Retry up to 3 times with increasing delays
    if (retryCount < 2) {
      const delay = (retryCount + 1) * 2000; // 2s, 4s
      console.log(`🔄 Retrying in ${delay/1000} seconds...`);
      setTimeout(() => {
        prepareScreenCapture(retryCount + 1);
      }, delay);
    } else {
      console.error('❌❌❌ SCREEN CAPTURE FAILED AFTER 3 ATTEMPTS!');
      console.error('❌ Possible causes:');
      console.error('  1. Graphics driver issue - update your GPU drivers');
      console.error('  2. Running in Remote Desktop - screen capture doesn\'t work in RDP');
      console.error('  3. Multiple displays causing conflicts');
      console.error('  4. Windows permissions - run as administrator');
      alert('\u274c Screen capture failed after 3 attempts!\n\n' +
            'Possible solutions:\n' +
            '1. Update graphics drivers\n' +
            '2. Don\'t use Remote Desktop\n' +
            '3. Try disconnecting extra monitors\n' +
            '4. Run as administrator\n\n' +
            'Error: ' + error.message);
    }
  }
}

// Handle admin offer
async function handleAdminOffer({ offer, sessionId: adminSessionId, adminSocketId }) {
  console.log('📥 KIOSK: Received admin offer for session:', adminSessionId);
  console.log('📥 KIOSK: Current sessionId:', sessionId);
  console.log('📥 KIOSK: localStream available:', !!localStream);
  console.log('📥 KIOSK: Admin socket ID:', adminSocketId);
  
  // Send immediate acknowledgment
  socket.emit('offer-received', { sessionId: adminSessionId, adminSocketId, timestamp: new Date().toISOString() });
  
  if (adminSessionId !== sessionId) {
    console.warn('⚠️ Session ID mismatch - admin:', adminSessionId, 'kiosk:', sessionId);
    return;
  }

  if (!localStream) {
    console.error('❌ Screen stream not ready - cannot create peer connection');
    return;
  }

  try {
    // Close existing peer connection if any
    if (pc) {
      console.log('🗑️ Closing existing peer connection...');
      pc.close();
      pc = null;
    }
    
    // Create peer connection
    console.log('🔗 Creating peer connection for admin offer...');
    pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    console.log('✅ KIOSK: Peer connection created');

    // Add all tracks from stream
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
      console.log('➕ Added track to PC:', track.kind, track.label);
    });

    // Set up event handlers
    pc.onicecandidate = event => {
      if (event.candidate) {
        console.log('🧊 KIOSK SENDING ICE CANDIDATE');
        socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          sessionId: sessionId
        });
      } else {
        console.log('🧊 All ICE candidates sent');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Kiosk connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅✅✅ KIOSK CONNECTED! VIDEO FLOWING!');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 Kiosk ICE state:', pc.iceConnectionState);
    };

    // Set remote description
    console.log('🤝 KIOSK: Setting remote description');
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('✅ KIOSK: Remote description set');
    
    // Create answer
    console.log('📝 KIOSK: Creating answer');
    const answer = await pc.createAnswer();
    console.log('✅ KIOSK: Answer created');
    
    // Set local description
    console.log('📝 KIOSK: Setting local description');
    await pc.setLocalDescription(answer);
    console.log('✅ KIOSK: Local description set');
    
    // Send answer
    console.log('📤 KIOSK: Sending answer to admin');
    socket.emit('webrtc-answer', { 
      answer, 
      adminSocketId, 
      sessionId 
    });
    console.log('✅ KIOSK: Answer sent - handshake completed!');
    
  } catch (error) {
    console.error('❌ KIOSK: Error handling offer:', error);
  }
}

// Handle ICE candidates
async function handleICECandidate({ candidate, sessionId: cid }) {
  console.log('🧊 KIOSK: Received ICE from admin');
  
  if (!pc) {
    console.warn('⚠️ PC not ready');
    return;
  }
  
  if (cid && cid !== sessionId) {
    console.warn('⚠️ Session mismatch');
    return;
  }

  try {
    console.log('🧊 KIOSK: Adding admin ICE candidate');
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('✅ KIOSK: ICE added');
  } catch (error) {
    console.error('❌ KIOSK: ICE error:', error);
  }
}

// Listen for stop command
window.electronAPI.onStopLiveStream(() => {
  console.log('🛑 Stop live stream command received');
  if (pc) {
    pc.getSenders().forEach(sender => {
      if (sender.track) sender.track.stop();
    });
    pc.close();
    pc = null;
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  sessionId = null;
});

console.log('🎬 FIXED Renderer.js loaded and ready');
