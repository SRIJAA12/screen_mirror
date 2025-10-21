# 🔌 System Shutdown - Quick Reference Card

## Admin Dashboard Controls

### Individual Shutdown
**Button:** 🔌 Shutdown (on each student card)
**Action:** Shuts down single student computer
**Warning Time:** 10 seconds
**Requires:** Single confirmation

### Shutdown All Systems
**Button:** ⚠️ Shutdown All Lab Systems (top control panel)
**Action:** Shuts down all active lab computers
**Warning Time:** 10 seconds per system
**Requires:** Double confirmation

---

## What Happens When You Click Shutdown

### For the Student:
1. ⚠️ Alert popup appears with warning
2. 🔄 Screen mirroring stops
3. 🚪 Automatic logout from session
4. 🔌 Computer shuts down in 10 seconds
5. 💾 Time to save work (10 seconds)

### For the Admin:
1. ✅ Confirmation dialog
2. 📊 Status updates to "Shutdown initiated..."
3. 🔔 Toast notification confirms command sent
4. 📝 Action logged to database
5. 🎯 Real-time feedback on dashboard

---

## Safety Features

✅ **Confirmation Dialogs**
- Individual: 1 confirmation
- All systems: 2 confirmations with warnings

✅ **Visual Feedback**
- Status updates on student cards
- Toast notifications
- Color-coded indicators

✅ **Audit Trail**
- All shutdowns logged
- Timestamp recorded
- Admin action tracked

✅ **Grace Period**
- 10-second warning (Windows)
- Students can save work
- Clean session termination

---

## When to Use

### ✅ Good Use Cases:
- End of lab session
- Emergency situations
- System maintenance required
- Forgotten logged-in systems
- Security incidents

### ❌ Avoid Using:
- During active exams
- While students are saving files
- Without prior warning to students
- When unsaved work is visible

---

## Troubleshooting

### Shutdown Not Working?
1. Check if student is actually connected (green status)
2. Verify socket.io connection in console
3. Look for error notifications on dashboard
4. Check server logs for detailed errors

### Student Didn't Receive Warning?
1. Socket connection may be lost
2. Try individual shutdown instead of bulk
3. Check network connectivity
4. Restart kiosk application

### Command Sent But Nothing Happens?
1. Windows: Check group policy settings
2. Linux/macOS: Verify sudo permissions configured
3. Check Electron console for execution errors
4. Verify user has shutdown privileges

---

## Emergency Stop

If you need to **CANCEL** a shutdown:

### Windows:
```cmd
shutdown /a
```
Run this in Command Prompt on the student computer

### Linux/macOS:
```bash
sudo shutdown -c
```
Run this in Terminal on the student computer

**Note:** Must be done BEFORE the timer expires!

---

## Best Practices

1. **Announce Before Shutdown**
   - Verbally warn students first
   - Give time to save work
   - Use shutdown as last resort

2. **End Sessions Properly**
   - Use "End Lab Session" first
   - This logs out but doesn't shut down
   - Cleaner approach for normal situations

3. **Monitor Status**
   - Watch for "Shutdown initiated" status
   - Check for error notifications
   - Verify systems actually power off

4. **Document Issues**
   - Note any failed shutdowns
   - Report persistent problems
   - Check audit logs for patterns

---

## Quick Command Summary

| Action | Button | Confirmation | Effect |
|--------|--------|-------------|--------|
| Shutdown One | 🔌 Shutdown | 1x | Single system powers off |
| Shutdown All | ⚠️ Shutdown All | 2x | All systems power off |
| Cancel | N/A | - | Use OS command on target PC |

---

## Access URLs

- **Admin Dashboard:** http://192.168.29.212:7401/admin-dashboard.html
- **Server Status:** http://192.168.29.212:7401/
- **Student Management:** http://192.168.29.212:7401/student-management-system.html

---

## Support Contacts

**Technical Issues:** Check server console logs
**Network Issues:** Verify IP address: 192.168.29.212:7401
**Permission Issues:** Contact system administrator

---

## Remember

⚠️ **With great power comes great responsibility!**

- Always confirm twice before "Shutdown All"
- Give students time to save
- Use for legitimate purposes only
- Monitor the dashboard for confirmations

🎯 **This feature is for lab management convenience**
Not a replacement for proper session ending procedures!
