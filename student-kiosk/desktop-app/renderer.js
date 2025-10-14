// Initialize socket immediately
let socket = null;
let pc = null;
let sessionId = null;
let serverUrl = "http://192.168.29.212:8000";

console.log('🎬 Renderer.js loading...');

// Create socket connection immediately
socket = io(serverUrl);

socket.on('connect', () => {
  console.log('✅ Socket.io connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Socket.io disconnected');
});

socket.on('connect_error', (err) => {
  console.error('❌ Socket connect error:', err);
});

console.log('🎬 Renderer.js loaded and ready');

// Listen for session creation event from main process
window.electronAPI.onSessionCreated(async (data) => {
  sessionId = data.sessionId;
  serverUrl = data.serverUrl;

  console.log('✅ Session created event received:', { sessionId, serverUrl });

  // Wait for socket to be connected
  if (!socket.connected) {
    console.log('⏳ Waiting for socket to connect...');
    await new Promise((resolve) => {
      if (socket.connected) {
        resolve();
      } else {
        socket.once('connect', resolve);
      }
    });
    console.log('✅ Socket now connected');
  }

  // Register this kiosk with backend
  console.log('📡 Registering kiosk for session:', sessionId);
  socket.emit('register-kiosk', { sessionId });

  // Start capturing and streaming screen - THIS IS THE KEY!
  await startLiveStream();
});

// Listen for stop command
window.electronAPI.onStopLiveStream(() => {
  console.log('🛑 Stop live stream command received');
  stopLiveStream();
});

// Global variable to store the screen stream
let localStream = null;

// Prepare screen capture - get the stream but don't create peer connection yet
async function startLiveStream() {
  try {
    console.log('🎥 Preparing screen capture for session:', sessionId);

    const sources = await window.electronAPI.getScreenSources();
    
    if (!sources || sources.length === 0) {
      throw new Error('No screen sources available');
    }

    const screenSource = sources.find(source => source.id.startsWith('screen')) || sources[0];
    console.log('📺 Screen source obtained:', screenSource.name, 'ID:', screenSource.id);

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

    console.log('✅ Screen capture ready - waiting for admin offers...');
  } catch (error) {
    console.error('❌ Error in startLiveStream:', error);
    alert('Screen sharing failed: ' + error.message);
  }
}

// Listen for admin offer - Create peer connection when offer received
socket.on('admin-offer', async ({ offer, sessionId: adminSessionId, adminSocketId }) => {
  console.log('📥 KIOSK: Received admin offer for session:', adminSessionId);
  console.log('📥 KIOSK: Current sessionId:', sessionId);
  console.log('📥 KIOSK: localStream available:', !!localStream);
  
  if (adminSessionId !== sessionId) {
    console.warn('⚠️ Session ID mismatch - admin:', adminSessionId, 'kiosk:', sessionId);
    return;
  }

  if (!localStream) {
    console.error('❌ Screen stream not ready - cannot create peer connection');
    console.error('❌ Try refreshing the kiosk or check screen permissions');
    return;
  }

  // Create peer connection NOW when we receive the offer
  console.log('🔗 Creating peer connection for admin offer...');
  pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  });
  console.log('✅ KIOSK: Peer connection created with enhanced ICE configuration');

  // Add all tracks from stream
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
    console.log('➕ Added track to PC:', track.kind, track.label);
  });

  // Set up event handlers
  pc.onicecandidate = event => {
    if (event.candidate) {
      console.log('🧊 ✅ KIOSK SENDING ICE CANDIDATE:', event.candidate.type, event.candidate.candidate.substring(0, 50) + '...');
      socket.emit('webrtc-ice-candidate', {
        candidate: event.candidate,
        sessionId: sessionId
      });
      console.log('🧊 ✅ ICE candidate sent to server');
    } else {
      console.log('🧊 ✅ Kiosk: All ICE candidates sent - gathering complete');
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

  pc.onicegatheringstatechange = () => {
    console.log('🧊 Kiosk ICE gathering:', pc.iceGatheringState);
  };

  try {
    console.log('🤝 KIOSK: Setting remote description');
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('✅ KIOSK: Remote description set successfully');
    
    console.log('📝 KIOSK: Creating answer');
    const answer = await pc.createAnswer();
    console.log('✅ KIOSK: Answer created successfully');
    
    console.log('📝 KIOSK: Setting local description');
    await pc.setLocalDescription(answer);
    console.log('✅ KIOSK: Local description set successfully');
    
    console.log('📤 KIOSK: Sending answer to admin');
    socket.emit('webrtc-answer', { 
      answer, 
      adminSocketId, 
      sessionId 
    });
    console.log('✅ KIOSK: Answer sent to admin');
    
    console.log('✅✅✅ KIOSK: Handshake completed, video tracks should be flowing now!');
  } catch (e) {
    console.error('❌❌ KIOSK: Error handling offer:', e);
    console.error('❌ KIOSK: Stack trace:', e.stack);
  }
});

// Listen for ICE candidates from admin - EXACTLY like theirs
socket.on('webrtc-ice-candidate', async ({ candidate, sessionId: cid }) => {
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
  } catch (e) {
    console.error('❌ KIOSK: ICE error:', e);
  }
});

function stopLiveStream() {
  console.log('🛑 Stopping stream');
  if (pc) {
    pc.getSenders().forEach(sender => {
      if (sender.track) sender.track.stop();
    });
    pc.close();
    pc = null;
  }
  sessionId = null;
  serverUrl = null;
}
