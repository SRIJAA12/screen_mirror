# 🚀 COLLEGE DEPLOYMENT - START HERE

**System:** Lab Management with Screen Mirroring  
**Target Network:** 10.10.46.182:7401  
**Status:** ✅ READY FOR DEPLOYMENT

---

## 📖 WHAT IS THIS?

This is a complete lab management system that provides:
- **Real-time screen mirroring** of all student computers
- **Student authentication** and session tracking
- **Automatic CSV reports** for lab sessions
- **Remote shutdown** capability
- **Faculty monitoring dashboard**

---

## 🎯 YOUR GOAL

Deploy this system in your college lab:
- **Server Machine:** 10.10.46.182 (1 computer)
- **Student Machines:** 10.10.46.128+ (multiple computers)

---

## 📚 DEPLOYMENT GUIDES (READ IN ORDER)

### 1. **Start Here** → **DEPLOYMENT-SUMMARY.md**
   - Overview of what was updated
   - What files were created
   - Quick checklist
   - **READ THIS FIRST!** ⭐

### 2. **Quick Deployment** → **QUICK-START.md**
   - Step-by-step fast track
   - Perfect for experienced users
   - Estimated time: 1-2 hours
   - **RECOMMENDED FOR DEPLOYMENT** ⭐⭐⭐

### 3. **Detailed Manual** → **DEPLOYMENT_GUIDE_COLLEGE.md**
   - Complete 30-page manual
   - Every single step explained
   - Troubleshooting included
   - For thorough understanding

### 4. **Reference Card** → **ONE-PAGE-REFERENCE.md**
   - Print and keep near server
   - Quick commands and URLs
   - Daily operations guide
   - **PRINT THIS!** 📄

### 5. **Progress Tracking** → **PRE-DEPLOYMENT-CHECKLIST.md**
   - Track each step
   - Check off as you complete
   - Document issues
   - **PRINT THIS TOO!** 📋

---

## 🔧 AUTOMATED SCRIPTS

### **DEPLOY-SERVER.bat**
Run this on the **server machine** (10.10.46.182):
- ✅ Checks Node.js
- ✅ Installs dependencies
- ✅ Creates configuration files
- ✅ Sets up startup script

### **DEPLOY-KIOSK.bat**
Run this on **each student machine** (10.10.46.128+):
- ✅ Checks Node.js
- ✅ Installs dependencies
- ✅ Creates desktop shortcut
- ✅ Sets up auto-start

---

## ⚡ FASTEST DEPLOYMENT (5 STEPS)

If you're in a hurry, follow this:

### 1️⃣ **Prepare** (5 min)
```powershell
# Copy this folder to USB drive
xcopy d:\screen_mirror E:\screen_mirror\ /E /I /H
```

### 2️⃣ **Server Setup** (20 min)
```powershell
# On server machine (10.10.46.182):
# 1. Set static IP to 10.10.46.182
# 2. Copy folder to C:\screen_mirror
# 3. Run:
cd C:\screen_mirror
.\DEPLOY-SERVER.bat
.\start-server.bat
```

### 3️⃣ **Configure Firewall** (5 min)
```powershell
# Run as Administrator:
New-NetFirewallRule -DisplayName "Lab Server" -Direction Inbound -Protocol TCP -LocalPort 7401 -Action Allow
```

### 4️⃣ **Student Machine** (15 min)
```powershell
# On student machine (10.10.46.128):
# 1. Copy folder to C:\LabKiosk
# 2. Run:
cd C:\LabKiosk
.\DEPLOY-KIOSK.bat
.\start-kiosk.bat
```

### 5️⃣ **Test** (10 min)
1. Add test student: http://10.10.46.182:7401/student-management-system.html
2. Login from kiosk
3. Monitor: http://10.10.46.182:7401/admin-dashboard.html
4. Verify screen mirroring works ✅

**Total Time: ~1 hour**

---

## 🎓 WHAT WAS CHANGED FOR YOUR COLLEGE

All IP addresses updated from development to production:

| File | What Changed | New Value |
|------|--------------|-----------|
| **Server** | app.js console messages | 10.10.46.182:7401 |
| **Kiosk** | main-simple.js SERVER_URL | 10.10.46.182:7401 |
| **Kiosk** | renderer.js serverUrl | 10.10.46.182:7401 |
| **Admin** | admin-dashboard.html socket | 10.10.46.182:7401 |
| **Admin** | working-simple.html socket | 10.10.46.182:7401 |
| **Student** | student-interface.html APIs | 10.10.46.182:7401 |
| **Management** | student-management-system.html | 10.10.46.182:7401 |
| **Signin** | student-signin/script.js | 10.10.46.182:7401 |

**Port changed:** 8000 → **7401**

