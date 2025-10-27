# 🎓 COLLEGE DEPLOYMENT GUIDE - Lab Management System

**Server IP:** 10.10.46.182:7401  
**Student IP:** 10.10.46.128  
**Lab ID:** CC1  
**Date:** October 2025

---

## 📋 QUICK OVERVIEW

This system provides:
- ✅ Real-time screen mirroring of all student computers
- ✅ Student authentication and session management
- ✅ Automatic CSV report generation
- ✅ Remote shutdown capability
- ✅ Lab session scheduling

**Architecture:**
```
Server Machine (10.10.46.182:7401)
    ↓
    ├── Admin Dashboard (Web Browser)
    ├── MongoDB Database (Cloud)
    └── WebRTC Signaling Server
    
Student PCs (10.10.46.128, etc.)
    ↓
    └── Electron Kiosk App (Screen Sharing)
```

---

## PART 1: PREPARATION (BEFORE GOING TO LAB)

### Step 1.1: Verify Your Laptop Setup

**Check Node.js:**
```powershell
node --version
# Should show: v18.x.x or higher
```

**Check if server runs on your laptop:**
```powershell
cd d:\screen_mirror\central-admin\server
node app.js
```

You should see:
```
✅ MongoDB connected successfully
✅ Server running on port 7401
🌐 Network Access: http://10.10.46.182:7401
```

Press `Ctrl+C` to stop.

### Step 1.2: Package Files for Transfer

