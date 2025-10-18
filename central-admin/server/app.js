require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// NEW: CSV Import Dependencies (using secure ExcelJS instead of xlsx)
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const ExcelJS = require('exceljs');

// NEW: Email and OTP Dependencies
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from dashboard directory
app.use(express.static(path.join(__dirname, '../dashboard')));

// Serve student sign-in system
app.use('/student-signin', express.static(path.join(__dirname, '../../student-signin')));

// Serve student management system
app.use('/student-management', express.static(path.join(__dirname, '../../')));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://srijaaanandhan12_db_user:122007@cluster0.2kzkkpe.mongodb.net/college-lab-registration?retryWrites=true&w=majority';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

// Enhanced MongoDB Connection with Connection Pooling
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String },
  dateOfBirth: { type: Date, required: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  labId: { type: String, required: true },
  isPasswordSet: { type: Boolean, default: false },
  registeredAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

studentSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

const Student = mongoose.model('Student', studentSchema);

// Session Schema
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

// Lab Session Schema (for managing entire lab sessions with metadata)
const labSessionSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  faculty: { type: String, required: true },
  year: { type: Number, required: false, default: 1 }, // Made optional for backward compatibility
  department: { type: String, required: false, default: 'Computer Science' }, // Made optional for backward compatibility
  section: { type: String, required: false, default: 'None' }, // Made optional for backward compatibility
  periods: { type: Number, required: true },
  expectedDuration: { type: Number, required: true }, // in minutes
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  createdBy: { type: String, default: 'admin' },
  studentRecords: [{
    studentName: String,
    studentId: String,
    systemNumber: String,
    loginTime: Date,
    logoutTime: Date,
    duration: Number, // in seconds
    status: { type: String, enum: ['active', 'completed'], default: 'active' }
  }]
});

const LabSession = mongoose.model('LabSession', labSessionSchema);

// One-Time Password Schema
const oneTimePasswordSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24 hours
  createdBy: { type: String, default: 'admin' }
});

const OneTimePassword = mongoose.model('OneTimePassword', oneTimePasswordSchema);

// OTP Schema for password reset
const otpSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  email: { type: String, required: true },
  otp: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) } // 10 minutes
});

const OTP = mongoose.model('OTP', otpSchema);

// Email Configuration - Now enabled for real email sending
let emailTransporter = null;

// Create email transporter - Using Gmail SMTP
// You can use any Gmail account or create a dedicated one for the system
const EMAIL_USER = process.env.EMAIL_USER || 'clab7094@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'putsvrfgohwvueaz';

// Always try to create email transporter
try {
  emailTransporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail service
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });
  
  // Test the connection
  emailTransporter.verify((error, success) => {
    if (error) {
      console.log('❌ Email configuration error:', error.message);
      console.log('📧 Falling back to console logging for OTP');
      emailTransporter = null;
    } else {
      console.log('✅ Email server is ready to send emails');
      console.log(`📧 Email configured: ${EMAIL_USER}`);
    }
  });
  
} catch (error) {
  console.log('❌ Failed to create email transporter:', error.message);
  console.log('📧 OTP emails will be logged to console only');
  emailTransporter = null;
}

// Helper Functions
function generateOneTimePassword() {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-character password
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

async function sendOTPEmail(email, otp, studentName) {
  // Always log to console for backup/debugging
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📧 SENDING OTP EMAIL:`);
  console.log(`👤 Student: ${studentName}`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔢 OTP CODE: ${otp}`);
  console.log(`⏰ Valid for: 10 minutes`);
  console.log(`${'='.repeat(60)}\n`);
  
  // If email is not configured, just log the OTP to console
  if (!emailTransporter) {
    console.log(`⚠️ EMAIL NOT CONFIGURED - OTP logged above for manual testing`);
    console.log(`🚨 BACKUP MODE: Copy this OTP → ${otp}`);
    return true; // Return true so the process continues
  }

  // Try to send actual email
  try {
    console.log(`📤 Attempting to send email to: ${email}`);
    
    const mailOptions = {
      from: `"College Lab System" <${EMAIL_USER}>`,
      to: email,
      subject: '🔐 Password Reset OTP - College Lab System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #28a745; margin: 0;">🔐 Password Reset Request</h1>
              <p style="color: #6c757d; margin: 10px 0 0 0;">College Lab Management System</p>
            </div>
            
            <div style="background: #e8f5e9; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #2c3e50;">Dear <strong>${studentName}</strong>,</p>
              <p style="margin: 10px 0 0 0; color: #2c3e50;">You have requested to reset your password for the College Lab System.</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 25px; text-align: center; margin: 25px 0; border-radius: 12px;">
              <p style="margin: 0; font-size: 16px; opacity: 0.9;">Your OTP Code:</p>
              <h1 style="margin: 10px 0 0 0; font-size: 3rem; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #856404;"><strong>⏰ Important:</strong></p>
              <ul style="margin: 10px 0 0 0; color: #856404;">
                <li>This OTP will expire in <strong>10 minutes</strong></li>
                <li>Use this code in the kiosk interface to reset your password</li>
                <li>Do not share this OTP with anyone</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                If you did not request this password reset, please ignore this email.<br>
                This is an automated email from College Lab Management System.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully!`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Email delivered to: ${email}`);
    
    return true;
    
  } catch (error) {
    console.log(`❌ Failed to send email: ${error.message}`);
    console.log(`📧 Falling back to console logging`);
    console.log(`🚨 BACKUP MODE: Copy this OTP → ${otp}`);
    
    // Don't fail the process, just continue with console logging
    return true;
  }
}

// CSV/Excel Import Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files (.csv, .xlsx, .xls) are allowed!'));
    }
  }
});

// Process CSV File
function processCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Process Excel File using ExcelJS (secure alternative to xlsx)
async function processExcelFile(filePath) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet(1); // First worksheet
    const jsonData = [];
    
    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value ? cell.value.toString().trim() : '';
    });
    
    // Process data rows (skip header row)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const rowData = {};
      let hasData = false;
      
      row.eachCell((cell, colNumber) => {
        if (headers[colNumber]) {
          let cellValue = '';
          if (cell.value !== null && cell.value !== undefined) {
            // Handle different cell value types
            if (cell.value instanceof Date) {
              cellValue = cell.value.toISOString().split('T')[0]; // Convert date to YYYY-MM-DD format
            } else if (typeof cell.value === 'object' && cell.value.text) {
              cellValue = cell.value.text; // Rich text
            } else {
              cellValue = cell.value.toString().trim();
            }
            hasData = true;
          }
          rowData[headers[colNumber]] = cellValue;
        }
      });
      
      // Only add row if it has data
      if (hasData && Object.values(rowData).some(val => val && val.length > 0)) {
        jsonData.push(rowData);
      }
    });
    
    return jsonData;
  } catch (error) {
    throw new Error('Error processing Excel file: ' + error.message);
  }
}

