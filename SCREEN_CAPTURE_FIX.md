# 🔧 SCREEN CAPTURE ERROR FIX

## ❌ THE ERROR YOU'RE SEEING

```
capture desktop, error code Duplication failed
[ERROR:gpu_init.cc(523)] Passthrough is not supported, GL is disabled
```

**This is a Windows Desktop Duplication API error!**

---

## 🔍 ROOT CAUSE

The kiosk **cannot capture the screen** due to one of these issues:

### **1. Remote Desktop Session (Most Common)**
- ❌ **Screen capture does NOT work in Remote Desktop (RDP)**
- ❌ Windows Desktop Duplication API is disabled in RDP sessions
- ✅ **Solution:** Run the kiosk **directly on the physical computer**, not through Remote Desktop

### **2. Graphics Driver Issue**
- ❌ Outdated or incompatible graphics drivers
- ❌ GPU acceleration disabled
- ✅ **Solution:** Update your graphics drivers

### **3. Multiple Displays**
- ❌ Multiple monitors causing conflicts
- ❌ Display duplication API confused about which screen to capture
- ✅ **Solution:** Disconnect extra monitors temporarily

### **4. Windows Permissions**
- ❌ Electron app doesn't have permission to capture screen
- ✅ **Solution:** Run as administrator

---

## ✅ SOLUTIONS (Try in order)

### **SOLUTION 1: Don't Use Remote Desktop (MOST IMPORTANT!)**

**If you're connecting to the computer via Remote Desktop:**
1. ❌ Close Remote Desktop connection
2. ✅ Go directly to the physical computer
3. ✅ Run the kiosk app locally
4. ✅ Screen capture will work!

**Why?** Windows Desktop Duplication API is disabled in RDP sessions for security reasons.

---

### **SOLUTION 2: Update Graphics Drivers**

**Windows 10/11:**
1. Press `Win + X`
2. Select "Device Manager"
3. Expand "Display adapters"
4. Right-click your graphics card
5. Select "Update driver"
6. Choose "Search automatically for drivers"
7. Install updates
8. **Restart computer**
9. Try kiosk again

**Or download from manufacturer:**
- NVIDIA: https://www.nvidia.com/Download/index.aspx
- AMD: https://www.amd.com/en/support
- Intel: https://www.intel.com/content/www/us/en/download-center/home.html

---

### **SOLUTION 3: Run as Administrator**

**Give the kiosk elevated permissions:**
1. Close the kiosk if running
2. Navigate to: `d:\screen_mirror-1\student-kiosk\desktop-app`
3. Right-click `node_modules\electron\dist\electron.exe`
4. Select "Run as administrator"
5. Or create a shortcut and set it to always run as admin

**Via command line:**
```powershell
# Run PowerShell as Administrator
cd d:\screen_mirror-1\student-kiosk\desktop-app
Start-Process "npm" -ArgumentList "start" -Verb RunAs
```

---

### **SOLUTION 4: Disconnect Extra Monitors**

**If you have multiple displays:**
1. Press `Win + P`
2. Select "PC screen only"
3. Or physically disconnect extra monitors
4. Keep only the main monitor
5. Try kiosk again

---

### **SOLUTION 5: Enable Hardware Acceleration**

**Windows Settings:**
1. Press `Win + I` (Settings)
2. Go to "System" → "Display"
3. Scroll down → "Graphics settings"
4. Enable "Hardware-accelerated GPU scheduling"
5. **Restart computer**

---

## 🚀 UPDATED KIOSK - NOW WITH RETRY LOGIC

I've updated the kiosk to:
- ✅ **Retry 3 times** if screen capture fails
- ✅ **Show detailed error messages** 
- ✅ **List all available screen sources**
- ✅ **Give troubleshooting hints**

**When you restart the kiosk, you'll see:**
```
🎥 Preparing screen capture... (Attempt 1/3)
📺 Found 2 screen sources:
  1. Entire screen (ID: screen:0:0)
  2. Screen 1 (ID: screen:0:1)
📺 Selected screen source: Entire screen
```

