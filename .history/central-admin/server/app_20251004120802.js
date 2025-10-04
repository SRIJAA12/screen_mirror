require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// Bind socket.io to laptop IP so phone can connect over LAN
const io = socketIo(server, {
  cors: { origin: "*" },
  // optional you can specify explicit host binding, but not needed for socket.io listening
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Serve admin dashboard static files
app.use(express.static(path.join(__dirname, '../dashboard')));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://srijaaanandhan12_db_user:122007@cluster0.2kzkkpe.mongodb.net/college-lab-registration?retryWrites=true&w=majority';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

// Mongoose models
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  labId: { type: String, required: true }
});
studentSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};
const Student = mongoose.model('Student', studentSchema);

const sessionSchema = new mongoose.Schema({
  studentName: String,
  studentId: String,
  computerName: String,
  labId: String,
  systemNumber: String,
  loginTime: { type: Date, default: Date.now },
  logoutTime: Date,
  duration: Number,
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  screenshot: String
});
const Session = mongoose.model('Session', sessionSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routing and API

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/index.html'));
});

app.post('/api/student-register', async (req, res) => {
  try {
    const { name, studentId, email, password, dateOfBirth, department, year, labId } = req.body;
    if (!name || !studentId || !email || !password || !dateOfBirth || !department || !year || !labId)
      return res.status(400).json({ success: false, error: "Missing required fields." });
    const existing = await Student.findOne({ $or: [{studentId}, {email}] });
    if (existing) return res.status(400).json({ success: false, error: "Student ID or email already exists." });
    
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const student = new Student({ name, studentId, email, passwordHash, dateOfBirth, department, year, labId });
    await student.save();
    console.log(`✅ Student registered: ${studentId}`);
    res.json({ success: true, message: "Student registered successfully." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/student-authenticate', async (req,res) => {
  try {
    const { studentId, password, labId } = req.body;
    const student = await Student.findOne({ studentId, labId });
    if(!student) return res.status(400).json({ success: false, error: "Invalid student or lab" });

    const isValid = await student.verifyPassword(password);
    if(!isValid) return res.status(400).json({ success: false, error: "Incorrect password" });

    console.log(`✅ Authentication successful: ${studentId}`);
    res.json({
      success: true,
      student: {
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        department: student.department,
        year: student.year,
        labId: student.labId
      }
    });
  } catch(err) {
    console.error("Authentication error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/student-login', async (req, res) => {
  try {
    const { studentName, studentId, computerName, labId, systemNumber } = req.body;
    await Session.updateMany({ computerName, status: 'active' }, { status: 'completed', logoutTime: new Date() });

    const newSession = new Session({
      studentName,
      studentId,
      computerName,
      labId,
      systemNumber,
      loginTime: new Date(),
      status: 'active'
    });
    await newSession.save();
    console.log(`✅ Session created: ${newSession._id} for ${studentName}`);

    io.emit('student-login', { sessionId: newSession._id, studentName, studentId, computerName, labId, systemNumber, loginTime: newSession.loginTime });
    io.to(`session-${newSession._id}`).emit('start-live-stream', { sessionId: newSession._id });

    res.json({ success: true, sessionId: newSession._id });
  } catch(err) {
    console.error("Session login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/student-logout', async (req,res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findById(sessionId);
    if(session) {
      session.status = 'completed';
      session.logoutTime = new Date();
      session.duration = Math.floor((session.logoutTime - session.loginTime)/1000);
      await session.save();

      console.log(`✅ Session ended: ${sessionId} Duration: ${session.duration}s`);
      io.emit('student-logout', { sessionId, studentName: session.studentName, computerName: session.computerName, logoutTime: session.logoutTime, duration: session.duration });
      io.to(`session-${sessionId}`).emit('stop-live-stream', { sessionId });
    }
    res.json({ success: true });
  } catch(err) {
    console.error("Session logout error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/update-screenshot', async (req,res) => {
  try {
    const { sessionId, screenshot } = req.body;
    await Session.findByIdAndUpdate(sessionId, { screenshot });
    io.emit('screenshot-update', { sessionId, screenshot, timestamp: new Date() });
    res.json({ success: true });
  } catch(err) {
    console.error("Screenshot update error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/active-sessions/:labId', async (req,res) => {
  try {
    const labIdParam = req.params.labId.toLowerCase();
    let filter = { status: 'active' };
    if(labIdParam !== 'all') filter.labId = labIdParam.toUpperCase();

    const sessions = await Session.find(filter).sort({ loginTime: -1 });
    res.json({ success: true, sessions });
  } catch(err) {
    console.error("Error fetching active sessions:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const kioskSockets = new Map(); // sessionId -> socket.id
const adminSockets = new Map(); // sessionId -> [adminSocketIds]

io.on('connection', socket => {
  console.log("✅ Socket connected:", socket.id);

  socket.on('register-kiosk', ({ sessionId }) => {
    console.log('📡 Kiosk registered:', sessionId, 'Socket:', socket.id);
    kioskSockets.set(sessionId, socket.id);
    socket.join(`session-${sessionId}`);
  });

  socket.on('register-admin', ({ sessionId }) => {
    if(!adminSockets.has(sessionId)) adminSockets.set(sessionId, []);
    if(!adminSockets.get(sessionId).includes(socket.id)) adminSockets.get(sessionId).push(socket.id);
    socket.join(`session-${sessionId}`);
    console.log('📡 Admin registered:', socket.id, 'Session:', sessionId);
  });

  socket.on('admin-offer', ({ offer, sessionId, adminSocketId }) => {
    const kioskSocketId = kioskSockets.get(sessionId);
    if(kioskSocketId) {
      io.to(kioskSocketId).emit('admin-offer', { offer, sessionId, adminSocketId });
      console.log(`📹 Admin offer forwarded to kiosk ${kioskSocketId} for session ${sessionId}`);
    } else {
      console.warn('⚠️ Kiosk socket not found for session', sessionId);
    }
  });

  socket.on('webrtc-answer', ({ answer, adminSocketId, sessionId }) => {
    io.to(adminSocketId).emit('webrtc-answer', { answer, sessionId });
    console.log(`📹 WebRTC answer sent to admin ${adminSocketId} for session ${sessionId}`);
  });

  socket.on('webrtc-ice-candidate', ({ candidate, sessionId }) => {
    const kioskSocketId = kioskSockets.get(sessionId);
    const admins = adminSockets.get(sessionId) || [];

    if(socket.id === kioskSocketId) {
      admins.forEach(adminId => io.to(adminId).emit('webrtc-ice-candidate', { candidate, sessionId }));
      console.log('🧊 ICE candidate from kiosk broadcasted to admins');
    } else {
      if(kioskSocketId) io.to(kioskSocketId).emit('webrtc-ice-candidate', { candidate, sessionId });
      console.log('🧊 ICE candidate from admin sent to kiosk');
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
    for(const [sessionId, sId] of kioskSockets.entries()) {
      if(sId === socket.id) {
        kioskSockets.delete(sessionId);
        console.log(`🧹 Kiosk removed for session: ${sessionId}`);
      }
    }
    for(const [sessionId, admins] of adminSockets.entries()) {
      const index = admins.indexOf(socket.id);
      if(index > -1) {
        admins.splice(index, 1);
        if(admins.length === 0) adminSockets.delete(sessionId);
        console.log(`🧹 Admin removed for session: ${sessionId}`);
      }
    }
  });
});

const PORT = 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n===============================================`);
  console.log(`✅ Server running on http://192.168.0.100:${PORT}`);
  console.log(`📡 Admin Dashboard root: http://192.168.0.100:${PORT}/`);
  console.log(`===============================================\n`);
});