// Validate Student Data
function validateStudentData(rawData) {
  const validatedStudents = [];
  const seenIds = new Set();
  const seenEmails = new Set();
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    try {
      const student = {
        name: cleanString(row.name || row.Name || row.student_name || row['Student Name'] || row['Full Name']),
        studentId: cleanString(row.student_id || row.StudentID || row.id || row.ID || row['Student ID'] || row['Roll No']),
        email: cleanString(row.email || row.Email || row.email_address || row['Email Address']),
        dateOfBirth: parseDate(row.dob || row.date_of_birth || row.dateOfBirth || row['Date of Birth'] || row.DOB),
        department: cleanString(row.department || row.Department || row.dept || row.Dept || row['Department Name']),
        year: parseInt(row.year || row.Year || row.class_year || row['Year'] || row['Academic Year'] || 1),
        labId: cleanString(row.lab_id || row.labId || row.lab || row.Lab || row['Lab ID'] || 'LAB-01'),
        isPasswordSet: false,
        registeredAt: new Date(),
        updatedAt: new Date()
      };
      
      // Validate required fields
      if (!student.name || student.name.length < 2) {
        console.warn(`⚠️ Row ${i + 1}: Invalid or missing name`);
        continue;
      }
      
      if (!student.studentId || student.studentId.length < 3) {
        console.warn(`⚠️ Row ${i + 1}: Invalid or missing student ID`);
        continue;
      }
      
      if (!student.dateOfBirth || student.dateOfBirth.getFullYear() < 1980) {
        console.warn(`⚠️ Row ${i + 1}: Invalid date of birth`);
        continue;
      }
      
      if (!student.department || student.department.length < 2) {
        console.warn(`⚠️ Row ${i + 1}: Invalid or missing department`);
        continue;
      }
      
      // Check for duplicates in current batch
      if (seenIds.has(student.studentId.toUpperCase())) {
        console.warn(`⚠️ Row ${i + 1}: Duplicate student ID ${student.studentId}`);
        continue;
      }
      
      // Generate email if missing or invalid
      if (!student.email || !student.email.includes('@') || !student.email.includes('.')) {
        student.email = `${student.studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@college.edu`;
      }
      
      // Check for duplicate emails in current batch
      if (seenEmails.has(student.email.toLowerCase())) {
        // Generate unique email
        student.email = `${student.studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}.${Date.now()}@college.edu`;
      }
      
      // Validate and normalize year
      if (isNaN(student.year) || student.year < 1 || student.year > 4) {
        student.year = 1;
      }
      
      // Normalize department names
      student.department = normalizeDepartment(student.department);
      
      // Normalize student ID (uppercase)
      student.studentId = student.studentId.toUpperCase();
      
      // Add to tracking sets
      seenIds.add(student.studentId);
      seenEmails.add(student.email.toLowerCase());
      
      validatedStudents.push(student);
      
    } catch (error) {
      console.warn(`⚠️ Row ${i + 1}: Validation error:`, error.message);
    }
  }
  
  return validatedStudents;
}

// Helper Functions
function cleanString(str) {
  if (!str) return '';
  return str.toString().trim().replace(/\s+/g, ' '); // Normalize whitespace
}

function parseDate(dateString) {
  if (!dateString) return new Date('2000-01-01');
  
  // Handle Excel date serial numbers
  if (typeof dateString === 'number' && dateString > 25000 && dateString < 50000) {
    // Excel serial date to JS date
    const date = new Date((dateString - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) return date;
  }
  
  const formats = [
    dateString.toString(),
    dateString.toString().replace(/[-/]/g, '-'),
    dateString.toString().replace(/[-/]/g, '/'),
  ];
  
  for (let format of formats) {
    const parsed = new Date(format);
    if (!isNaN(parsed.getTime()) && 
        parsed.getFullYear() > 1980 && 
        parsed.getFullYear() < 2015) {
      return parsed;
    }
  }
  
  return new Date('2000-01-01');
}

function normalizeDepartment(dept) {
  if (!dept) return 'General';
  
  const deptMap = {
    'cs': 'Computer Science',
    'cse': 'Computer Science',
    'computer': 'Computer Science',
    'it': 'Information Technology',
    'information': 'Information Technology',
    'ec': 'Electronics & Communication',
    'ece': 'Electronics & Communication',
    'electronics': 'Electronics & Communication',
    'me': 'Mechanical Engineering',
    'mechanical': 'Mechanical Engineering',
    'ce': 'Civil Engineering',
    'civil': 'Civil Engineering',
    'ee': 'Electrical Engineering',
    'electrical': 'Electrical Engineering',
    'ch': 'Chemical Engineering',
    'chemical': 'Chemical Engineering',
    'bt': 'Biotechnology',
    'bio': 'Biotechnology',
    'ai': 'Artificial Intelligence',
    'ml': 'Machine Learning',
    'ds': 'Data Science',
    'data': 'Data Science'
  };
  
  const normalized = dept.toLowerCase().trim();
  return deptMap[normalized] || dept;
}

// Import Students to Database
async function importStudentsToDatabase(students) {
  let successful = 0;
  let failed = 0;
  const errors = [];
  
  for (let student of students) {
    try {
      const existing = await Student.findOne({ 
        $or: [
          { studentId: student.studentId },
          { email: student.email }
        ]
      });
      
      if (existing) {
        // Update existing student (except password fields)
        await Student.findByIdAndUpdate(existing._id, {
          name: student.name,
          email: student.email,
          dateOfBirth: student.dateOfBirth,
          department: student.department,
          year: student.year,
          labId: student.labId,
          updatedAt: new Date()
          // Keep existing passwordHash and isPasswordSet
        });
        successful++;
        console.log(`✅ Updated existing student: ${student.studentId}`);
      } else {
        const newStudent = new Student(student);
        await newStudent.save();
        successful++;
        console.log(`✅ Added new student: ${student.studentId}`);
      }
      
    } catch (error) {
      failed++;
      errors.push(`${student.studentId || 'Unknown'}: ${error.message}`);
      console.error(`❌ Failed to import ${student.studentId}:`, error.message);
    }
  }
  
  return { successful, failed, errors };
}

// Serve admin dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/index.html'));
});

