// Initialize socket connection to your laptop's IP
let socket = null;
let pc = null;
let sessionId = null;
let serverUrl = null;

console.log('🎬 Renderer.js loading...');

// Connect to your backend server (LAN IP)
socket = io("http://192.168.0.100:8000");

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

// Handle session creation event from main process
window.electronAPI.onSessionCreated(async (data) => {
  sessionId = data.sessionId;
  serverUrl = data.serverUrl;

  console.log('✅ Session created event received:', { sessionId, serverUrl });

  // After socket connection, register kiosk with backend
  if (!socket.connected) {
    console.log('⏳ Waiting for socket to connect...');
    await new Promise((resolve) => {
      if (socket.connected) resolve();
      else socket.once('connect', resolve);
    });
    console.log('✅ Socket now connected');
  }

  console.log('📡 Registering kiosk for session:', sessionId);
  socket.emit('register-kiosk', { sessionId });

  // Start the screen sharing stream
  await startLiveStream();
});

// Listen for stop command from main process
window.electronAPI.onStopLiveStream(() => {
  console.log('🛑 Stop live stream command received');
  stopLiveStream();
});

// Function to start live streaming
async function startLiveStream() {
  try {
    console.log('🎥 Starting live stream for session:', sessionId);

    // Obtain available sources via preload IPC method
    const sources = await window.electronAPI.getScreenSources();
    if (!sources || sources.length === 0) {
      throw new Error('No screen sources available');
    }

    // Select the first screen source (or improve source selection logic)
    const screenSource = sources.find(source => source.id.startsWith('screen')) || sources[0];
    console.log('📺 Screen source obtained:', screenSource.name, 'ID:', screenSource.id);

    // Use getUserMedia with desktop capture source
    const stream = await navigator.mediaDevices.getUserMedia({
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
    console.log('Stream tracks:', stream.getTracks().map(t => `${t.kind} (${t.label})`));

    // Set up peer connection for WebRTC
    pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    // Add all tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log('➕ Added track to PC:', track.kind, track.label);
    });

    // Setup ICE candidate event
    pc.onicecandidate = event => {
      if (event.candidate) {
        console.log('🧊 ICE candidate:', event.candidate.type);
        socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          sessionId: sessionId
        });
      } else {
        console.log('🧊 All ICE candidates sent');
      }
    };

    // Setup connection state change
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅✅✅ Connected! Video flow established');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE state:', pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering:', pc.iceGatheringState);
    };

    // Create offer for signaling
    console.log('📝 Creating offer');
    const offer = await pc.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: false
    });
    await pc.setLocalDescription(offer);
    console.log('📤 Sending offer to server');
    socket.emit('admin-offer', {
      offer: pc.localDescription,
      sessionId: sessionId,
      adminSocketId: socket.id
    });
    console.log('✅ Offer sent, awaiting answer...');
  } catch (error) {
    console.error('❌ startLiveStream error:', error);
    alert('Screen sharing failed: ' + error.message);
  }
}

// Handle incoming answer from admin (kiosk)
socket.on('webrtc-answer', async ({ answer, sessionId: adminSessionId }) => {
  console.log('✅ Received answer from kiosk for session:', adminSessionId);
  if (pc && sessionId === adminSessionId) {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('✅ Remote description set, ICE exchange ongoing');
  }
});

// Handle ICE candidates from kiosk
socket.on('webrtc-ice-candidate', async ({ candidate }) => {
  console.log('🧊 ICE candidate from kiosk received');
  if (pc) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ ICE candidate added');
    } catch (e) {
      console.error('❌ Error adding ICE candidate:', e);
    }
  }
});

// Stop streaming and clean up
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
