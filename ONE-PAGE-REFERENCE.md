# 📄 ONE-PAGE REFERENCE CARD
## Lab Management System - Quick Reference

---

### 🌐 NETWORK CONFIGURATION

| Component | IP Address | Port |
|-----------|------------|------|
| **Server Machine** | 10.10.46.182 | 7401 |
| **Student Machine** | 10.10.46.128 | - |
| **Subnet Mask** | 255.255.255.0 | - |
| **Gateway** | 10.10.46.1 | - |
| **Lab ID** | CC1 | - |

---

### 🔗 IMPORTANT URLS

```
Admin Dashboard:
http://10.10.46.182:7401/admin-dashboard.html

Student Management:
http://10.10.46.182:7401/student-management-system.html

Student Web Signin:
http://10.10.46.182:7401/student-signin/
```

---

### 🚀 QUICK START COMMANDS

**Start Server (10.10.46.182):**
```powershell
cd C:\screen_mirror
.\start-server.bat
```

**Start Kiosk (Student PCs):**
```powershell
cd C:\screen_mirror
.\start-kiosk.bat
```

**Check Server Running:**
```powershell
netstat -ano | findstr :7401
```

**Test Connectivity:**
```powershell
ping 10.10.46.182
```

---

### 📦 DEPLOYMENT SCRIPTS

```
.\DEPLOY-SERVER.bat  → Setup server machine
.\DEPLOY-KIOSK.bat   → Setup student machines
```

---

### ✅ DAILY OPERATIONS

**Morning Startup:**
1. Boot server machine
2. Run `start-server.bat`
3. Verify: `http://10.10.46.182:7401`
4. Boot all student PCs
5. Kiosks should auto-start

**Start Lab Session:**
1. Open admin dashboard
2. Click "🚀 Start Lab Session"
3. Fill subject, faculty, periods
4. Click "Start Session"

**Monitor Students:**
1. Students appear automatically when they login
2. Click "👁️ Watch Screen" to view
3. Click "🔍 Expand" for fullscreen

**End Lab Session:**
1. Click "🛑 End Session"
2. CSV auto-downloads
3. Data cleared

---

### 🔧 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Server won't start | Check MongoDB URI in .env |
| Kiosk can't connect | `ping 10.10.46.182` |
| No video | Refresh dashboard (F5) |
| Student can't login | Verify in student management |
| Firewall blocking | Allow port 7401 inbound |

**View Logs:**
- Server: Check console window
- Kiosk: Press F12 in kiosk window

---

### 👥 STUDENT MANAGEMENT

**Add Single Student:**
1. Go to student management system
2. Click "Add Single Student"
3. Fill all fields
4. Generate password

**Import CSV:**
1. Prepare CSV: student_id, name, email, dateOfBirth, department, year, labId
2. Upload in student management
3. Generate passwords for new students

**Reset Password:**
1. Find student in list
2. Click "Reset Password"
3. Give temporary password to student

---

### 🔐 TEST CREDENTIALS

```
Student ID: TEST001
Password: (generated via student management)
```

---

### 📊 CSV EXPORT FORMAT

Automatic download includes:
- Student names and IDs
- System numbers
- Login/logout times
- Session duration
- Subject and faculty info

File name: `Lab_Report_[Subject]_[Date].csv`

---

### 🆘 EMERGENCY PROCEDURES

**Shutdown All PCs:**
- Click red "🔴 SHUTDOWN ALL SYSTEMS" button
- Confirm action
- All student PCs shutdown in 10 seconds

**Shutdown Single PC:**
- Find student card
- Click "🔌 Shutdown"
- That PC shuts down

**Server Crash:**
1. Restart server machine
2. Run `start-server.bat`
3. Students may need to re-login

---

### 📞 SUPPORT CONTACTS

**IT Department:** _______________  
**System Admin:** _______________  
**Faculty Coordinator:** _______________

---

### 📁 FILE LOCATIONS

**Server:**
- Installation: `C:\screen_mirror\`
- Server code: `C:\screen_mirror\central-admin\server\`
- Config file: `C:\screen_mirror\central-admin\server\.env`
- Startup: `C:\screen_mirror\start-server.bat`

**Student Kiosk:**
- Installation: `C:\screen_mirror\` or `C:\LabKiosk\`
- Kiosk code: `student-kiosk\desktop-app\`
- Startup: `start-kiosk.bat`

---

### ⚙️ ADVANCED FEATURES

**Auto-Download Reports:**
- Configure in admin dashboard
- Set schedule (daily/weekly)
- Reports auto-generate and download

**Email Password Reset:**
- Configure in `.env` file
- Students can reset via email OTP

**Session Scheduling:**
- Schedule future sessions
- Auto-start at specified time

---

### 🔄 MAINTENANCE SCHEDULE

**Daily:**
- ☐ Verify server running
- ☐ Check all kiosks online
- ☐ Review session logs

**Weekly:**
- ☐ Update student database
- ☐ Review CSV reports
- ☐ Check disk space

**Monthly:**
- ☐ Update Node.js if needed
- ☐ Backup MongoDB data
- ☐ Clean old sessions

---

### 🎯 SUCCESS INDICATORS

System working correctly if:
- ✅ All students can login
- ✅ Video streams are smooth
- ✅ No network lag
- ✅ CSV exports properly
- ✅ Sessions last 2+ hours without issues

---

**Version:** 2.0 | **Date:** October 2025  
**Print this page and keep near server machine**
