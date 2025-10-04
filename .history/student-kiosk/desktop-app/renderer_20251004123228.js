/**
 * Kiosk Renderer - WebRTC Screen Streaming
 * Connects to Admin System using config.js
 */

// Load configuration
const config = require('./config.js');

let socket = null;
let pc = null;
let sessionId = null;

console.log('🎬 Kiosk Renderer Starting...');
console.log('📡 Server URL:', config.SERVER_URL);
console.log('🏫 Lab ID:', config.LAB_ID);

// Initialize socket connection to Admin System
socket = io(config.SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: config.RECONNECT_ATTEMPTS,
    reconnectionDelay: config.RECONNECT_DELAY,
    timeout: 10000
});

socket.on('connect', () => {
    console.log('✅ Connected to Admin System:', socket.id);
    console.log('🌐 Admin Server:', config.ADMIN_SERVER_IP);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from Admin System');
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection error to Admin System:', err.message);
    console.error('🔍 Check if Admin System is running at:', config.SERVER_URL);
});

socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Reconnection attempt ${attemptNumber}/${config.RECONNECT_ATTEMPTS}`);
});

socket.on('reconnect_failed', () => {
    console.error('❌ Failed to reconnect to Admin System');
    console.error('🔍 Verify Admin System IP:', config.ADMIN_SERVER_IP);
});

console.log('✅ Kiosk Renderer Ready');

// Listen for session creation from main process
window.electronAPI.onSessionCreated(async (data) => {
    sessionId = data.sessionId;
    console.log('✅ Session created:', sessionId);

    // Wait for socket connection
    if (!socket.connected) {
        console.log('⏳ Waiting for connection to Admin System...');
        await new Promise((resolve) => {
            if (socket.connected) resolve();
            else socket.once('connect', resolve);
        });
    }

    console.log('📡 Registering with Admin System...');
    socket.emit('register-kiosk', { 
        sessionId,
        labId: config.LAB_ID 
    });

    await startLiveStream();
});

// Listen for stop command
window.electronAPI.onStopLiveStream(() => {
    console.log('🛑 Stopping live stream');
    stopLiveStream();
});

// Start screen streaming
async function startLiveStream() {
    try {
        console.log('🎥 Starting screen capture...');

        const sources = await window.electronAPI.getScreenSources();
        if (!sources || sources.length === 0) {
            throw new Error('No screen sources available');
        }

        const screenSource = sources.find(s => s.id.startsWith('screen')) || sources[0];
        console.log('📺 Capturing:', screenSource.name);

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

        console.log('✅ Screen capture started');

        // Create WebRTC peer connection
        pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        // Add video tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
            console.log('➕ Added track:', track.kind);
        });

        // Handle ICE candidates
        pc.onicecandidate = event => {
            if (event.candidate) {
                console.log('🧊 Sending ICE candidate to Admin');
                socket.emit('webrtc-ice-candidate', {
                    candidate: event.candidate,
                    sessionId
                });
            }
        };

        // Monitor connection state
        pc.onconnectionstatechange = () => {
            console.log('🔗 Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                console.log('✅ Video streaming to Admin System!');
            } else if (pc.connectionState === 'failed') {
                console.error('❌ Connection to Admin failed');
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('🧊 ICE state:', pc.iceConnectionState);
        };

        console.log('✅ WebRTC setup complete, waiting for Admin');

    } catch (error) {
        console.error('❌ Screen capture failed:', error);
        alert('Failed to start screen sharing: ' + error.message);
    }
}

// Handle offer from Admin
socket.on('admin-offer', async ({ offer, sessionId: offerSessionId, adminSocketId }) => {
    console.log('📥 Received offer from Admin');
    
    if (offerSessionId !== sessionId) {
        console.warn('⚠️ Session ID mismatch');
        return;
    }

    if (!pc) {
        console.error('❌ Peer connection not ready');
        return;
    }

    try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('✅ Set remote description');
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('✅ Created answer');
        
        socket.emit('webrtc-answer', { 
            answer, 
            adminSocketId, 
            sessionId 
        });
        
        console.log('📤 Sent answer to Admin');
        
    } catch (e) {
        console.error('❌ Error handling offer:', e);
    }
});

// Handle ICE candidates from Admin
socket.on('webrtc-ice-candidate', async ({ candidate }) => {
    if (pc) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ Added ICE candidate from Admin');
        } catch (e) {
            console.error('❌ Error adding ICE candidate:', e);
        }
    }
});

// Stop streaming
function stopLiveStream() {
    if (pc) {
        pc.getSenders().forEach(sender => {
            if (sender.track) sender.track.stop();
        });
        pc.close();
        pc = null;
    }
    sessionId = null;
    console.log('🛑 Stream stopped');
}