// NEW: Restore sample data (alias for setup-sample-data)
app.post('/api/restore-sample-data', async (req, res) => {
  try {
    console.log('🗑️ Clearing all existing data...');
    
    // Clear all collections
    await Student.deleteMany({});
    await Session.deleteMany({});
    await OneTimePassword.deleteMany({});
    await OTP.deleteMany({});
    
    console.log('📊 Setting up sample student data...');
    
    // Sample student data including TEST2025001
    const sampleStudents = [
      {
        name: 'Rajesh Kumar',
        studentId: 'CS2021001',
        email: 'rajesh.kumar@college.edu',
        dateOfBirth: new Date('2000-05-15'),
        department: 'Computer Science',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      },
      {
        name: 'Priya Sharma',
        studentId: 'CS2021002',
        email: 'priya.sharma@college.edu',
        dateOfBirth: new Date('2001-08-22'),
        department: 'Computer Science',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      },
      {
        name: 'Arjun Patel',
        studentId: 'IT2021003',
        email: 'arjun.patel@college.edu',
        dateOfBirth: new Date('2000-12-10'),
        department: 'Information Technology',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      },
      {
        name: 'Sneha Reddy',
        studentId: 'CS2021004',
        email: 'sneha.reddy@college.edu',
        dateOfBirth: new Date('2001-03-18'),
        department: 'Computer Science',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      },
      {
        name: 'Vikram Singh',
        studentId: 'IT2021005',
        email: 'vikram.singh@college.edu',
        dateOfBirth: new Date('2000-09-25'),
        department: 'Information Technology',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      },
      {
        name: 'Test User',
        studentId: 'TEST2025001',
        email: '24z258@psgitech.ac.in',
        dateOfBirth: new Date('2000-01-01'),
        department: 'Computer Science',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      }
    ];
    
    // Insert sample students
    const insertedStudents = await Student.insertMany(sampleStudents);
    
    console.log(`✅ Sample data restored: ${insertedStudents.length} students added`);
    
    res.json({
      success: true,
      message: 'Sample data restored successfully',
      studentsAdded: insertedStudents.length,
      students: insertedStudents.map(s => ({
        name: s.name,
        studentId: s.studentId,
        email: s.email,
        department: s.department
      }))
    });
    
  } catch (error) {
    console.error('❌ Sample data restore error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Clear all data and setup sample students
app.post('/api/setup-sample-data', async (req, res) => {
  try {
    console.log('🗑️ Clearing all existing data...');
    
    // Clear all collections
    await Student.deleteMany({});
    await Session.deleteMany({});
    await OneTimePassword.deleteMany({});
    await OTP.deleteMany({});
    
    console.log('📊 Setting up sample student data...');
    
    // Sample student data
    const sampleStudents = [
      {
        name: 'Rajesh Kumar',
        studentId: 'CS2021001',
        email: 'rajesh.kumar@college.edu',
        dateOfBirth: new Date('2000-05-15'),
        department: 'Computer Science',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      },
      {
        name: 'Priya Sharma',
        studentId: 'CS2021002',
        email: 'priya.sharma@college.edu',
        dateOfBirth: new Date('2001-08-22'),
        department: 'Computer Science',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      },
      {
        name: 'Arjun Patel',
        studentId: 'IT2021003',
        email: 'arjun.patel@college.edu',
        dateOfBirth: new Date('2000-12-10'),
        department: 'Information Technology',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      },
      {
        name: 'Sneha Reddy',
        studentId: 'CS2021004',
        email: 'sneha.reddy@college.edu',
        dateOfBirth: new Date('2001-03-18'),
        department: 'Computer Science',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      },
      {
        name: 'Vikram Singh',
        studentId: 'IT2021005',
        email: 'vikram.singh@college.edu',
        dateOfBirth: new Date('2000-09-25'),
        department: 'Information Technology',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      },
      {
        name: 'Test User',
        studentId: 'TEST2025001',
        email: '24z258@psgitech.ac.in',
        dateOfBirth: new Date('2000-01-01'),
        department: 'Computer Science',
        year: 3,
        labId: 'CC1',
        isPasswordSet: false
      }
    ];
    
    // Insert sample students
    const insertedStudents = await Student.insertMany(sampleStudents);
    
    console.log(`✅ Sample data setup complete: ${insertedStudents.length} students added`);
    
    res.json({
      success: true,
      message: 'Sample data setup complete',
      studentsAdded: insertedStudents.length,
      students: insertedStudents.map(s => ({
        name: s.name,
        studentId: s.studentId,
        email: s.email,
        department: s.department
      }))
    });
    
  } catch (error) {
    console.error('❌ Sample data setup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Generate one-time password for a student
app.post('/api/generate-one-time-password', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'Student ID is required' });
    }
    
    // Check if student exists
    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    // Check if student already has a password set
    if (student.isPasswordSet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student already has a password set. Use password reset instead.' 
      });
    }
    
    // Generate one-time password
    const oneTimePass = generateOneTimePassword();
    
    // Remove any existing one-time password for this student
    await OneTimePassword.deleteMany({ studentId: studentId.toUpperCase() });
    
    // Create new one-time password
    const otpRecord = new OneTimePassword({
      studentId: studentId.toUpperCase(),
      password: oneTimePass,
      isUsed: false
    });
    
    await otpRecord.save();
    
    console.log(`✅ One-time password generated for ${studentId}: ${oneTimePass}`);
    
    res.json({
      success: true,
      message: 'One-time password generated successfully',
      studentId: studentId.toUpperCase(),
      studentName: student.name,
      oneTimePassword: oneTimePass,
      expiresAt: otpRecord.expiresAt
    });
    
  } catch (error) {
    console.error('❌ One-time password generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Use one-time password to set permanent password
app.post('/api/use-one-time-password', async (req, res) => {
  try {
    const { studentId, oneTimePassword, newPassword } = req.body;
    
    if (!studentId || !oneTimePassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student ID, one-time password, and new password are required' 
      });
    }
    
    // Find the one-time password record
    const otpRecord = await OneTimePassword.findOne({ 
      studentId: studentId.toUpperCase(),
      password: oneTimePassword.toUpperCase(),
      isUsed: false
    });
    
    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired one-time password' 
      });
    }
    
    // Check if expired
    if (otpRecord.expiresAt < new Date()) {
      await OneTimePassword.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        success: false, 
        error: 'One-time password has expired' 
      });
    }
    
    // Find the student
    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'New password must be at least 6 characters long' 
      });
    }
    
    // Hash the new password and update student
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await Student.findByIdAndUpdate(student._id, {
      passwordHash,
      isPasswordSet: true,
      updatedAt: new Date()
    });
    
    // Mark one-time password as used
    otpRecord.isUsed = true;
    await otpRecord.save();
    
    console.log(`✅ One-time password used successfully for ${studentId}`);
    
    res.json({
      success: true,
      message: 'Password set successfully using one-time password',
      student: {
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        department: student.department
      }
    });
    
  } catch (error) {
    console.error('❌ One-time password usage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DEBUG: List all students in database
app.get('/api/debug-students', async (req, res) => {
  try {
    const students = await Student.find({}, 'studentId name email isPasswordSet department').limit(20);
    res.json({
      success: true,
      count: students.length,
      students: students
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Check student eligibility for first-time sign-in
app.post('/api/check-student-eligibility', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ 
        eligible: false, 
        reason: 'Student ID is required' 
      });
    }
    
    // Find student by ID
    const student = await Student.findOne({ 
      studentId: studentId.toUpperCase()
    });
    
    if (!student) {
      return res.status(400).json({ 
        eligible: false, 
        reason: 'Student ID not found in our records. Please contact admin.' 
      });
    }
    
    // Check if password is already set
    if (student.passwordHash && student.isPasswordSet) {
      return res.status(400).json({ 
        eligible: false, 
        reason: 'Password already set for this account. Use regular login or "Forgot Password".' 
      });
    }
    
    res.json({
      eligible: true,
      studentName: student.name,
      department: student.department,
      year: student.year,
      labId: student.labId
    });
    
  } catch (error) {
    console.error('❌ Student eligibility check error:', error);
    res.status(500).json({ eligible: false, reason: 'Server error. Please try again.' });
  }
});

// NEW: Add individual student
app.post('/api/add-student', async (req, res) => {
  try {
    const { studentId, name, email, dateOfBirth, department, year, labId } = req.body;
    
    // Validate required fields
    if (!studentId || !name || !email || !dateOfBirth || !department || !year || !labId) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required: studentId, name, email, dateOfBirth, department, year, labId' 
      });
    }
    
    // Check if student ID already exists
    const existingStudent = await Student.findOne({ 
      $or: [
        { studentId: studentId.toUpperCase() },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingStudent) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student ID or email already exists' 
      });
    }
    
    // Create new student
    const newStudent = new Student({
      studentId: studentId.toUpperCase(),
      name: name.trim(),
      email: email.toLowerCase(),
      dateOfBirth: new Date(dateOfBirth),
      department: department.trim(),
      year: parseInt(year),
      labId: labId.toUpperCase(),
      isPasswordSet: false
    });
    
    await newStudent.save();
    
    console.log(`✅ New student added: ${newStudent.name} (${newStudent.studentId})`);
    
    res.json({
      success: true,
      message: 'Student added successfully',
      student: {
        studentId: newStudent.studentId,
        name: newStudent.name,
        email: newStudent.email,
        department: newStudent.department,
        year: newStudent.year,
        labId: newStudent.labId
      }
    });
    
  } catch (error) {
    console.error('❌ Add student error:', error);
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'Student ID or email already exists' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// NEW: Student authentication for kiosk login
app.post('/api/authenticate', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    
    if (!studentId || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student ID and password are required' 
      });
    }
    
    // Find student by ID
    const student = await Student.findOne({ 
      studentId: studentId.toUpperCase()
    });
    
    if (!student) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid student ID or password' 
      });
    }
    
    // Check if password is set
    if (!student.passwordHash || !student.isPasswordSet) {
      return res.status(401).json({ 
        success: false, 
        error: 'Password not set. Please complete first-time sign-in online first.' 
      });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, student.passwordHash);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid student ID or password' 
      });
    }
    
    console.log(`✅ Student authenticated: ${student.name} (${student.studentId})`);
    
    res.json({
      success: true,
      message: 'Authentication successful',
      student: {
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        department: student.department,
        year: student.year,
        labId: student.labId
      }
    });
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(500).json({ success: false, error: 'Server error during authentication' });
  }
});

