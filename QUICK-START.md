# ⚡ QUICK START GUIDE - College Deployment

**Server IP:** 10.10.46.182:7401  
**Current Machine:** Your Laptop (Development)  
**Target Machines:** College Lab (2 computers)

---

## 🎯 YOUR DEPLOYMENT PLAN

```
Development Laptop (Your current machine)
    ↓
    └── Copy to USB drive or network share
            ↓
            ├── Server Machine (10.10.46.182)
            └── Student Machine (10.10.46.128)
```

---

## 📦 STEP 1: PREPARE FOR DEPLOYMENT

### On Your Laptop (RIGHT NOW)

**Option A: USB Drive (Recommended)**
```powershell
# Copy entire folder to USB
xcopy d:\screen_mirror E:\screen_mirror\ /E /I /H

# E: is your USB drive letter
```

**Option B: Create ZIP file**
```powershell
# Right-click folder → Send to → Compressed (zipped) folder
# Or use 7-Zip/WinRAR
```

**What to bring:**
- ✅ USB drive with screen_mirror folder
- ✅ Node.js installer (download from https://nodejs.org)
- ✅ This guide (print or on phone)
- ✅ Network cable (just in case)

---

## 🖥️ STEP 2: SERVER MACHINE SETUP (10.10.46.182)

### A. Set Network IP

1. Press `Win + R`, type `ncpa.cpl`, Enter
2. Right-click network → Properties
3. IPv4 Properties:
   - IP: **10.10.46.182**
   - Subnet: **255.255.255.0**
   - Gateway: **10.10.46.1** (ask IT)
4. Test: `ping 10.10.46.182`

### B. Copy Files

```powershell
# From USB
xcopy E:\screen_mirror C:\screen_mirror\ /E /I /H

# Verify
dir C:\screen_mirror
```

### C. Install Dependencies

```powershell
# If Node.js not installed, run installer first

cd C:\screen_mirror
.\DEPLOY-SERVER.bat
```

This script will:
- ✅ Check Node.js
- ✅ Install all packages
- ✅ Create .env file
- ✅ Create start-server.bat

### D. Configure Firewall

```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "Lab Server" -Direction Inbound -Protocol TCP -LocalPort 7401 -Action Allow
```

Or manually:
1. Windows Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port → TCP → 7401 → Allow

### E. Start Server

```powershell
cd C:\screen_mirror
.\start-server.bat
```

**Expected output:**
```
✅ MongoDB connected successfully
✅ Server running on port 7401
🌐 Network Access: http://10.10.46.182:7401
```

### F. Test from Your Laptop

1. Connect to same network as server
2. Open browser: `http://10.10.46.182:7401`
3. Should see admin dashboard ✅

---

## 💻 STEP 3: STUDENT MACHINE SETUP (10.10.46.128)

### A. Set Network IP (if needed)

Same as server, but use: **10.10.46.128**

### B. Copy Files

```powershell
# Option 1: Copy from server (if network share setup)
xcopy \\10.10.46.182\screen_mirror\student-kiosk C:\LabKiosk\ /E /I /H

# Option 2: Copy from USB
xcopy E:\screen_mirror\student-kiosk C:\LabKiosk\ /E /I /H
```

### C. Install Dependencies

```powershell
cd C:\LabKiosk\desktop-app
.\DEPLOY-KIOSK.bat
```

This script will:
- ✅ Check Node.js
- ✅ Install packages
- ✅ Create start-kiosk.bat
- ✅ Create desktop shortcut

### D. Test Kiosk

```powershell
# Double-click desktop shortcut "Lab Kiosk"
# Or run:
cd C:\screen_mirror
.\start-kiosk.bat
```

**Should see:**
- ✅ Electron window opens
- ✅ Login screen
- ✅ "Connected to server" status

---

## 👥 STEP 4: ADD TEST STUDENT

### On Server Machine

**Open browser:**
```
http://10.10.46.182:7401/student-management-system.html
```

**Click "Add Single Student":**
- Student ID: **TEST001**
- Name: **Test Student**
- Email: **test@college.edu**
- Date of Birth: **2003-01-01**
- Department: **Computer Science**
- Year: **3**
- Lab ID: **CC1**

**Click "Add Student"**

**Generate password:**
1. Find student in list
2. Click "Generate Password"
3. Note the password (e.g., `TempPass123`)

---

## ✅ STEP 5: TEST END-TO-END

### A. On Student Machine (10.10.46.128)

1. Launch kiosk (desktop shortcut)
2. Login:
   - ID: **TEST001**
   - Password: (the one you generated)
3. Should see: "Session Active" screen ✅

### B. On Server Machine (or your laptop)

1. Open: `http://10.10.46.182:7401/admin-dashboard.html`
2. Click "🚀 Start Lab Session":
   - Subject: **Test Session**
   - Faculty: **Your Name**
   - Periods: **1**
3. Should see TEST001 in grid ✅
4. Click "👁️ Watch Screen"
5. Should see live video feed! ✅🎉

### C. End Test

1. Click "🛑 End Session"
2. CSV downloads automatically ✅
3. Student kiosk shows "Session Ended"

---

## 🔧 TROUBLESHOOTING

### Server won't start
```powershell
# Check if port is in use
netstat -ano | findstr :7401

# Check MongoDB connection
# Edit C:\screen_mirror\central-admin\server\.env
# Verify MONGODB_URI is correct
```

### Kiosk can't connect
```powershell
# From student machine, ping server
ping 10.10.46.182

# Should get replies
# If not, check firewall or network
```

### No video showing
1. Refresh admin dashboard (F5)
2. Student logout and login again
3. Use Chrome or Edge browser
4. Check console (F12) for errors

### Student can't login
1. Verify student exists in database
2. Check if password was set
3. Try "First Time Sign-in" flow
4. Check date of birth is correct

---

## 📋 DEPLOYMENT CHECKLIST

### Before Going to Lab
```
☐ USB with screen_mirror folder
☐ Node.js installer
☐ Network details noted
☐ This guide (printed/on phone)
```

### Server Machine
```
☐ IP configured (10.10.46.182)
☐ Files copied
☐ Node.js installed
☐ Dependencies installed (DEPLOY-SERVER.bat)
☐ Firewall configured
☐ Server running
☐ Tested from browser
```

### Student Machine
```
☐ IP configured (10.10.46.128) if needed
☐ Files copied
☐ Node.js installed
☐ Dependencies installed (DEPLOY-KIOSK.bat)
☐ Desktop shortcut created
☐ Kiosk tested
☐ Login tested
```

### Testing
```
☐ Test student added
☐ Student can login
☐ Shows on admin dashboard
☐ Screen mirroring works
☐ Video is clear
☐ Can end session
☐ CSV exports correctly
```

---

## 🚀 NEXT STEPS

### After Successful Test

1. **Add more students:**
   - Prepare CSV with real student data
   - Import via student management system

2. **Deploy to more PCs:**
   - Repeat student machine setup
   - Or build installer: `npm run build`
   - Copy installer to all PCs

3. **Configure auto-start:**
   - Task Scheduler for server
   - Startup folder for kiosk

4. **Train faculty:**
   - Show admin dashboard
   - How to start/end sessions
   - How to monitor screens

5. **Production mode:**
   - Enable kiosk fullscreen mode
   - Configure email for password reset
   - Set up automatic session scheduling

---

## 📞 QUICK REFERENCE

**URLs:**
- Admin Dashboard: `http://10.10.46.182:7401/admin-dashboard.html`
- Student Management: `http://10.10.46.182:7401/student-management-system.html`
- Student Signin (web): `http://10.10.46.182:7401/student-signin/`

**Commands:**
```powershell
# Start server
cd C:\screen_mirror
.\start-server.bat

# Start kiosk
cd C:\screen_mirror
.\start-kiosk.bat

# Check server status
netstat -ano | findstr :7401

# Ping test
ping 10.10.46.182
```

**Test Credentials:**
- Student ID: TEST001
- Password: (whatever you generated)

---

## ⏱️ TIME ESTIMATES

- **Server setup:** 15-20 minutes
- **First student PC:** 10-15 minutes
- **Each additional PC:** 5-10 minutes
- **Student data import:** 5-10 minutes
- **Testing:** 10-15 minutes

**Total for 2 PCs:** ~1 hour

---

**🎉 You're ready to deploy! Good luck!**

**Need help?** Check `DEPLOYMENT_GUIDE_COLLEGE.md` for detailed instructions.
