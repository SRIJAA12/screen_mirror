# 📧 Email Setup Guide for OTP Sending

## 🎯 **Enable Real Email Sending for OTP**

Your system is now configured to send OTP emails to real email addresses instead of just showing them in the console.

---

## 🔧 **Method 1: Quick Setup (Hardcoded - For Testing)**

### **Step 1: Edit the Server File**

Open `d:\screen_mirror\central-admin\server\app.js` and find these lines (around line 146-147):

```javascript
const EMAIL_USER = process.env.EMAIL_USER || 'your-college-email@gmail.com'; // Replace with your Gmail
const EMAIL_PASS = process.env.EMAIL_PASS || 'your-app-password'; // Replace with Gmail App Password
```

**Replace with your actual Gmail credentials:**

```javascript
const EMAIL_USER = process.env.EMAIL_USER || 'your-actual-email@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'your-actual-app-password';
```

### **Step 2: Get Gmail App Password**

1. **Go to your Google Account:** https://myaccount.google.com/
2. **Security → 2-Step Verification** (enable if not already)
3. **App passwords** → Generate new app password
4. **Select "Mail"** and **"Other"** → Name it "College Lab System"
5. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### **Step 3: Update the Code**

```javascript
const EMAIL_USER = process.env.EMAIL_USER || 'yourname@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'abcd efgh ijkl mnop'; // Your app password
```

---

## 🔒 **Method 2: Secure Setup (Environment Variables - Recommended)**

### **Step 1: Create .env File**

Create a file named `.env` in `d:\screen_mirror\central-admin\server\` folder:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
MONGODB_URI=mongodb+srv://srijaaanandhan12_db_user:122007@cluster0.2kzkkpe.mongodb.net/college-lab-registration?retryWrites=true&w=majority
BCRYPT_SALT_ROUNDS=10
```

### **Step 2: The Code Will Automatically Use These**

The system will automatically pick up the environment variables and use them for email sending.

---

## 📧 **Email Configuration Options**

### **Option 1: Use Your Personal Gmail**
- **Pros:** Easy setup, immediate testing
- **Cons:** Uses your personal email
- **Best for:** Testing and small deployments

### **Option 2: Create Dedicated College Gmail**
- **Email:** `college-lab-system@gmail.com`
- **Pros:** Professional, dedicated account
- **Cons:** Need to create new account
- **Best for:** Production use

### **Option 3: Use College Email Server**
If your college has its own email server, update the configuration:

```javascript
emailTransporter = nodemailer.createTransporter({
  host: 'mail.yourcollege.edu', // Your college SMTP server
  port: 587,
  secure: false,
  auth: {
    user: 'lab-system@yourcollege.edu',
    pass: 'your-password'
  }
});
```

---

## 🧪 **Testing Email Setup**

### **Step 1: Restart Server**
```bash
cd central-admin\server
node app.js
```

**Look for these messages:**
```
✅ Email server is ready to send emails
📧 Email configured: your-email@gmail.com
```

### **Step 2: Test OTP Sending**

**Use the Forgot Password Tester:**
```
http://192.168.29.212:8000/forgot-password-tester.html
```

**Or test in kiosk:**
1. Open kiosk → Click "Forgot Password?"
2. Enter student ID and email
3. Check if email arrives in inbox

### **Step 3: Check Server Console**

You'll see messages like:
```
📧 SENDING OTP EMAIL:
👤 Student: Test User
📧 Email: student@college.edu
🔢 OTP CODE: 123456
📤 Attempting to send email to: student@college.edu
✅ Email sent successfully!
📧 Message ID: <message-id>
📬 Email delivered to: student@college.edu
```

---

## 🚨 **Troubleshooting**

### **"Email configuration error" Message**

**Common Issues:**
1. **Wrong Gmail password** - Use App Password, not regular password
2. **2-Step Verification not enabled** - Required for App Passwords
3. **Less secure app access** - Not needed with App Passwords

### **"Authentication failed" Error**

**Solutions:**
1. **Double-check App Password** - Copy exactly, including spaces
2. **Enable 2-Step Verification** on Gmail account
3. **Generate new App Password** if old one doesn't work

### **Emails Not Arriving**

**Check:**
1. **Spam/Junk folder** - Gmail might filter them
2. **Email address spelling** - Verify student email is correct
3. **Server console** - Look for error messages

### **"Connection timeout" Error**

**Solutions:**
1. **Check internet connection**
2. **Firewall settings** - Allow port 587
3. **Try different SMTP settings**

---

## 📋 **Email Template Preview**

When students receive OTP emails, they'll see:

```
Subject: 🔐 Password Reset OTP - College Lab System

Dear [Student Name],

You have requested to reset your password for the College Lab System.

[Large OTP Code: 123456]

⏰ Important:
• This OTP will expire in 10 minutes
• Use this code in the kiosk interface to reset your password  
• Do not share this OTP with anyone

If you did not request this password reset, please ignore this email.
```

---

## ✅ **Quick Setup Checklist**

- [ ] **Get Gmail App Password** from Google Account settings
- [ ] **Update EMAIL_USER and EMAIL_PASS** in app.js or .env file
- [ ] **Restart the server** (node app.js)
- [ ] **Look for "Email server is ready"** message
- [ ] **Test with Forgot Password Tester** tool
- [ ] **Check email inbox** for OTP delivery
- [ ] **Test complete flow** in kiosk interface

---

## 🎉 **Once Setup is Complete:**

✅ **OTP emails will be sent to real email addresses**
✅ **Students will receive professional-looking emails**
✅ **Backup console logging still works** for debugging
✅ **System gracefully falls back** if email fails

**Your forgot password system will now send real emails!** 📧🚀