**If it fails:**
```
❌ Error preparing screen capture (Attempt 1/3): [error]
🔄 Retrying in 2 seconds...
🎥 Preparing screen capture... (Attempt 2/3)
```

**After 3 failed attempts:**
```
❌❌❌ SCREEN CAPTURE FAILED AFTER 3 ATTEMPTS!
❌ Possible causes:
  1. Graphics driver issue - update your GPU drivers
  2. Running in Remote Desktop - screen capture doesn't work in RDP
  3. Multiple displays causing conflicts
  4. Windows permissions - run as administrator
```

---

## 📊 HOW TO TEST

### **Step 1: Check if you're in Remote Desktop**
```powershell
# Run in PowerShell
if ($env:SESSIONNAME -like "*RDP*") {
    Write-Host "❌ YOU ARE IN REMOTE DESKTOP SESSION!" -ForegroundColor Red
    Write-Host "✅ Go to the physical computer and run there" -ForegroundColor Green
} else {
    Write-Host "✅ You are on the local computer" -ForegroundColor Green
}
```

### **Step 2: Restart Kiosk**
```bash
cd d:\screen_mirror-1\student-kiosk\desktop-app
npm start
```

### **Step 3: Watch Console**
- Right-click in kiosk → Inspect → Console
- Look for "📺 Found X screen sources"
- Look for "✅ Screen stream obtained successfully"
- Look for "🎉 EMITTING KIOSK-SCREEN-READY EVENT"

### **Step 4: Verify Success**
**✅ If working:**
```
✅ Screen stream obtained successfully
📊 Stream tracks: ['video (Screen)']
🎉 EMITTING KIOSK-SCREEN-READY EVENT
✅ Screen ready event emitted successfully
```

**❌ If still failing:**
```
❌ Error preparing screen capture (Attempt 1/3)
🔄 Retrying in 2 seconds...
```

---

## 🎯 QUICK CHECKLIST

Before running the kiosk, verify:
- [ ] ✅ **NOT** using Remote Desktop (most important!)
- [ ] ✅ Graphics drivers updated
- [ ] ✅ Only one monitor connected
- [ ] ✅ Running as administrator
- [ ] ✅ Hardware acceleration enabled

---

## 🔍 STILL NOT WORKING?

### **Check System Information:**

```powershell
# Run in PowerShell
Write-Host "=== SYSTEM INFO ===" -ForegroundColor Cyan
Write-Host "Session Type: $env:SESSIONNAME"
Write-Host "Computer Name: $env:COMPUTERNAME"
Write-Host "User: $env:USERNAME"
Write-Host "Display Count: $((Get-WmiObject Win32_DesktopMonitor).Count)"
Write-Host "==================" -ForegroundColor Cyan
```

### **Alternative: Use Different Screen Capture Method**

If Desktop Duplication keeps failing, we can try:
1. GDI screen capture (slower but more compatible)
2. Media Foundation screen capture
3. Third-party screen capture libraries

**Let me know if none of the solutions work, and I'll implement an alternative capture method!**

---

## ✅ EXPECTED BEHAVIOR AFTER FIX

**Server Console:**
```
📡 Kiosk registered: [session-id]
🎉 KIOSK SCREEN READY: [session-id]
📡 Notified admins: Kiosk screen ready
```

**Kiosk Console:**
```
🎥 Preparing screen capture... (Attempt 1/3)
📺 Found 1 screen sources
✅ Screen stream obtained successfully
🎉 EMITTING KIOSK-SCREEN-READY EVENT
```

**Admin Console:**
```
🔄 Auto-refreshing sessions...
📋 Active sessions received: [1]
🎉 ADMIN: KIOSK SCREEN READY EVENT RECEIVED
✅ VIDEO TRACK RECEIVED
```

---

**The most common fix is: Don't use Remote Desktop! Run the kiosk on the physical computer.** 🎯