// NEW: Student first-time sign-in (separate web system)
app.post('/api/student-first-signin', async (req, res) => {
  try {
    const { name, studentId, dateOfBirth, password } = req.body;
    
    if (!name || !studentId || !dateOfBirth || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required: name, student ID, date of birth, and password' 
      });
    }
    
    // Find student by ID
    const student = await Student.findOne({ 
      studentId: studentId.toUpperCase()
    });
    
    if (!student) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student not found in our records' 
      });
    }
    
    // Verify date of birth
    const providedDate = new Date(dateOfBirth);
    const storedDate = new Date(student.dateOfBirth);
    
    if (providedDate.toDateString() !== storedDate.toDateString()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Date of birth does not match our records' 
      });
    }
    
    // Check if password is already set
    if (student.passwordHash && student.isPasswordSet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password already set for this account. Use "Forgot Password" if you need to reset it.' 
      });
    }
    
    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Update student with new password and name
    student.name = name; // Allow name update during first signin
    student.passwordHash = passwordHash;
    student.isPasswordSet = true;
    await student.save();
    
    console.log(`✅ First-time sign-in completed via web for: ${student.name} (${student.studentId})`);
    
    res.json({
      success: true,
      message: 'Password set successfully. You can now login at lab computers.',
      student: {
        name: student.name,
        studentId: student.studentId,
        department: student.department,
        labId: student.labId
      }
    });
    
  } catch (error) {
    console.error('❌ Student first-time sign-in error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: First-time sign-in endpoint (legacy - for kiosk)
app.post('/api/first-time-signin', async (req, res) => {
  try {
    const { studentId, email, dateOfBirth, newPassword } = req.body;
    
    if (!studentId || !email || !dateOfBirth || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required: Student ID, email, date of birth, and password' 
      });
    }
    
    // Find student by ID, email, and date of birth
    const student = await Student.findOne({ 
      studentId: studentId.toUpperCase(),
      email: email.toLowerCase()
    });
    
    if (!student) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student not found or email does not match our records' 
      });
    }
    
    // Verify date of birth
    const providedDate = new Date(dateOfBirth);
    const storedDate = new Date(student.dateOfBirth);
    
    if (providedDate.toDateString() !== storedDate.toDateString()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Date of birth does not match our records' 
      });
    }
    
    // Check if password is already set
    if (student.passwordHash && student.isPasswordSet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password already set for this account. Use "Forgot Password" if you need to reset it.' 
      });
    }
    
    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update student with new password
    student.passwordHash = passwordHash;
    student.isPasswordSet = true;
    await student.save();
    
    console.log(`✅ First-time sign-in completed for: ${student.name} (${student.studentId})`);
    
    res.json({
      success: true,
      message: 'Password set successfully. You can now login.',
      student: {
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        department: student.department
      }
    });
    
  } catch (error) {
    console.error('❌ First-time sign-in error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Initiate forgot password with roll number and email
app.post('/api/forgot-password-initiate', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'Student ID (Roll Number) is required' });
    }
    
    // Find student
    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found with this roll number' });
    }
    
    if (!student.isPasswordSet) {
      return res.status(400).json({ 
        success: false, 
        error: 'No password set for this student. Please use first-time sign-in instead.' 
      });
    }
    
    res.json({
      success: true,
      message: 'Student verified. Please provide email for OTP.',
      studentName: student.name,
      maskedEmail: student.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email for security
    });
    
  } catch (error) {
    console.error('❌ Forgot password initiate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Send OTP to email for password reset
app.post('/api/forgot-password-send-otp', async (req, res) => {
  try {
    const { studentId, email } = req.body;
    
    if (!studentId || !email) {
      return res.status(400).json({ success: false, error: 'Student ID and email are required' });
    }
    
    // Find student first
    const student = await Student.findOne({ 
      studentId: studentId.toUpperCase()
    });
    
    if (!student) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student ID not found in our records' 
      });
    }
    
    // For testing purposes, allow any email but warn if it doesn't match
    if (student.email.toLowerCase() !== email.toLowerCase()) {
      console.log(`⚠️ Email mismatch for ${studentId}:`);
      console.log(`   Registered: ${student.email}`);
      console.log(`   Provided: ${email}`);
      console.log(`   Proceeding with OTP send for testing...`);
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Remove any existing OTPs for this student
    await OTP.deleteMany({ studentId: studentId.toUpperCase() });
    
    // Create new OTP record
    const otpRecord = new OTP({
      studentId: studentId.toUpperCase(),
      email: email.toLowerCase(),
      otp: otp
    });
    
    await otpRecord.save();
    
    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, student.name);
    
    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send OTP email. Please try again.' 
      });
    }
    
    console.log(`✅ OTP sent to ${email} for student ${studentId}`);
    
    res.json({
      success: true,
      message: 'OTP sent to your email address',
      studentName: student.name,
      email: email,
      expiresIn: '10 minutes'
    });
    
  } catch (error) {
    console.error('❌ OTP send error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Verify OTP and reset password
app.post('/api/forgot-password-verify-otp', async (req, res) => {
  try {
    const { studentId, email, otp, newPassword } = req.body;
    
    if (!studentId || !email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required: Student ID, email, OTP, and new password' 
      });
    }
    
    // Find and verify OTP
    const otpRecord = await OTP.findOne({
      studentId: studentId.toUpperCase(),
      email: email.toLowerCase(),
      otp: otp,
      isUsed: false
    });
    
    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid OTP or OTP already used' 
      });
    }
    
    // Check if OTP expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        success: false, 
        error: 'OTP has expired. Please request a new one.' 
      });
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'New password must be at least 6 characters long' 
      });
    }
    
    // Find student and update password
    const student = await Student.findOne({ 
      studentId: studentId.toUpperCase(),
      email: email.toLowerCase()
    });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await Student.findByIdAndUpdate(student._id, {
      passwordHash,
      updatedAt: new Date()
    });
    
    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();
    
    console.log(`✅ Password reset successful for ${studentId} via OTP`);
    
    res.json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.',
      student: {
        name: student.name,
        studentId: student.studentId,
        email: student.email
      }
    });
    
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload and Import Students from CSV/Excel
app.post('/api/import-students', upload.single('studentFile'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    console.log(`📁 Processing file: ${req.file.originalname} (${fileExtension})`);
    
    let studentsData = [];
    
    if (fileExtension === '.csv') {
      studentsData = await processCSVFile(filePath);
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      studentsData = await processExcelFile(filePath);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Unsupported file format. Please use CSV or Excel files.' 
      });
    }
    
    console.log(`📊 Raw data extracted: ${studentsData.length} rows`);
    
    const validatedStudents = validateStudentData(studentsData);
    
    console.log(`✅ Validated students: ${validatedStudents.length} records`);
    
    if (validatedStudents.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid student records found in file. Please check the format and required fields.' 
      });
    }
    
    const clearExisting = req.body.clearExisting === 'true';
    if (clearExisting) {
      const deletedCount = await Student.countDocuments();
      await Student.deleteMany({});
      console.log(`🗑️ Cleared ${deletedCount} existing student records`);
    }
    
    const importResult = await importStudentsToDatabase(validatedStudents);
    
    console.log(`✅ Import completed: ${importResult.successful} successful, ${importResult.failed} failed`);
    
    res.json({
      success: true,
      message: 'Students imported successfully',
      stats: {
        totalProcessed: studentsData.length,
        validatedRecords: validatedStudents.length,
        successful: importResult.successful,
        failed: importResult.failed,
        errors: importResult.errors.slice(0, 10) // Limit error messages
      }
    });
    
  } catch (error) {
    console.error('❌ Import error:', error);
    res.status(500).json({ 
      success: false, 
      error: `Import failed: ${error.message}` 
    });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up uploaded file:', cleanupError.message);
      }
    }
  }
});