**Create a USB drive or zip file with:**
1. Complete `screen_mirror` folder
2. Node.js installer (if college PCs don't have it)
3. This deployment guide

---

## PART 2: SERVER MACHINE SETUP (10.10.46.182)

### Step 2.1: Configure Network

**Set Static IP Address:**

1. Press `Win + R`, type `ncpa.cpl`, press Enter
2. Right-click network adapter → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
4. Select "Use the following IP address":
   - **IP address:** 10.10.46.182
   - **Subnet mask:** 255.255.255.0
   - **Default gateway:** 10.10.46.1 (ask IT admin)
   - **Preferred DNS:** 8.8.8.8
5. Click OK

**Verify IP:**
```powershell
ipconfig
```

Look for: `IPv4 Address: 10.10.46.182`

### Step 2.2: Install Node.js (if needed)

1. Go to https://nodejs.org/
2. Download LTS version (Long Term Support)
3. Run installer with default settings
4. Verify:
   ```powershell
   node --version
   npm --version
   ```

### Step 2.3: Copy Project Files

**Option A: From USB**
```powershell
# Copy entire folder to C:\
xcopy E:\screen_mirror C:\screen_mirror\ /E /I /H
```

**Option B: From GitHub**
```powershell
cd C:\
git clone https://github.com/SRIJAA12/screen_mirror.git
```

### Step 2.4: Install Server Dependencies

```powershell
cd C:\screen_mirror\central-admin\server
npm install
```

This will take 2-5 minutes.

### Step 2.5: Configure Environment Variables

**Create `.env` file:**
```powershell
cd C:\screen_mirror\central-admin\server
notepad .env
```

**Add this content:**
```env
PORT=7401
NODE_ENV=production
MONGODB_URI=mongodb+srv://srijaaanandhan12_db_user:122007@cluster0.2kzkkpe.mongodb.net/college-lab-registration?retryWrites=true&w=majority
BCRYPT_SALT_ROUNDS=10

# Email Configuration (for password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Lab Management System <your-email@gmail.com>"
```

**Note:** Replace email credentials if you want password reset to work.

Save and close.

### Step 2.6: Configure Windows Firewall

**Allow incoming connections on port 7401:**

1. Press `Win + R`, type `wf.msc`, press Enter
2. Click "Inbound Rules" → "New Rule"
3. Rule Type: **Port** → Next
4. Protocol: **TCP**, Port: **7401** → Next
5. Action: **Allow the connection** → Next
6. Profile: Check **all** (Domain, Private, Public) → Next
7. Name: **Lab Management Server** → Finish

### Step 2.7: Test Server

**Start server:**
```powershell
cd C:\screen_mirror\central-admin\server
node app.js
```

**You should see:**
```
🔐 College Lab Registration System
✅ Server running on port 7401
📡 Local Access: http://localhost:7401
🌐 Network Access: http://10.10.46.182:7401
✅ MongoDB connected successfully
```

**Test from your laptop (on same network):**
- Open browser
- Go to: `http://10.10.46.182:7401`
- You should see the admin dashboard

### Step 2.8: Make Server Auto-Start

**Create startup batch file:**
```powershell
notepad C:\screen_mirror\start-server.bat
```

**Add this content:**
```batch
@echo off
title Lab Management Server
color 0A
echo.
echo ========================================
echo   LAB MANAGEMENT SERVER STARTING
echo ========================================
echo.
cd C:\screen_mirror\central-admin\server
node app.js
pause
```

Save and close.

**Create Task Scheduler entry:**

1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Click "Create Basic Task"
3. Name: **Lab Server Auto-Start**
4. Description: **Starts lab management server on boot**
5. Trigger: **When the computer starts** → Next
6. Action: **Start a program** → Next
7. Program: `C:\screen_mirror\start-server.bat`
8. Check "Open Properties dialog" → Finish
9. In Properties:
   - Check "Run with highest privileges"
   - Check "Run whether user is logged on or not"
   - Click OK

**Test:**
- Restart server machine
- Wait 2 minutes
- From your laptop: `http://10.10.46.182:7401`
- Should work!

---

## PART 3: STUDENT KIOSK DEPLOYMENT

### Step 3.1: Install on First Test PC (10.10.46.128)

**Configure network (if needed):**
- Follow same steps as server to set static IP: 10.10.46.128

**Copy kiosk folder:**
```powershell
xcopy C:\screen_mirror\student-kiosk C:\LabKiosk\ /E /I /H
```

Or if copying from USB:
```powershell
xcopy E:\screen_mirror\student-kiosk C:\LabKiosk\ /E /I /H
```

### Step 3.2: Install Node.js (if needed)

Same as server installation.

### Step 3.3: Install Kiosk Dependencies

```powershell
cd C:\LabKiosk\desktop-app
npm install
```

This will take 2-5 minutes.

### Step 3.4: Test Kiosk Application

**Start kiosk:**
```powershell
cd C:\LabKiosk\desktop-app
npm start
```

**You should see:**
- Electron window opens
- Login screen displays
- "Connected to server" status shows

**Test login:**
1. Use a test student ID (you need to add students first - see Part 4)
2. Enter password
3. Should see "Session Active" screen
4. On server machine: Check `http://10.10.46.182:7401/admin-dashboard.html`
5. You should see the student's screen

### Step 3.5: Create Auto-Start Shortcut

**Create startup batch file:**
```powershell
notepad C:\LabKiosk\start-kiosk.bat
```

**Add this content:**
```batch
@echo off
cd C:\LabKiosk\desktop-app
npm start
```

Save.

**Make it auto-start:**
1. Press `Win + R`, type `shell:startup`, press Enter
2. Right-click in folder → New → Shortcut
3. Location: `C:\LabKiosk\start-kiosk.bat`
4. Name: **Lab Kiosk**
5. Finish

**Test:**
- Restart student PC
- Kiosk should launch automatically

### Step 3.6: Optional - Build Standalone Executable

**For easier deployment:**

```powershell
cd C:\LabKiosk\desktop-app
npm install electron-builder --save-dev
npm run build
```

This creates `LabKiosk Setup.exe` in `dist` folder.

**To deploy to other PCs:**
1. Copy `LabKiosk Setup.exe` to USB
2. Run on each student PC
3. Installs automatically to `C:\Program Files\LabKiosk`

### Step 3.7: Deploy to All Student PCs

**Method 1: Manual (What you'll probably do)**

For each PC:
1. Login as administrator
2. Copy kiosk folder OR run installer
3. Install dependencies (if not using installer)
4. Create auto-start shortcut
5. Test login
6. Mark on checklist

**Checklist template:**
```
PC: CC1-01 (10.10.46.128)  ☐ Installed  ☐ Tested  ☐ Auto-start working
PC: CC1-02 (10.10.46.129)  ☐ Installed  ☐ Tested  ☐ Auto-start working
PC: CC1-03 (10.10.46.130)  ☐ Installed  ☐ Tested  ☐ Auto-start working
...
```

**Time estimate:**
- With 3 people: ~5 min per PC
- 60 PCs: ~2 hours total

---

## PART 4: ADD STUDENTS TO DATABASE

### Step 4.1: Prepare Student Data

**Create Excel/CSV file:**

| student_id | name | email | dateOfBirth | department | year | labId |
|------------|------|-------|-------------|------------|------|-------|
| 21CS001 | Rajesh Kumar | rajesh@college.edu | 2003-05-15 | Computer Science | 3 | CC1 |
| 21CS002 | Priya Sharma | priya@college.edu | 2003-08-22 | Computer Science | 3 | CC1 |

**Important:**
- Date format: YYYY-MM-DD
- Get real data from college administration
- Save as CSV

### Step 4.2: Import Students

**Open admin interface:**
```
http://10.10.46.182:7401/student-management-system.html
```

**Upload CSV:**
1. Click "📁 Choose File"
2. Select your CSV
3. Click "📤 Import Students"
4. Wait for confirmation

**Verify:**
- Students appear in list
- Check database statistics

### Step 4.3: Student First-Time Setup

**Option 1: Students setup online**
- Students visit: `http://10.10.46.182:7401/student-signin/`
- Enter student ID and date of birth
- Create password
- Done!

**Option 2: Admin sets passwords**
- Use student management interface
- Click "Reset Password" for each student
- Give them temporary password
- They can change later

---

## PART 5: TESTING & VALIDATION

### Test Checklist

**Server Tests:**
```
☐ Server accessible from admin PC
☐ Server accessible from student PCs
☐ MongoDB connected successfully
☐ Admin dashboard loads
☐ Student management system works
```

**Student Kiosk Tests:**
```
☐ Student can login
☐ Session shows on admin dashboard
☐ Screen mirroring works
☐ Video is smooth (no lag)
☐ Student can logout
☐ Kiosk auto-starts on boot
```

**Lab Session Tests:**
```
☐ Can start lab session
☐ Multiple students (5+) can login
☐ All screens visible on dashboard
☐ Can end session
☐ CSV report downloads correctly
☐ Session data cleared after end
```

**Advanced Tests:**
```
☐ Remote shutdown works
☐ Forgot password flow works
☐ Email OTP works (if configured)
☐ Scheduled sessions work
☐ Auto-download reports work
```

---

## PART 6: FACULTY TRAINING

### Training Session (30 minutes)

**1. Access Dashboard (5 min)**
```
URL: http://10.10.46.182:7401/admin-dashboard.html
```

**2. Start Lab Session (5 min)**
- Click "🚀 Start Lab Session"
- Enter:
  - Subject: Data Structures Lab
  - Faculty: Dr. Smith
  - Year: 3rd Year
  - Department: Computer Science
  - Section: A
  - Periods: 2
- Click "Start Session"

**3. Monitor Students (10 min)**
- Students appear automatically when they login
- Click "👁️ Watch Screen" to see their screen
- Click "🔍 Expand" for fullscreen view
- Click "🔌 Shutdown" to shutdown individual PC

**4. End Session (5 min)**
- Click "🛑 End Session"
- CSV report auto-downloads
- Shows:
  - Student names
  - Login/logout times
  - Duration
  - System numbers

**5. Emergency Features (5 min)**
- **Shutdown All:** Red button at top
- **Refresh:** If student not appearing
- **Session Timer:** Shows time remaining

---

## PART 7: GO-LIVE CHECKLIST

### One Day Before
```
☐ Server machine ready and tested
☐ All student PCs installed and working
☐ Students added to database
☐ Faculty trained
☐ IT support on standby
☐ Network connectivity verified
☐ Backup plan ready
```

### Launch Morning (1 hour before)
```
☐ Boot server machine
☐ Verify server running (http://10.10.46.182:7401)
☐ Boot all student PCs
☐ Verify kiosk apps launched on all PCs
☐ Check network connectivity (ping test)
☐ Open admin dashboard
☐ Brief faculty again
```

### During First Lab Session
```
☐ Start lab session from dashboard
☐ Help students login
☐ Monitor screen mirroring quality
☐ Document any issues
☐ Collect feedback from faculty
☐ End session and verify CSV export
```

### After First Session
```
☐ Review generated CSV report
☐ Address any technical issues
☐ Make configuration adjustments
☐ Plan improvements
☐ Schedule follow-up training if needed
```

---

## TROUBLESHOOTING

### Issue: Server won't start
**Symptoms:** Server crashes or won't start

**Solutions:**
1. Check MongoDB connection string in `.env`
2. Verify port 7401 not in use: `netstat -ano | findstr :7401`
3. Check firewall settings
4. View error messages in console
5. Check Node.js version: `node --version` (should be 18+)

### Issue: Student PC can't connect
**Symptoms:** "Disconnected from server" on kiosk

**Solutions:**
1. Ping server: `ping 10.10.46.182`
2. Check server is running
3. Check firewall on server machine
4. Verify IP address in `main-simple.js` is correct
5. Check network connectivity

### Issue: Screen mirroring not working
**Symptoms:** Video shows black screen or doesn't load

**Solutions:**
1. Refresh admin dashboard (F5)
2. Student logout and login again
3. Check WebRTC ports not blocked
4. Try different browser (Chrome/Edge work best)
5. Check console for errors (F12)

### Issue: Student can't login
**Symptoms:** "Invalid credentials" error

**Solutions:**
1. Verify student exists: Check student management
2. Check if first-time login needed (no password set)
3. Try forgot password flow
4. Verify date of birth is correct
5. Check MongoDB connection

### Issue: CSV export doesn't work
**Symptoms:** No download or empty file

**Solutions:**
1. Check if session was started properly
2. Verify students actually logged in
3. Check browser download settings
4. Try different browser
5. Check server console for errors

---

## IMPORTANT URLS

**Server Machine (10.10.46.182:7401):**
- Main Dashboard: http://10.10.46.182:7401/
- Admin Dashboard: http://10.10.46.182:7401/admin-dashboard.html
- Student Management: http://10.10.46.182:7401/student-management-system.html
- Student Sign-in (web): http://10.10.46.182:7401/student-signin/
- Email Config: http://10.10.46.182:7401/email-config-tool.html

**From Admin PC (any computer on network):**
- Same URLs as above
- Just ensure you're on same network

---

## QUICK REFERENCE COMMANDS

**Start Server:**
```powershell
cd C:\screen_mirror\central-admin\server
node app.js
```

**Start Kiosk (Development):**
```powershell
cd C:\LabKiosk\desktop-app
npm start
```

**Check Server Status:**
```powershell
# On server machine
netstat -ano | findstr :7401
```

**Ping Test:**
```powershell
# From any PC
ping 10.10.46.182
```

**Check Node Version:**
```powershell
node --version
npm --version
```

**Reinstall Dependencies:**
```powershell
# If something breaks
cd C:\screen_mirror\central-admin\server
rmdir /s /q node_modules
npm install
```

---

## SUPPORT & MAINTENANCE

### Daily Operations
1. Ensure server machine is ON before lab hours
2. Verify dashboard accessible
3. Monitor session reports
4. Check for student login issues

### Weekly Maintenance
1. Review session logs
2. Update student database if needed
3. Check disk space on server
4. Backup MongoDB data

### Monthly Tasks
1. Update Node.js if new version available
2. Review system performance
3. Clean old session data
4. Faculty feedback review

---

## CONTACT INFO

**Technical Support:**
- Server Issues: Check console logs first
- Network Issues: Contact IT department
- Student Issues: Check student management system

**System Information:**
- Server IP: 10.10.46.182
- Server Port: 7401
- Lab ID: CC1
- MongoDB: Cloud hosted (Atlas)

---

## SUCCESS CRITERIA

**System is working correctly if:**
- ✅ All student PCs can login
- ✅ Screen mirroring shows real-time video
- ✅ Faculty can monitor all students
- ✅ Sessions end properly
- ✅ CSV reports generate correctly
- ✅ System is stable for 2+ hour sessions
- ✅ No network lag or crashes

---

**Good luck with your deployment! 🚀**

**Last Updated:** October 2025  
**Version:** 2.0  
**Deployed By:** _____________  
**Date:** _____________
