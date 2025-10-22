# 📅 Automatic Report Scheduling System

## ✅ Implementation Complete!

The automatic report scheduling system has been successfully implemented. This system allows you to configure daily report generation at a specific time for each lab.

---

## 🚀 Setup Instructions

### Step 1: Install node-cron Package

Navigate to the server directory and install the required package:

```bash
cd central-admin\server
npm install node-cron
```

This package is **required** for the scheduler to work. It's already added to `package.json`.

---

## 📊 Features Implemented

### 1. **Backend Components**

- **ReportSchedule Schema**: MongoDB schema to store schedule configurations per lab
- **Cron Scheduler**: Automatically runs at configured times using `node-cron`
- **API Endpoints**:
  - `GET /api/report-schedule/:labId` - Get current schedule for a lab
  - `POST /api/report-schedule` - Save/update schedule configuration
  - `POST /api/generate-report-now` - Manually trigger report generation (for testing)

### 2. **Admin Dashboard UI**

A new section has been added to the admin dashboard (`admin-dashboard.html`) with:

- **Lab ID Selection**: Choose which lab to configure (CC1, CC2, LAB-01)
- **Time Picker**: Set the daily report generation time (24-hour format)
- **Enable/Disable Toggle**: Turn automatic generation on/off
- **Buttons**:
  - 💾 Save Schedule - Save configuration
  - 🔄 Load Current Schedule - Load existing settings
  - 📊 Generate Report Now - Test report generation immediately

### 3. **Report Generation**

Reports are automatically generated with:

- **Daily Schedule**: Runs at the configured time every day
- **Timezone**: Asia/Kolkata (configurable in code)
- **File Format**: CSV with complete session data
- **File Naming**: `{labId}-sessions-{YYYY-MM-DD}.csv`
- **Storage Location**: Downloads directly to browser (user's Downloads folder)
- **Content**: All sessions for the current day (00:00:00 to 23:59:59)
- **Delivery Method**: Automatic browser download (no server storage)

---

## 📖 How to Use

### Initial Setup

1. **Install Dependencies** (if not already done):
   ```bash
   cd central-admin\server
   npm install node-cron
   ```

2. **Start the Server**:
   ```bash
   node app.js
   ```

3. **Open Admin Dashboard**:
   ```
   http://192.168.29.212:7401/admin-dashboard.html
   ```

### Configure Schedule

1. **Scroll to the "Automatic Report Schedule" section** at the bottom of the dashboard

2. **Select Lab ID**: Choose the lab you want to configure (CC1, CC2, or LAB-01)

3. **Set Time**: Use the time picker to set when reports should be generated
   - Example: `18:00` for 6:00 PM daily
   - Uses 24-hour format

4. **Enable/Disable**: Check or uncheck the checkbox to enable/disable automatic generation

5. **Save**: Click "💾 Save Schedule" button

6. **Verify**: The status box will show:
   - ✅ Success message with schedule details
   - Current time setting
   - Enabled/Disabled status
   - Last generated timestamp (if applicable)

### Test Report Generation

1. **Click "📊 Generate Report Now (Test)"** to immediately generate a report

2. **Check the server console** - you'll see:
   ```
   📊 Generating scheduled report for lab: CC1 at [timestamp]
   ✅ Report generated and saved: [filepath]
   ```

3. **Find the Report**: Check your browser's Downloads folder
   - Example: `CC1-sessions-2025-01-21.csv`

### View Scheduled Jobs

When the server starts, you'll see:
```
⏰ Initializing automatic report schedulers...
⏰ Scheduling report for CC1 at 18:00 (0 18 * * *)
✅ 1 report scheduler(s) initialized
```

---

## 📋 Report Format

Generated CSV files include:

| Column | Description |
|--------|-------------|
| Session ID | MongoDB ObjectId |
| Student Name | Full name of student |
| Student ID | Roll number/ID |
| Computer Name | System hostname |
| Lab ID | Lab identifier |
| System Number | System identifier (e.g., CC1-05) |
| Login Time | Formatted timestamp (IST) |
| Logout Time | Formatted timestamp or "Still Active" |
| Duration (seconds) | Session duration |
| Status | active or unknown |

---

## ⚙️ Configuration Options

### Change Timezone

Edit in `app.js` (line ~2807):

```javascript
const task = cron.schedule(cronExpression, () => {
  generateScheduledReport(schedule.labId);
}, {
  timezone: 'Asia/Kolkata'  // Change this to your timezone
});
```

Common timezones:
- `America/New_York` - EST/EDT
- `Europe/London` - GMT/BST
- `Asia/Tokyo` - JST
- `UTC` - Universal Time

### ~~Change Report Storage Location~~

**Note:** Reports now download directly to browser. No server storage configuration needed.

### Add More Labs

Add options in `admin-dashboard.html` (line ~465):

```html
<select id="scheduleLabId">
    <option value="CC1">CC1 - Computer Lab 1</option>
    <option value="CC2">CC2 - Computer Lab 2</option>
    <option value="LAB-01">LAB-01 - General Lab</option>
    <option value="YOUR_LAB">YOUR_LAB - Your Lab Name</option>
</select>
```

---

## 🔍 Troubleshooting

### Reports Not Generating

1. **Check if scheduler is running**:
   - Look for initialization message in server console
   - Verify no errors during startup

2. **Verify schedule is enabled**:
   - Check the checkbox in admin dashboard
   - Reload schedule to confirm

3. **Check time format**:
   - Must be HH:MM in 24-hour format
   - Examples: `09:00`, `18:30`, `23:45`

4. **Verify node-cron is installed**:
   ```bash
   npm list node-cron
   ```

### Manual Testing

Use the "Generate Report Now" button to test without waiting for scheduled time.

### Check Logs

Server console shows:
- `⏰ Scheduling report for...` - Schedule setup
- `📊 Generating scheduled report...` - Report generation started
- `✅ Report generated and saved...` - Success
- `❌ Error generating scheduled report...` - Errors

---

## 🎯 Database Schema

**ReportSchedule Collection**:

```javascript
{
  labId: String,           // Unique lab identifier
  scheduleTime: String,    // HH:MM format (e.g., "18:00")
  enabled: Boolean,        // true/false
  lastGenerated: Date,     // Last successful generation timestamp
  outputPath: String,      // Storage directory path
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📡 API Reference

### Get Schedule

```http
GET /api/report-schedule/:labId
```

**Response**:
```json
{
  "success": true,
  "schedule": {
    "labId": "CC1",
    "scheduleTime": "18:00",
    "enabled": true,
    "lastGenerated": "2025-01-21T12:30:00.000Z",
    "outputPath": "./reports"
  }
}
```

### Save Schedule

```http
POST /api/report-schedule
Content-Type: application/json

{
  "labId": "CC1",
  "scheduleTime": "18:00",
  "enabled": true
}
```

**Response**:
```json
{
  "success": true,
  "schedule": { ... },
  "message": "Schedule updated successfully"
}
```

### Generate Now

```http
POST /api/generate-report-now
Content-Type: application/json

{
  "labId": "CC1"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report generated successfully: CC1-sessions-2025-01-21.csv",
  "filename": "CC1-sessions-2025-01-21.csv",
  "count": 15
}
```

---

## ✨ Example Usage Scenarios

### Scenario 1: Daily Evening Reports

**Setup**: Generate reports at 6 PM every day for CC1
- Lab ID: `CC1`
- Time: `18:00`
- Enabled: ✅

**Result**: Every day at 6 PM, a CSV file is created with all sessions from that day.

### Scenario 2: Multiple Labs, Different Times

**CC1**: Reports at 18:00 (6 PM)
**CC2**: Reports at 20:00 (8 PM)
**LAB-01**: Reports at 22:00 (10 PM)

Configure each lab separately using the Lab ID dropdown.

### Scenario 3: Disable for Weekend Labs

For labs that don't run on weekends:
- Set schedule during the week
- Uncheck "Enable" on Friday evening
- Re-enable on Monday morning

---

## 🚨 Important Notes

1. **One Schedule Per Lab**: Each lab can have only one schedule
2. **Daily Generation**: Reports are generated once per day at the configured time
3. **Today's Data Only**: Each report contains sessions from 00:00:00 to 23:59:59 of the current day
4. **Server Must Run**: The server must be running for scheduled reports to generate
5. **Browser Must Be Open**: Admin dashboard must be open in browser for automatic downloads
6. **Downloads Folder**: Reports download to your browser's default Downloads folder
7. **Timezone Aware**: All times use the configured timezone (default: Asia/Kolkata)

---

## 🎓 System Status

✅ **ReportSchedule Schema** - Added to MongoDB
✅ **Cron Scheduler** - Integrated with node-cron
✅ **API Endpoints** - All endpoints implemented
✅ **Admin UI** - Schedule configuration panel added
✅ **Auto-initialization** - Schedulers start with server
✅ **Manual Testing** - Generate Now button available
✅ **Status Tracking** - Last generation timestamp tracked
✅ **Browser Download** - Reports download directly to user's computer
✅ **Time Controls** - +/− buttons for quick 30-minute adjustments

---

## 📞 Support

If you encounter issues:

1. Check server console logs
2. Verify node-cron is installed: `npm list node-cron`
3. Test manual generation first
4. Ensure MongoDB is connected
5. Check browser download permissions
6. Ensure admin dashboard is open in browser for automatic downloads

---

**Implementation Date**: January 21, 2025
**System Version**: 1.0.0 with Automatic Report Scheduling