// Download Sample CSV Template
app.get('/api/download-template', (req, res) => {
  const sampleData = [
    {
      'Student ID': '2024CS001',
      'Name': 'John Doe',
      'Email': 'john.doe@college.edu',
      'Date of Birth': '2002-01-15',
      'Department': 'Computer Science',
      'Year': 3,
      'Lab ID': 'LAB-01'
    },
    {
      'Student ID': '2024IT002',
      'Name': 'Jane Smith',
      'Email': 'jane.smith@college.edu',
      'Date of Birth': '2001-08-22',
      'Department': 'Information Technology',
      'Year': 2,
      'Lab ID': 'LAB-02'
    },
    {
      'Student ID': '2024EC003',
      'Name': 'Mike Wilson',
      'Email': 'mike.wilson@college.edu',
      'Date of Birth': '2000-12-10',
      'Department': 'Electronics & Communication',
      'Year': 4,
      'Lab ID': 'LAB-03'
    },
    {
      'Student ID': '2024ME004',
      'Name': 'Sarah Johnson',
      'Email': 'sarah.johnson@college.edu',
      'Date of Birth': '2001-07-05',
      'Department': 'Mechanical Engineering',
      'Year': 2,
      'Lab ID': 'LAB-04'
    },
    {
      'Student ID': '2024CE005',
      'Name': 'David Brown',
      'Email': 'david.brown@college.edu',
      'Date of Birth': '2000-03-12',
      'Department': 'Civil Engineering',
      'Year': 4,
      'Lab ID': 'LAB-05'
    }
  ];
  
  const csvHeader = Object.keys(sampleData[0]).join(',') + '\n';
  const csvData = sampleData.map(row => 
    Object.values(row).map(val => `"${val}"`).join(',')
  ).join('\n');
  
  const csvContent = csvHeader + csvData;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student-template.csv"');
  res.send(csvContent);
});

