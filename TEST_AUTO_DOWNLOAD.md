# 🧪 Quick Test: Auto-Download Reports

## ⚡ 2-Minute Test (Do This Now!)

### **Step 1: Check Current Time**
Current time: **9:24 PM**

### **Step 2: Set Schedule for 2 Minutes Ahead**
Set schedule for: **9:26 PM** (21:26 in 24-hour format)

### **Step 3: Follow These Steps:**

1. **Keep server running** (should already be running)

2. **Open admin dashboard** (if not open):
   ```
   http://192.168.29.212:7401/admin-dashboard.html
   ```

3. **Scroll to "📅 Automatic Report Schedule" section**

4. **Configure:**
   - Lab ID: `CC1` (already selected)
   - Time: `21:26` (type this in time field)
   - Checkbox: ✅ **CHECKED**

5. **Click "💾 Save Schedule"**
   - Should see: "✅ Schedule saved successfully!"

6. **KEEP BROWSER OPEN - DO NOT CLOSE**

7. **Wait for 9:26 PM** (about 2 minutes)

8. **Watch for:**
   - ✅ Green notification in browser: "📊 Report auto-downloaded..."
   - ✅ File downloads to Downloads folder
   - ✅ Server console: "📢 Broadcasting report-ready event"

---

## ✅ Success Indicators

### **Server Console (at 9:26 PM):**
```
📊 Generating scheduled report for lab: CC1 at 21/10/2025, 9:26:00 pm
✅ Report generated: CC1-sessions-2025-10-21.csv
📢 Broadcasting report-ready event to all admin clients for CC1
```

### **Browser Console (at 9:26 PM):**
Press F12 to open console, you should see:
```
📊 ✅ SCHEDULED REPORT READY: { labId: 'CC1', filename: 'CC1-sessions-2025-10-21.csv', count: 15 }
📥 Auto-downloading report to browser...
✅ Report auto-downloaded: CC1-sessions-2025-10-21.csv
```

### **Browser Notification:**
Green toast notification at top-right:
```
✅ Success
📊 Report auto-downloaded: CC1-sessions-2025-10-21.csv (15 sessions)
```

### **Downloads Folder:**
Check: `C:\Users\YourName\Downloads\`
File: `CC1-sessions-2025-10-21.csv`

---

## 📊 Check CSV Content

1. **Open the downloaded CSV file**

2. **Verify it contains:**
   - Header row with columns
   - All sessions from today
   - Active sessions show "Still Active" in Logout Time
   - Completed sessions show actual logout time

3. **Example content:**
```csv
Session ID,Student Name,Student ID,Computer Name,Lab ID,System Number,Login Time,Logout Time,Duration (seconds),Status
68f7a962d2d9848296c39421,Srijaa,715524104158,DESKTOP-CC1,CC1,CC1-12,21/10/2025 9:10:37 PM,21/10/2025 9:13:16 PM,159,completed
68f7a9a9d2d9848296c39452,Srijaa,715524104158,DESKTOP-CC1,CC1,CC1-12,21/10/2025 9:13:49 PM,Still Active,N/A,active
```

---

## ❌ If It Doesn't Work

### **No Download at 9:26 PM?**

1. **Check browser is still open and connected:**
   - F12 → Console
   - Look for: `✅ Socket.io connected`
   - If not, refresh page and try again

2. **Check server console:**
   - Did it show "📊 Generating scheduled report..."?
   - If NO: Schedule didn't run, check time is correct
   - If YES: Check if broadcast message appeared

3. **Check browser console:**
   - Did it receive "scheduled-report-ready" event?
   - If NO: Socket connection lost, refresh page

4. **Try manual download:**
   - Click "📊 Generate Report Now (Test)"
   - If this works, automatic system is functional

---

## 🔄 Test Again (For Daily Schedule)

After confirming 2-minute test works:

1. **Set for tomorrow morning:**
   - Time: `06:00` (6:00 AM)
   - This will run daily at 6 AM

2. **Or set for this evening:**
   - Time: `18:00` (6:00 PM)
   - This will run daily at 6 PM

3. **Keep browser open at scheduled time**

---

## 📝 What to Report

If it works:
✅ "Auto-download working! File downloaded at scheduled time."

If it doesn't work:
❌ Provide these details:
- Server console output at 9:26 PM
- Browser console output (F12)
- Schedule settings (time, enabled status)
- Whether browser was open

---

**Test Now! Time: 9:24 PM → Schedule: 9:26 PM → Wait 2 minutes**
