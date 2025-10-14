# 📧 Email Configuration Setup for Forgot Password

## 🔧 **Current Status:**
✅ Forgot password functionality is **fully implemented** with all requested steps:
1. Student ID verification
2. Email prompt and verification  
3. OTP generation and email sending
4. OTP verification and new password creation

## 📋 **To Test the Forgot Password Feature:**

### **Option 1: Test Page**
Open: `http://10.10.194.103:8000/test-forgot-password.html`

### **Option 2: Student Kiosk**
1. Open student kiosk
2. Click "Forgot Password?" button
3. Follow the prompts

## ⚙️ **Email Configuration (Required for OTP sending):**

### **Step 1: Create App Password (Gmail)**
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Copy the 16-character password

### **Step 2: Set Environment Variables**
Create `.env` file in `central-admin/server/` with:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
```

### **Step 3: Alternative Email Providers**
Edit `app.js` line 134-142 to change email provider:
```javascript
const emailTransporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',        // Change for other providers
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## 🧪 **Test Students Available:**
- **IT2021005** - Vikram Singh (vikram.singh@college.edu)
- **CS2021001** - Rajesh Kumar (rajesh.kumar@college.edu)  
- **CS2021002** - Priya Sharma (priya.sharma@college.edu)
- **IT2021003** - Arjun Patel (arjun.patel@college.edu)
- **CS2021004** - Sneha Reddy (sneha.reddy@college.edu)

## 🔄 **Complete Flow:**
1. **Student clicks "Forgot Password?"** in kiosk
2. **Enters Student ID** → System verifies student exists
3. **Enters email address** → System verifies email matches student record
4. **Receives 6-digit OTP** via email (expires in 10 minutes)
5. **Enters OTP + new password** → Password is reset successfully
6. **Can login immediately** with new password

## 🚨 **Important Notes:**
- OTP expires in 10 minutes
- Each OTP can only be used once
- Email must match the student's registered email
- New password must be at least 6 characters
- All steps have proper error handling and validation

## 📊 **API Endpoints:**
- `POST /api/forgot-password-initiate` - Verify student ID
- `POST /api/forgot-password-send-otp` - Send OTP to email
- `POST /api/forgot-password-verify-otp` - Verify OTP and reset password

The forgot password feature is **ready to use** - just configure email credentials for OTP delivery!