// Student Registration API
app.post('/api/student-register', async (req, res) => {
  try {
    const { name, studentId, email, password, dateOfBirth, department, year, labId } = req.body;
    
    if (!name || !studentId || !email || !password || !dateOfBirth || !department || !year || !labId) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }

    const existing = await Student.findOne({ $or: [{ studentId }, { email }] });
    if (existing) {
      return res.status(400).json({ success: false, error: "Student ID or email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const student = new Student({ 
      name, 
      studentId, 
      email, 
      passwordHash, 
      dateOfBirth, 
      department, 
      year, 
      labId,
      isPasswordSet: true
    });
    
    await student.save();
    console.log(`✅ Student registered: ${studentId}`);
    
    res.json({ success: true, message: "Student registered successfully." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Student Authentication API
app.post('/api/student-authenticate', async (req, res) => {
  try {
    const { studentId, password, labId } = req.body;
    
    const student = await Student.findOne({ studentId, labId });
    if (!student) {
      return res.status(400).json({ success: false, error: "Invalid student or lab" });
    }

    if (!student.isPasswordSet || !student.passwordHash) {
      return res.status(400).json({ 
        success: false, 
        error: "Password not set. Please complete first-time signin first." 
      });
    }

    const isValid = await student.verifyPassword(password);
    if (!isValid) {
      return res.status(400).json({ success: false, error: "Incorrect password" });
    }

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
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// First-time signin API
app.post('/api/student-first-signin', async (req, res) => {
  try {
    const { name, studentId, dateOfBirth, password } = req.body;
    
    if (!name || !studentId || !dateOfBirth || !password) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const student = await Student.findOne({ 
      studentId: studentId.toUpperCase(),
      name: { $regex: new RegExp(name.trim(), 'i') }
    });

    if (!student) {
      return res.status(400).json({ success: false, error: "Student details not found in database" });
    }

    if (student.isPasswordSet) {
      return res.status(400).json({ success: false, error: "Password already set for this student. Use login instead." });
    }

    const providedDOB = new Date(dateOfBirth);
    const studentDOB = new Date(student.dateOfBirth);
    
    if (providedDOB.toDateString() !== studentDOB.toDateString()) {
      return res.status(400).json({ success: false, error: "Date of birth does not match our records" });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await Student.findByIdAndUpdate(student._id, { 
      passwordHash,
      isPasswordSet: true,
      updatedAt: new Date()
    });

    console.log(`✅ First-time signin completed for: ${studentId}`);
    res.json({ 
      success: true, 
      message: "Password set successfully! You can now login at kiosk.",
      student: {
        name: student.name,
        studentId: student.studentId,
        department: student.department,
        labId: student.labId
      }
    });

  } catch (error) {
    console.error("First-time signin error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check student eligibility
app.post('/api/check-student-eligibility', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    
    if (!student) {
      return res.json({ eligible: false, reason: "Student ID not found" });
    }
    
    if (student.isPasswordSet) {
      return res.json({ eligible: false, reason: "Password already set. Use login instead." });
    }
    
    res.json({ 
      eligible: true, 
      studentName: student.name,
      department: student.department 
    });

  } catch (error) {
    console.error("Eligibility check error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Password Reset API
app.post('/api/reset-password', async (req, res) => {
  try {
    const { studentId, dateOfBirth, newPassword } = req.body;
    
    if (!studentId || !dateOfBirth || !newPassword) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (!student) {
      return res.status(400).json({ success: false, error: "Student not found" });
    }

    if (!student.isPasswordSet) {
      return res.status(400).json({ 
        success: false, 
        error: "No password set yet. Please complete first-time signin first." 
      });
    }

    const providedDate = new Date(dateOfBirth);
    const studentDOB = new Date(student.dateOfBirth);
    
    if (providedDate.toDateString() !== studentDOB.toDateString()) {
      return res.status(400).json({ success: false, error: "Date of birth does not match our records" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters" });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await Student.findByIdAndUpdate(student._id, { 
      passwordHash,
      updatedAt: new Date()
    });

    console.log(`✅ Password reset successful for: ${studentId}`);
    res.json({ 
      success: true, 
      message: "Password reset successful! You can now login with your new password.",
      student: {
        name: student.name,
        studentId: student.studentId
      }
    });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Student Login (Create Session)
app.post('/api/student-login', async (req, res) => {
  try {
    const { studentName, studentId, computerName, labId, systemNumber } = req.body;

    // End any existing session for this computer
    await Session.updateMany(
      { computerName, status: 'active' }, 
      { status: 'completed', logoutTime: new Date() }
    );

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
    
    // Update active lab session with this student record
    try {
      const activeLabSession = await LabSession.findOne({ status: 'active' });
      if (activeLabSession) {
        console.log(`📚 Found active lab session: ${activeLabSession.subject} (ID: ${activeLabSession._id})`);
        
        // Remove any existing record for this system
        activeLabSession.studentRecords = activeLabSession.studentRecords.filter(
          record => record.systemNumber !== systemNumber
        );
        
        // Add new student record
        activeLabSession.studentRecords.push({
          studentName,
          studentId,
          systemNumber,
          loginTime: newSession.loginTime,
          status: 'active'
        });
        
        await activeLabSession.save();
        console.log(`📚 Added ${studentName} to lab session: ${activeLabSession.subject}`);
      } else {
        console.log(`⚠️ No active lab session found. Student ${studentName} logged in but not tracked in lab session.`);
      }
    } catch (labSessionError) {
      console.error(`❌ Error updating lab session:`, labSessionError);
      // Continue with student login even if lab session update fails
    }
    
    console.log(`✅ Session created: ${newSession._id} for ${studentName}`);

    // Notify admins of new session
    io.to('admins').emit('session-created', { 
      sessionId: newSession._id, 
      studentName, 
      studentId, 
      computerName, 
      labId, 
      systemNumber, 
      loginTime: newSession.loginTime 
    });

    io.emit('start-live-stream', { sessionId: newSession._id });

    res.json({ success: true, sessionId: newSession._id });
  } catch (error) {
    console.error("Session login error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Student Logout (End Session)
app.post('/api/student-logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const session = await Session.findById(sessionId);
    if (session) {
      session.status = 'completed';
      session.logoutTime = new Date();
      session.duration = Math.floor((session.logoutTime - session.loginTime) / 1000);
      await session.save();

      // Update active lab session with logout info
      const activeLabSession = await LabSession.findOne({ status: 'active' });
      if (activeLabSession) {
        const studentRecord = activeLabSession.studentRecords.find(
          record => record.systemNumber === session.systemNumber && record.status === 'active'
        );
        
        if (studentRecord) {
          studentRecord.logoutTime = session.logoutTime;
          studentRecord.duration = session.duration;
          studentRecord.status = 'completed';
          
          await activeLabSession.save();
          console.log(`📚 Updated logout for ${session.studentName} in lab session: ${activeLabSession.subject}`);
        }
      }

      console.log(`✅ Session ended: ${sessionId} - Duration: ${session.duration}s`);

      // Notify admins of session end
      io.to('admins').emit('session-ended', { 
        sessionId, 
        studentName: session.studentName, 
        computerName: session.computerName, 
        logoutTime: session.logoutTime, 
        duration: session.duration 
      });

      io.emit('stop-live-stream', { sessionId });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Session logout error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update session screenshot
app.post('/api/update-screenshot', async (req, res) => {
  try {
    const { sessionId, screenshot } = req.body;
    await Session.findByIdAndUpdate(sessionId, { screenshot });
    io.emit('screenshot-update', { sessionId, screenshot, timestamp: new Date() });
    res.json({ success: true });
  } catch (error) {
    console.error("Screenshot update error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active sessions
app.get('/api/active-sessions/:labId', async (req, res) => {
  try {
    const labIdParam = req.params.labId.toLowerCase();
    let filter = { status: 'active' };
    
    if (labIdParam !== 'all') {
      filter.labId = labIdParam.toUpperCase();
    }
    
    const sessions = await Session.find(filter).sort({ loginTime: -1 });
    res.json({ success: true, sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({}, '-passwordHash')
      .sort({ studentId: 1 });
    res.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get students by department
app.get('/api/students/department/:dept', async (req, res) => {
  try {
    const department = req.params.dept;
    const students = await Student.find({ department }, '-passwordHash')
      .sort({ studentId: 1 });
    res.json({ success: true, students, count: students.length });
  } catch (error) {
    console.error("Error fetching students by department:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Database statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const passwordsSet = await Student.countDocuments({ isPasswordSet: true });
    const pendingPasswords = await Student.countDocuments({ isPasswordSet: false });
    
    const departmentStats = await Student.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const yearStats = await Student.aggregate([
      { $group: { _id: "$year", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalStudents,
        passwordsSet,
        pendingPasswords,
        departments: departmentStats,
        years: yearStats
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search students
app.get('/api/students/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const students = await Student.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { studentId: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }, '-passwordHash').sort({ studentId: 1 }).limit(50);
    
    res.json({ success: true, students, count: students.length });
  } catch (error) {
    console.error("Error searching students:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export all sessions to CSV
app.get('/api/export-sessions', async (req, res) => {
  try {
    const { startDate, endDate, labId, status } = req.query;
    
    // Build filter query
    let filter = {};
    
    if (startDate && endDate) {
      filter.loginTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }
    
    if (labId && labId !== 'all') {
      filter.labId = labId.toUpperCase();
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    console.log('📊 Exporting sessions with filter:', filter);
    
    const sessions = await Session.find(filter)
      .sort({ loginTime: -1 })
      .lean();
    
    console.log(`📊 Found ${sessions.length} sessions to export`);
    
    // Prepare CSV data
    const csvData = sessions.map(session => ({
      'Session ID': session._id.toString(),
      'Student Name': session.studentName || 'N/A',
      'Student ID': session.studentId || 'N/A',
      'Computer Name': session.computerName || 'N/A',
      'Lab ID': session.labId || 'N/A',
      'System Number': session.systemNumber || 'N/A',
      'Login Time': session.loginTime ? new Date(session.loginTime).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : 'N/A',
      'Logout Time': session.logoutTime ? new Date(session.logoutTime).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : 'Still Active',
      'Duration (seconds)': session.duration || (session.status === 'active' ? 'Ongoing' : 'N/A'),
      'Duration (formatted)': session.duration ? formatDuration(session.duration) : (session.status === 'active' ? 'Ongoing' : 'N/A'),
      'Status': session.status || 'unknown',
      'Date': session.loginTime ? new Date(session.loginTime).toLocaleDateString('en-IN') : 'N/A'
    }));
    
    // Convert to CSV
    const csvHeaders = Object.keys(csvData[0] || {}).join(',') + '\n';
    const csvRows = csvData.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const csvContent = csvHeaders + csvRows;
    
    // Set response headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `lab-sessions-${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    
    console.log(`✅ Exporting ${sessions.length} sessions as ${filename}`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('❌ Export sessions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to format duration
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Get session history with pagination
app.get('/api/session-history', async (req, res) => {
  try {
    const { page = 1, limit = 50, labId, status, startDate, endDate } = req.query;
    
    let filter = {};
    
    if (labId && labId !== 'all') {
      filter.labId = labId.toUpperCase();
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (startDate && endDate) {
      filter.loginTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sessions = await Session.find(filter)
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const totalSessions = await Session.countDocuments(filter);
    const totalPages = Math.ceil(totalSessions / parseInt(limit));
    
    res.json({
      success: true,
      sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSessions,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Session history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all sessions from database
app.post('/api/clear-all-sessions', async (req, res) => {
  try {
    console.log('🗑️ Clearing all sessions from database...');
    
    const result = await Session.deleteMany({});
    
    console.log(`✅ Cleared ${result.deletedCount} sessions from database`);
    
    // Emit event to all connected clients
    io.emit('sessions-cleared', { 
      message: 'All sessions have been cleared',
      deletedCount: result.deletedCount,
      timestamp: new Date()
    });
    
    res.json({ 
      success: true, 
      message: `Successfully cleared ${result.deletedCount} sessions`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Clear sessions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket: Socket.io WebRTC signaling
// Lab Session Management API Endpoints

// Start Lab Session
app.post('/api/start-lab-session', async (req, res) => {
  try {
    const { subject, faculty, year, department, section, periods, startTime, expectedDuration } = req.body;
    
    // Only clear incomplete lab sessions, NOT student sessions
    console.log('🧹 Cleaning up incomplete lab sessions only...');
    
    // Clean up any incomplete lab sessions that might cause validation issues
    await LabSession.deleteMany({ 
      $or: [
        { subject: { $exists: false } },
        { faculty: { $exists: false } },
        { periods: { $exists: false } }
      ]
    });
    
    // End any existing active lab sessions (but keep student sessions)
    await LabSession.updateMany(
      { status: 'active' },
      { status: 'completed', endTime: new Date() }
    );
    
    console.log('✅ Ready to start new lab session (student sessions preserved)...');
    
    // Create new lab session
    const newLabSession = new LabSession({
      subject,
      faculty,
      year,
      department,
      section,
      periods,
      expectedDuration,
      startTime: new Date(startTime),
      status: 'active',
      studentRecords: []
    });
    
    await newLabSession.save();
    
    // Check how many student sessions are still active
    const activeStudentSessions = await Session.countDocuments({ status: 'active' });
    console.log(`🚀 Lab session started: ${subject} by ${faculty} - ${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year ${department} ${section !== 'None' ? 'Section ' + section : ''}`);    
    console.log(`📊 Active student sessions preserved: ${activeStudentSessions}`);
    
    res.json({ 
      success: true, 
      session: {
        _id: newLabSession._id,
        subject: newLabSession.subject,
        faculty: newLabSession.faculty,
        year: newLabSession.year,
        department: newLabSession.department,
        section: newLabSession.section,
        periods: newLabSession.periods,
        expectedDuration: newLabSession.expectedDuration,
        startTime: newLabSession.startTime,
        status: newLabSession.status
      },
      message: 'Lab session started successfully'
    });
    
  } catch (error) {
    console.error('Error starting lab session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// End Lab Session
app.post('/api/end-lab-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Handle force clear
    if (sessionId === 'force-clear' || sessionId === 'clear-all') {
      await LabSession.deleteMany({});
      await Session.updateMany({ status: 'active' }, { status: 'completed', logoutTime: new Date() });
      console.log('🧹 Force cleared all lab sessions');
      return res.json({ success: true, message: 'All lab sessions force cleared' });
    }
    
    const labSession = await LabSession.findById(sessionId);
    if (!labSession) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lab session not found' 
      });
    }
    
    // Update lab session status
    labSession.status = 'completed';
    labSession.endTime = new Date();
    await labSession.save();
    
    // Clear all individual student sessions with proper duration calculation
    const activeSessions = await Session.find({ status: 'active' });
    const currentTime = new Date();
    
    for (const session of activeSessions) {
      const durationMs = currentTime - session.loginTime;
      const durationSeconds = Math.floor(durationMs / 1000);
      
      await Session.findByIdAndUpdate(session._id, {
        status: 'completed',
        logoutTime: currentTime,
        duration: durationSeconds
      });
    }
    
    console.log(`🛑 Updated ${activeSessions.length} active sessions to completed`);
    
    console.log(`🛑 Lab session ended: ${labSession.subject}`);
    
    // Notify all admins that the lab session has ended
    io.to('admins').emit('lab-session-ended', {
      sessionId: labSession._id,
      subject: labSession.subject,
      clearedSessions: activeSessions.length
    });
    
    res.json({ 
      success: true, 
      message: 'Lab session ended and all data cleared successfully'
    });
    
  } catch (error) {
    console.error('Error ending lab session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Force clear everything - emergency endpoint
app.post('/api/force-clear-all', async (req, res) => {
  try {
    console.log('🚨 EMERGENCY: Force clearing ALL data...');
    
    // Delete all lab sessions
    const labResult = await LabSession.deleteMany({});
    
    // Set all individual sessions to completed with proper duration
    const activeSessionsForClear = await Session.find({ status: 'active' });
    const clearTime = new Date();
    
    for (const session of activeSessionsForClear) {
      const durationMs = clearTime - session.loginTime;
      const durationSeconds = Math.floor(durationMs / 1000);
      
      await Session.findByIdAndUpdate(session._id, {
        status: 'completed',
        logoutTime: clearTime,
        duration: durationSeconds
      });
    }
    
    const sessionResult = { modifiedCount: activeSessionsForClear.length };
    
    console.log(`🧹 Deleted ${labResult.deletedCount} lab sessions`);
    console.log(`🧹 Completed ${sessionResult.modifiedCount} individual sessions`);
    
    res.json({
      success: true,
      message: `Emergency clear completed: ${labResult.deletedCount} lab sessions deleted, ${sessionResult.modifiedCount} individual sessions completed`,
      labSessionsDeleted: labResult.deletedCount,
      individualSessionsCompleted: sessionResult.modifiedCount
    });
  } catch (error) {
    console.error('Error in emergency clear:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clean up problematic lab sessions
app.post('/api/cleanup-lab-sessions', async (req, res) => {
  try {
    // Remove any lab sessions that might have validation issues
    const result = await LabSession.deleteMany({
      $or: [
        { subject: { $exists: false } },
        { faculty: { $exists: false } },
        { periods: { $exists: false } },
        { year: { $exists: false } },
        { department: { $exists: false } },
        { section: { $exists: false } }
      ]
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} problematic lab sessions`);
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} problematic lab sessions`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up lab sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug current active session
app.get('/api/debug-current-session', async (req, res) => {
  try {
    const activeLabSession = await LabSession.findOne({ status: 'active' });
    const allSessions = await Session.find({}).sort({ loginTime: -1 }).limit(10);
    const activeSessions = await Session.find({ status: 'active' });
    
    res.json({
      success: true,
      debug: {
        activeLabSession: activeLabSession,
        activeLabSessionStudentRecords: activeLabSession ? activeLabSession.studentRecords : null,
        recentIndividualSessions: allSessions,
        activeIndividualSessions: activeSessions,
        counts: {
          labSessionStudents: activeLabSession ? activeLabSession.studentRecords.length : 0,
          activeIndividualSessions: activeSessions.length,
          recentIndividualSessions: allSessions.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to check session data
app.get('/api/debug-session-data/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const labSession = await LabSession.findById(sessionId);
    const allSessions = await Session.find({}).sort({ loginTime: -1 }).limit(10);
    const activeSessions = await Session.find({ status: 'active' });
    
    res.json({
      success: true,
      debug: {
        labSession: labSession,
        recentSessions: allSessions,
        activeSessions: activeSessions,
        labSessionStudentRecords: labSession ? labSession.studentRecords : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export Session Data
app.get('/api/export-session-data/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const labSession = await LabSession.findById(sessionId);
    if (!labSession) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lab session not found' 
      });
    }
    
    console.log(`📊 Lab session found: ${labSession.subject} - Start time: ${labSession.startTime}`);
    console.log(`📊 Lab session embedded student records: ${labSession.studentRecords ? labSession.studentRecords.length : 0}`);
    
    // PRIORITY 1: Use embedded student records from lab session (most reliable)
    let finalStudentRecords = [];
    
    if (labSession.studentRecords && labSession.studentRecords.length > 0) {
      console.log(`📊 Using embedded student records from lab session: ${labSession.studentRecords.length}`);
      finalStudentRecords = labSession.studentRecords;
    } else {
      // PRIORITY 2: Get individual session records during this lab session period
      console.log(`📊 No embedded records, checking individual Session records...`);
      const studentRecords = await Session.find({
        loginTime: { $gte: labSession.startTime },
        ...(labSession.endTime && { loginTime: { $lte: labSession.endTime } })
      }).sort({ loginTime: 1 });
      
      console.log(`📊 Found ${studentRecords.length} individual session records`);
      finalStudentRecords = studentRecords;
    }
    
    // PRIORITY 3: If still no records, get ALL active sessions (fallback)
    if (finalStudentRecords.length === 0) {
      console.log(`📊 No records found, using ALL active sessions as fallback...`);
      const allActiveSessions = await Session.find({ status: 'active' }).sort({ loginTime: 1 });
      console.log(`📊 Found ${allActiveSessions.length} active sessions as fallback`);
      finalStudentRecords = allActiveSessions;
    }
    
    console.log(`📊 FINAL: Will export ${finalStudentRecords.length} student records`);
    console.log(`📊 Student names in export:`, finalStudentRecords.map(r => r.studentName));
    
    res.json({
      success: true,
      sessionData: {
        subject: labSession.subject,
        faculty: labSession.faculty,
        year: labSession.year,
        department: labSession.department,
        section: labSession.section,
        periods: labSession.periods,
        expectedDuration: labSession.expectedDuration,
        startTime: labSession.startTime,
        endTime: labSession.endTime
      },
      studentRecords: finalStudentRecords.map(record => ({
        studentName: record.studentName,
        studentId: record.studentId,
        systemNumber: record.systemNumber,
        loginTime: record.loginTime,
        logoutTime: record.logoutTime,
        duration: record.duration,
        status: record.status
      }))
    });
    
  } catch (error) {
    console.error('Error exporting session data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const kioskSockets = new Map();
const adminSockets = new Map();

io.on('connection', (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on('computer-online', (data) => { 
    console.log("💻 Computer online:", data); 
  });

  socket.on('screen-share', (data) => { 
    socket.broadcast.emit('live-screen', data); 
  });

  socket.on('register-kiosk', ({ sessionId }) => {
    console.log('📡 Kiosk registered:', sessionId, 'Socket:', socket.id);
    kioskSockets.set(sessionId, socket.id);
    socket.join(`session-${sessionId}`);
  });
  
  // Handle kiosk screen ready event
  socket.on('kiosk-screen-ready', ({ sessionId, hasVideo, timestamp }) => {
    console.log('🎉 KIOSK SCREEN READY:', sessionId, 'Has Video:', hasVideo);
    // Notify all admins that this kiosk's screen is ready for monitoring
    io.to('admins').emit('kiosk-screen-ready', { 
      sessionId, 
      hasVideo, 
      timestamp,
      kioskSocketId: socket.id
    });
    console.log('📡 Notified admins: Kiosk screen ready for session:', sessionId);
  });

  socket.on('admin-offer', ({ offer, sessionId, adminSocketId }) => {
    const kioskSocketId = kioskSockets.get(sessionId);
    const isModal = adminSocketId && adminSocketId.includes('-modal');
    console.log('📹 Admin offer for session:', sessionId, '-> Kiosk:', kioskSocketId, 'Modal:', isModal);
    
    if (!adminSockets.has(sessionId)) {
      adminSockets.set(sessionId, []);
    }
    if (!adminSockets.get(sessionId).includes(adminSocketId)) {
      adminSockets.get(sessionId).push(adminSocketId);
    }
    
    if (kioskSocketId) {
      console.log('📤 Forwarding offer to kiosk:', kioskSocketId);
      io.to(kioskSocketId).emit('admin-offer', { offer, sessionId, adminSocketId });
    } else {
      console.warn('⚠️ Kiosk not found for session:', sessionId);
      // Send error back to admin
      const targetSocketId = adminSocketId.replace('-modal', '');
      io.to(targetSocketId).emit('webrtc-error', { 
        sessionId, 
        error: 'Student not connected' 
      });
    }
  });

  socket.on('webrtc-answer', ({ answer, adminSocketId, sessionId }) => {
    console.log('📹 WebRTC answer for admin:', adminSocketId, 'session:', sessionId);
    
    // Handle both regular and modal admin socket IDs
    let targetSocketId = adminSocketId;
    if (adminSocketId && adminSocketId.includes('-modal')) {
      // Extract the base socket ID for modal connections
      targetSocketId = adminSocketId.replace('-modal', '');
    }
    
    io.to(targetSocketId).emit('webrtc-answer', { answer, sessionId, adminSocketId });
  });

  socket.on('webrtc-ice-candidate', ({ candidate, sessionId }) => {
    console.log('🧊 SERVER: ICE candidate for session:', sessionId, 'from:', socket.id);
    
    const kioskSocketId = kioskSockets.get(sessionId);
    const admins = adminSockets.get(sessionId) || [];
    
    if (socket.id === kioskSocketId) {
      console.log('🧊 SERVER: ICE from KIOSK -> sending to', admins.length, 'admin(s)');
      admins.forEach(adminId => {
        io.to(adminId).emit('webrtc-ice-candidate', { candidate, sessionId });
      });
    } else {
      console.log('🧊 SERVER: ICE from ADMIN -> sending to kiosk:', kioskSocketId);
      if (kioskSocketId) {
        io.to(kioskSocketId).emit('webrtc-ice-candidate', { candidate, sessionId });
      }
    }
  });

  // Admin registration and session management
  socket.on('register-admin', () => {
    console.log('👨‍💼 Admin registered:', socket.id);
    socket.join('admins');
  });

  socket.on('get-active-sessions', async () => {
    try {
      console.log('📋 Admin requesting active sessions');
      const activeSessions = await Session.find({ status: 'active' }).sort({ loginTime: -1 });
      socket.emit('active-sessions', activeSessions);
    } catch (error) {
      console.error('❌ Error getting active sessions:', error);
      socket.emit('active-sessions', []);
    }
  });

  socket.on('disconnect', () => { 
    console.log("❌ Socket disconnected:", socket.id); 
    
    for (const [sessionId, sId] of kioskSockets.entries()) {
      if (sId === socket.id) {
        kioskSockets.delete(sessionId);
        console.log('🧹 Cleaned up kiosk for session:', sessionId);
      }
    }
    
    for (const [sessionId, admins] of adminSockets.entries()) {
      const index = admins.indexOf(socket.id);
      if (index > -1) {
        admins.splice(index, 1);
        if (admins.length === 0) {
          adminSockets.delete(sessionId);
        }
        console.log('🧹 Cleaned up admin for session:', sessionId);
      }
    }
  });
});

const PORT = process.env.PORT || 7401;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔐 College Lab Registration System`);
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Local Access: http://localhost:${PORT}`);
  console.log(`🌐 Network Access: http://10.10.194.103:${PORT}`); // CURRENT IP
  console.log(`📊 CSV/Excel Import: http://10.10.194.103:${PORT}/import.html`); // CURRENT IP
  console.log(`📚 Student Database: Import via CSV/Excel files (ExcelJS - Secure)`);
  console.log(`🔑 Password reset: Available via DOB verification`);
  console.log(`📊 API Endpoints: /api/import-students, /api/download-template, /api/stats`);
  console.log(`🛡️ Security: Using ExcelJS (no prototype pollution vulnerability)`);
  console.log(`${'='.repeat(60)}\n`);
});
