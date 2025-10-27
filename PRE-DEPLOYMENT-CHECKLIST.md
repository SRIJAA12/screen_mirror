# ✅ PRE-DEPLOYMENT CHECKLIST
## Lab Management System - College Deployment

**Deployment Date:** ____________  
**Deployed By:** ____________  
**College/Department:** ____________

---

## 📋 BEFORE LEAVING FOR COLLEGE

### Materials to Bring

```
☐ USB drive with screen_mirror folder (or network access)
☐ Node.js installer (https://nodejs.org - LTS version)
☐ Printed copies of:
  ☐ QUICK-START.md
  ☐ ONE-PAGE-REFERENCE.md
  ☐ This checklist
☐ Network cables (backup)
☐ Laptop/phone with documentation
```

### Network Information Collected

```
Server IP Address:    10.10.46.182
Student IP Range:     10.10.46.128 - 10.10.46.xxx
Subnet Mask:          255.255.255.0
Default Gateway:      ____________ (ask IT)
DNS Server:           8.8.8.8 (or college DNS)
Lab ID:               CC1
WiFi/Network Name:    ____________
```

### Permissions & Access

```
☐ Administrator access to server machine
☐ Administrator access to student PCs
☐ Firewall modification permission
☐ Network configuration permission
☐ IT department contact: ____________
☐ IT department notified about deployment
```

### Software Verification

```
☐ Tested server on development laptop
☐ Tested kiosk on development laptop
☐ MongoDB connection working
☐ Screen mirroring tested locally
☐ CSV export tested
☐ All dependencies installed on dev machine
```

---

## 🖥️ SERVER MACHINE SETUP (10.10.46.182)

### Initial Checks

```
Time Started: ______
☐ Machine powered on
☐ Windows booted successfully
☐ Admin login credentials obtained
☐ Machine has internet access
☐ Machine is on college network
```

### Network Configuration

```
☐ Static IP set to: 10.10.46.182
☐ Subnet mask: 255.255.255.0
☐ Gateway configured: ____________
☐ DNS configured: 8.8.8.8
☐ Connectivity tested (ping google.com)
☐ Internal network tested (ping 10.10.46.1)
```

### Software Installation

```
☐ Node.js installed (version: ______)
☐ Node.js verified (node --version)
☐ npm verified (npm --version)
☐ Project files copied to C:\screen_mirror
☐ Directory structure verified
```

### Server Configuration

```
☐ Navigated to central-admin\server
☐ Ran DEPLOY-SERVER.bat
☐ Dependencies installed successfully
☐ .env file created/configured
☐ MongoDB URI verified
☐ Email settings configured (optional)
```

### Firewall Configuration

```
☐ Windows Firewall opened
☐ Inbound rule created for port 7401
☐ Rule tested from another PC
☐ Firewall rule active and working
```

### Server Testing

```
☐ Server started successfully (start-server.bat)
☐ Server shows "MongoDB connected"
☐ Server shows correct IP (10.10.46.182)
☐ Tested from browser: http://localhost:7401
☐ Tested from another PC: http://10.10.46.182:7401
☐ Admin dashboard loads correctly
☐ Student management system accessible
```

### Auto-Start Configuration (Optional)

```
☐ Task Scheduler opened
☐ Task created: "Lab Server Auto-Start"
☐ Task configured to run at startup
☐ Task tested (manually run)
☐ Verified task will run at boot
```

**Server Setup Completed: ______ (Time)**

---

## 💻 STUDENT MACHINE #1 (10.10.46.128)

### Initial Checks

```
Time Started: ______
☐ Machine powered on
☐ Windows booted successfully
☐ Admin login credentials obtained
☐ Machine can access network
☐ Can ping server: ping 10.10.46.182
```

### Network Configuration (if needed)

```
☐ Static IP set to: 10.10.46.128
☐ Subnet mask: 255.255.255.0
☐ Gateway configured
☐ DNS configured
☐ Connectivity to server verified
```

### Software Installation

```
☐ Node.js installed
☐ Project files copied (to C:\LabKiosk or C:\screen_mirror)
☐ Ran DEPLOY-KIOSK.bat
☐ Dependencies installed successfully
☐ Desktop shortcut created
```

### Kiosk Testing

```
☐ Kiosk launches successfully
☐ Shows login screen
☐ Shows "Connected to server" status
☐ Server IP verified in console
☐ No connection errors
```

### Auto-Start Configuration

```
☐ Opened startup folder (Win+R → shell:startup)
☐ Copied kiosk shortcut to startup folder
☐ Tested by restarting PC
☐ Kiosk launches automatically after boot
```

**Student Machine #1 Completed: ______ (Time)**

---

## 💻 STUDENT MACHINE #2+ (If More PCs)

### Machine #2: 10.10.46._____

```
☐ Network configured
☐ Software installed
☐ Kiosk tested
☐ Auto-start configured
☐ Connection verified

Completed: ______ (Time)
Notes: _________________________
```

### Machine #3: 10.10.46._____

```
☐ Network configured
☐ Software installed
☐ Kiosk tested
☐ Auto-start configured
☐ Connection verified

Completed: ______ (Time)
Notes: _________________________
```

---

## 👥 STUDENT DATABASE SETUP

### Test Student Creation