---

## 🌐 IMPORTANT URLS

Once deployed, access these from any PC on the college network:

```
Main Dashboard:
http://10.10.46.182:7401/

Admin Dashboard (Faculty):
http://10.10.46.182:7401/admin-dashboard.html

Student Management (Add/Remove Students):
http://10.10.46.182:7401/student-management-system.html

Student Web Portal (Online Signin):
http://10.10.46.182:7401/student-signin/

Monitor Screen (Simple View):
http://10.10.46.182:7401/working-simple.html
```

---

## 📦 WHAT TO BRING TO COLLEGE

### Must Have
- ✅ This folder on USB drive (or laptop)
- ✅ Node.js installer (https://nodejs.org)
- ✅ Printed: ONE-PAGE-REFERENCE.md
- ✅ Printed: PRE-DEPLOYMENT-CHECKLIST.md

### Nice to Have
- Network cables (backup)
- Second USB drive (backup)
- Phone with guides (digital backup)

---

## 🔥 COMMON ISSUES & FIXES

### "Cannot connect to server"
```powershell
# Check server is running
netstat -ano | findstr :7401

# Check firewall
ping 10.10.46.182
```

### "MongoDB connection error"
- Requires internet connection (uses cloud database)
- Check `.env` file has correct MongoDB URI

### "No video stream"
- Refresh admin dashboard (F5)
- Student logout and re-login
- Use Chrome or Edge browser

### "Student can't login"
- Verify student exists in database
- Check password was set
- Try first-time signin flow

---

## ✅ DEPLOYMENT SUCCESS CHECKLIST

Your deployment is successful when:

```
☐ Server running on 10.10.46.182:7401
☐ Admin dashboard loads from any PC
☐ Student kiosk shows "Connected to server"
☐ Student can login successfully
☐ Student appears on admin dashboard
☐ Screen mirroring shows live video
☐ Video is smooth (no lag)
☐ Can end session
☐ CSV report downloads correctly
☐ System runs for 2+ hours without crash
```

---

## 🆘 NEED HELP?

### Read These (In Order)
1. DEPLOYMENT-SUMMARY.md (overview)
2. QUICK-START.md (step-by-step)
3. Troubleshooting section in DEPLOYMENT_GUIDE_COLLEGE.md

### Check These
- Server console (error messages)
- Browser console (F12)
- Network connectivity (ping tests)
- Firewall settings (port 7401)

### Contact
- College IT department
- System administrator
- Faculty coordinator

---

## 📊 SYSTEM ARCHITECTURE

```
                College Network (10.10.46.x)
                           |
          ┌────────────────┼────────────────┐
          |                                 |
    [Server Machine]                [Student Machines]
    10.10.46.182:7401               10.10.46.128+
          |                                 |
    ┌─────┴─────┐                    ┌─────┴─────┐
    |           |                    |           |
  [Admin    [MongoDB]              [Kiosk    [Screen
  Dashboard]  Cloud              Application] Capture]
    |                                 |
    └──────────── WebRTC ─────────────┘
          (Screen Mirroring)
```

---

## 🎯 QUICK REFERENCE

### Start Server
```powershell
cd C:\screen_mirror
.\start-server.bat
```

### Start Kiosk
```powershell
cd C:\screen_mirror  # or C:\LabKiosk
.\start-kiosk.bat
```

### Check Status
```powershell
netstat -ano | findstr :7401
ping 10.10.46.182
```

### Access Dashboard
```
http://10.10.46.182:7401/admin-dashboard.html
```

---

## ⏱️ TIME ESTIMATE

| Task | Duration |
|------|----------|
| Server setup | 20-30 min |
| First student PC | 15-20 min |
| Each additional PC | 10-15 min |
| Testing | 15-20 min |
| **Total (2 PCs)** | **~1.5 hours** |
| **Total (10 PCs)** | **~3 hours** |

---

## 🎉 YOU'RE READY!

Everything is configured and ready for deployment!

### Your Next Steps:
1. **Read:** DEPLOYMENT-SUMMARY.md (5 min)
2. **Read:** QUICK-START.md (10 min)
3. **Print:** ONE-PAGE-REFERENCE.md and PRE-DEPLOYMENT-CHECKLIST.md
4. **Copy:** This folder to USB drive
5. **Go:** Deploy in college! 🚀

---

## 📞 SUPPORT

For detailed help, refer to:
- **DEPLOYMENT_GUIDE_COLLEGE.md** - Complete manual
- **QUICK-START.md** - Fast deployment
- **ONE-PAGE-REFERENCE.md** - Daily operations

---

**Version:** 2.0  
**Updated:** October 2025  
**Status:** ✅ PRODUCTION READY

**Good luck with your deployment! 🎓🚀**
