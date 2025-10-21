# 🔌 Automatic System Shutdown Feature

## Overview
The lab management system now supports remote shutdown of student computers from the admin dashboard. This feature allows administrators to shut down individual systems or all lab computers simultaneously.

---

## ✅ Features Implemented

### 1. **Individual System Shutdown**
- Shutdown button on each student card in the admin dashboard
- Confirmation dialog before executing shutdown
- Real-time status updates
- Visual feedback with toast notifications

### 2. **Shutdown All Systems**
- Global button to shutdown all active lab computers
- Double confirmation dialog for safety
- Batch processing of shutdown commands
- Progress tracking and notifications

### 3. **Student-Side Handling**
- Warning alert displayed to students (10 seconds before shutdown)
- Automatic logout and cleanup
- Graceful screen sharing termination
- OS-level shutdown command execution

---

## 🏗️ Architecture Flow

```
Admin Dashboard (Browser)
    ↓ (Socket.io)
    ↓ shutdown-system / shutdown-all-systems
Central Server (Express + Socket.io)
    ↓ (Socket.io)
    ↓ execute-shutdown
Student Kiosk (Electron App)
    ↓ (IPC)
    ↓ shutdown-system
Main Process (Electron)
    ↓ (child_process.exec)
Operating System (Windows/Linux/macOS)
```

---

## 📁 Files Modified

### **Frontend (Admin Dashboard)**
**File:** `central-admin/dashboard/admin-dashboard.html`

**Changes:**
- Added shutdown button to each student card
- Added "Shutdown All Lab Systems" button to control panel
- Implemented `shutdownSystem()` function
- Implemented `shutdownAllSystems()` function
- Added `showNotification()` toast system
- Added CSS styles for shutdown buttons
- Added toast notification animations

### **Backend (Server)**
**File:** `central-admin/server/app.js`

**Changes:**
- Added `shutdown-system` socket event handler
- Added `shutdown-all-systems` socket event handler
- Implemented session-based routing to target specific kiosks
- Added shutdown logging to database
- Added error handling and feedback

### **Student Kiosk (Renderer)**
**File:** `student-kiosk/desktop-app/renderer.js`

**Changes:**
- Added `execute-shutdown` socket event listener
- Implemented `handleShutdownCommand()` function
- Added cleanup for screen streams and peer connections
- Added warning alert for students

### **Electron Main Process**
**File:** `student-kiosk/desktop-app/main-simple.js`

**Changes:**
- Added `shutdown-system` IPC handler
- Implemented OS-specific shutdown commands
- Added automatic logout before shutdown
- Added comprehensive error handling

### **Preload Script**
**File:** `student-kiosk/desktop-app/preload.js`

**Changes:**
- Exposed `shutdownSystem()` API to renderer process

---

## 🖥️ Platform-Specific Commands

### **Windows**
```cmd
shutdown /s /t 10 /c "System shutdown initiated by administrator"
```
- `/s` - Shutdown
- `/t 10` - 10 second delay
- `/c` - Comment/message

### **Linux**
```bash
sudo shutdown -h +1 "System shutdown initiated by administrator"
```
- `-h` - Halt (shutdown)
- `+1` - 1 minute delay
- Requires sudo privileges

### **macOS**
```bash
sudo shutdown -h +1 "System shutdown initiated by administrator"
```
- Same as Linux
- Requires sudo privileges

---

## 🚀 Usage Instructions

### **Shutdown Individual System**

1. Open admin dashboard at: `http://192.168.29.212:7401/admin-dashboard.html`
2. Wait for students to connect
3. Locate the student's card in the grid
4. Click the **"🔌 Shutdown"** button
5. Confirm the action in the dialog
6. Student receives immediate warning
7. System shuts down after 10 seconds

### **Shutdown All Systems**

1. Open admin dashboard
2. Click **"⚠️ Shutdown All Lab Systems"** button in control panel
3. Review the confirmation dialog (shows count of active systems)
4. Confirm the action
5. All students receive immediate warnings
6. All systems shut down after 10 seconds

---

## 🔒 Security Considerations

### **Authentication**
- Only authenticated admins can access the dashboard
- Socket.io connections are verified
- Session-based routing prevents unauthorized shutdowns

### **Confirmation Dialogs**
- Individual shutdown: Single confirmation
- Shutdown all: Double confirmation with explicit warnings
- Clear description of consequences

### **Graceful Shutdown**
- 10-second warning on Windows
- 1-minute warning on Linux/macOS
- Students can save their work
- Automatic session cleanup

### **Audit Logging**
- All shutdown commands are logged in the database
- Includes timestamp and admin identifier
- Logs shutdown type (individual vs. all)

### **Permissions (Linux/macOS)**
⚠️ **Important:** Shutdown commands require `sudo` privileges on Linux/macOS.

**Production Setup:**
1. Configure sudoers to allow shutdown without password:
   ```bash
   # Edit sudoers file
   sudo visudo
   
   # Add this line (replace 'username' with kiosk app user)
   username ALL=(ALL) NOPASSWD: /sbin/shutdown
   ```

2. Or run the Electron app with appropriate privileges

---

## 🧪 Testing Procedure

### **Test 1: Individual Shutdown**