```
☐ Opened student management system
☐ Added test student:
  ID: TEST001
  Name: Test Student
  Email: test@college.edu
  DOB: 2003-01-01
  Department: Computer Science
  Year: 3
  Lab: CC1
☐ Generated password for test student
☐ Password noted: ____________
```

### Real Student Data Import

```
☐ Student CSV prepared
☐ CSV format verified (student_id, name, email, dateOfBirth, department, year, labId)
☐ CSV uploaded to student management system
☐ Import successful
☐ Student count verified: ______ students
☐ Sample students checked in database
```

### Password Distribution

```
☐ Passwords generated for new students
☐ Password distribution method decided:
  ☐ Temporary passwords via admin
  ☐ Students use first-time signin flow
  ☐ Passwords sent via email
☐ Students notified about signin process
```

---

## 🧪 END-TO-END TESTING

### Login Test

```
☐ Student machine kiosk opened
☐ Test student login attempted (TEST001)
☐ Login successful
☐ "Session Active" screen shown
☐ No errors in console
```

### Screen Mirroring Test

```
☐ Admin dashboard opened on server/another PC
☐ Started lab session:
  Subject: Test Session
  Faculty: Your Name
  Periods: 1
☐ Test student appears in grid
☐ Clicked "Watch Screen"
☐ Video stream loads
☐ Video is clear and smooth
☐ No lag or freezing
☐ Audio not needed (video only)
```

### Session Management Test

```
☐ Multiple actions tested (if multiple students):
  ☐ Second student logged in
  ☐ Both students visible on dashboard
  ☐ Can switch between video streams
☐ Student logout tested
☐ Student re-login tested
☐ Session timer working
```

### CSV Export Test

```
☐ Clicked "End Session"
☐ CSV file auto-downloaded
☐ CSV opened successfully
☐ CSV contains correct data:
  ☐ Student names
  ☐ Student IDs
  ☐ System numbers
  ☐ Login times
  ☐ Logout times
  ☐ Duration
☐ File name format correct
```

### Advanced Features Test (Optional)

```
☐ Remote shutdown tested
☐ Forgot password flow tested
☐ Email OTP tested (if configured)
☐ Auto-refresh working
☐ Fullscreen video working
```

---

## 📚 DOCUMENTATION & HANDOVER

### Documentation Provided

```
☐ ONE-PAGE-REFERENCE.md given to faculty
☐ DEPLOYMENT_GUIDE_COLLEGE.md saved on server
☐ Quick reference printed and posted
☐ Contact information collected
☐ Troubleshooting guide reviewed with IT
```

### Faculty Training

```
☐ Faculty member identified: ____________
☐ Training session completed
☐ Demonstrated:
  ☐ Starting lab session
  ☐ Monitoring students
  ☐ Ending session
  ☐ CSV export
  ☐ Emergency shutdown
☐ Faculty comfortable with system
☐ Faculty has access credentials
```

### System Handover

```
☐ Server machine credentials documented
☐ Admin dashboard access provided
☐ Student management access provided
☐ IT department briefed
☐ Support contact info exchanged
☐ Follow-up date scheduled: ____________
```

---

## 🔍 FINAL VERIFICATION

### System Status Check

```
☐ Server running smoothly
☐ All student PCs connected
☐ No error messages
☐ Network stable
☐ Video streams working
☐ Database accessible
```

### Performance Check

```
☐ Page load times acceptable
☐ Video latency minimal
☐ No freezing or crashing
☐ CSV export fast
☐ Login/logout responsive
☐ Can handle multiple simultaneous students
```

### Documentation Check

```
☐ All URLs documented
☐ All passwords recorded securely
☐ Network diagram created
☐ Troubleshooting steps documented
☐ Contact list complete
☐ Maintenance schedule provided
```

---

## 📝 NOTES & ISSUES

### Issues Encountered

```
Issue #1: _________________________________
Solution: _________________________________
Time taken: ______

Issue #2: _________________________________
Solution: _________________________________
Time taken: ______

Issue #3: _________________________________
Solution: _________________________________
Time taken: ______
```

### Configuration Customizations

```
Custom Setting #1: _________________________________
Reason: _________________________________

Custom Setting #2: _________________________________
Reason: _________________________________
```

### Pending Items

```
☐ _________________________________
☐ _________________________________
☐ _________________________________
```

---

## ✅ DEPLOYMENT COMPLETION

```
Deployment Start Time: ______
Deployment End Time: ______
Total Duration: ______ hours

Server IP: 10.10.46.182:7401
Student PCs Deployed: ______
Students in Database: ______

Deployed By: ____________
Signature: ____________

Verified By (IT/Faculty): ____________
Signature: ____________

Status: ☐ SUCCESS ☐ PARTIAL ☐ ISSUES

Follow-up Date: ____________
```

---

## 📅 NEXT STEPS

```
☐ Monitor system for first week
☐ Collect feedback from faculty
☐ Collect feedback from students
☐ Address any performance issues
☐ Schedule training for additional faculty
☐ Plan rollout to additional labs (if applicable)
☐ Set up monitoring/alerts
☐ Create backup schedule
☐ Document lessons learned
```

---

**Save this completed checklist for future reference!**  
**Version:** 2.0 | **Date:** October 2025