1. Start the server:
   ```bash
   cd central-admin/server
   node app.js
   ```

2. Start a student kiosk:
   ```bash
   cd student-kiosk/desktop-app
   npm start
   ```

3. Login as a student in the kiosk

4. Open admin dashboard in browser:
   ```
   http://192.168.29.212:7401/admin-dashboard.html
   ```

5. Verify student appears in the grid

6. Click "🔌 Shutdown" button on the student's card

7. Confirm the dialog

8. **Expected Results:**
   - Student sees warning alert
   - Status shows "🔌 Shutdown initiated..."
   - Toast notification appears on dashboard
   - After 10 seconds, student computer begins shutdown
   - Session is logged out and cleaned up

### **Test 2: Shutdown All Systems**

1. Start multiple student kiosks (on different computers if possible)

2. Login with different students

3. Open admin dashboard

4. Verify all students appear in the grid

5. Click "⚠️ Shutdown All Lab Systems"

6. Confirm the double-confirmation dialog

7. **Expected Results:**
   - All students see warning alerts
   - All statuses show "🔌 Shutdown initiated..."
   - Toast shows count of systems
   - All computers begin shutdown after 10 seconds

### **Test 3: Error Handling**

1. Logout a student from the kiosk

2. Try to shutdown that student from the dashboard

3. **Expected Result:**
   - Error toast appears: "Student not connected"
   - No shutdown occurs

---

## 📊 Database Logging

Shutdown actions are logged in the `Session` collection:

```javascript
{
  _id: ObjectId("..."),
  studentId: "CS2021001",
  studentName: "John Doe",
  systemNumber: "CC1-01",
  shutdownInitiatedAt: ISODate("2025-01-21T10:15:30Z"),
  shutdownBy: "admin" | "admin-all"
}
```

---

## 🐛 Troubleshooting

### **Issue: Shutdown command not executing**

**Windows:**
- Check Event Viewer for shutdown logs
- Verify no group policies blocking shutdown
- Ensure Electron app has necessary permissions

**Linux/macOS:**
- Check if sudo password is required
- Verify sudoers configuration
- Check system logs: `journalctl -xe` (Linux) or Console.app (macOS)

### **Issue: Student not receiving shutdown command**

1. Check socket.io connection:
   - Open browser console
   - Look for "Socket connected" messages

2. Verify session ID matching:
   - Admin dashboard logs show session IDs
   - Kiosk logs show registered session IDs
   - They must match

3. Check server logs:
   - Look for "Shutdown signal sent to kiosk" message
   - If not present, kiosk socket not registered

### **Issue: Multiple shutdown warnings**

- Clear the kiosk socket map on reconnection
- Ensure only one kiosk instance per session
- Check for duplicate socket registrations

---

## 🎯 Future Enhancements

### **Possible Improvements:**

1. **Scheduled Shutdowns**
   - Set shutdown time in advance
   - Automatic end-of-lab shutdown

2. **Restart Option**
   - Add restart button alongside shutdown
   - Useful for system maintenance

3. **Shutdown Timer Display**
   - Show countdown on student screen
   - Allow admin to cancel during countdown

4. **Selective Shutdown**
   - Multi-select students
   - Shutdown by department/section

5. **Wake-on-LAN Integration**
   - Remote power-on capability
   - Complete remote management

---

## 📝 API Reference

### **Socket Events**

#### **Admin → Server**
```javascript
// Shutdown specific system
socket.emit('shutdown-system', { 
  sessionId: String 
});

// Shutdown all systems in lab
socket.emit('shutdown-all-systems', { 
  labId: String 
});
```

#### **Server → Kiosk**
```javascript
// Execute shutdown
socket.emit('execute-shutdown');
```

#### **Server → Admin**
```javascript
// Shutdown error
socket.emit('shutdown-error', { 
  sessionId: String, 
  error: String 
});

// Shutdown all complete
socket.emit('shutdown-all-complete', { 
  labId: String, 
  count: Number 
});
```

#### **Electron IPC**
```javascript
// Renderer → Main
window.electronAPI.shutdownSystem()
  .then(result => {
    // { success: Boolean, message: String }
  });
```

---

## ⚠️ Important Notes

1. **Screen Mirroring Preserved**: All WebRTC functionality remains intact
2. **No Breaking Changes**: Existing features continue to work normally
3. **Windows Only (Currently)**: Full testing on Windows completed
4. **Linux/macOS**: Requires sudo configuration for production use
5. **Network Required**: Kiosk must be connected to server via socket.io

---

## 📞 Support

For issues or questions:
1. Check server logs: `central-admin/server/app.js` console output
2. Check kiosk logs: Electron developer console (Ctrl+Shift+I)
3. Check browser logs: Admin dashboard developer console (F12)

---

## ✅ Status

**Current Implementation Status:** ✅ COMPLETE

- ✅ Individual system shutdown
- ✅ Shutdown all systems
- ✅ Confirmation dialogs
- ✅ Toast notifications
- ✅ Error handling
- ✅ Database logging
- ✅ Graceful cleanup
- ✅ Windows compatibility
- ⚠️ Linux/macOS (requires sudo configuration)

**System IP:** 192.168.29.212:7401
