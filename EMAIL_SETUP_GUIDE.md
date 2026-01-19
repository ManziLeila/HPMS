# 📧 Email Configuration Guide for HC Solutions Payroll

## Current Status
✅ Email service is implemented and ready  
❌ SMTP credentials are not configured (commented out in `.env`)

---

## Quick Setup (Gmail)

### Step 1: Generate Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** (if not already enabled)
4. After enabling 2FA, go back to Security
5. Scroll down to **"How you sign in to Google"**
6. Click **"App passwords"**
7. Select:
   - App: **Mail**
   - Device: **Windows Computer** (or Other)
8. Click **Generate**
9. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update `.env` File

Open `backend/.env` and **uncomment** lines 33-39, then update:

```env
# --------------------------------------
# Email / SMTP Configuration
# --------------------------------------
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=manzileila03@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=manzileila03@gmail.com
SMTP_FROM_NAME=HC Solutions Payroll
```

**Important**: 
- Replace `abcd efgh ijkl mnop` with your actual app password
- Remove spaces from the app password (make it: `abcdefghijklmnop`)
- Keep `SMTP_SECURE=false` for port 587

### Step 3: Restart Backend Server

```powershell
# Press Ctrl+C in the backend terminal
# Then restart:
npm run dev
```

### Step 4: Test Email

Create a test salary record and check if email is sent. Look for this in backend logs:
```
✅ Payslip email sent successfully: <message-id>
```

Or if SMTP is not configured:
```
⚠️ SMTP not configured. Skipping email notification.
```

---

## Alternative Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@company.com
SMTP_PASSWORD=your-password
```

### Custom SMTP Server
```env
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourcompany.com
SMTP_PASSWORD=your-password
```

---

## What Happens When Email is Configured

### Automatic Emails Sent

1. **When Salary is Created** (via Employee Form):
   - Employee receives email notification
   - Includes: Pay period, gross salary, net salary
   - PDF payslip attached

2. **When Payslip is Downloaded** (with `?sendEmail=true` query param):
   - Employee receives email with PDF attachment

### Email Templates

The system uses professional HTML email templates:

**Salary Processed Email**:
- Subject: "Salary Processed - January 2026"
- Content: Salary summary with download link
- Attachment: PDF payslip

**Payslip Delivery Email**:
- Subject: "Your Payslip - January 2026"
- Content: Professional message
- Attachment: PDF payslip

---

## Troubleshooting

### "SMTP not configured" Warning
✅ **This is normal** if you haven't set up email yet  
✅ System works fine without email  
✅ Payslips can still be downloaded manually

### Email Not Sending (After Configuration)

**Check 1: App Password**
- Did you use an app-specific password (not your regular Gmail password)?
- Did you remove spaces from the password?

**Check 2: 2-Factor Authentication**
- Gmail requires 2FA to be enabled for app passwords

**Check 3: Backend Logs**
Look for errors in the backend terminal:
```
❌ Failed to send payslip email: Invalid login
```

**Check 4: Firewall**
- Ensure port 587 is not blocked
- Try port 465 with `SMTP_SECURE=true`

**Check 5: Less Secure Apps**
- Gmail no longer supports "less secure apps"
- You MUST use app passwords

### Testing Email Configuration

You can test email without creating a salary record:

1. Add this test endpoint to `backend/src/routes/index.js`:
```javascript
router.get('/test-email', async (req, res) => {
  const { sendTestEmail } = await import('../services/emailService.js');
  const result = await sendTestEmail('your-email@gmail.com');
  res.json(result);
});
```

2. Visit: `http://localhost:5000/test-email`
3. Check your inbox

---

## Security Best Practices

1. **Never commit `.env` to Git**
   - Already in `.gitignore`
   - Contains sensitive credentials

2. **Use App Passwords**
   - Never use your main Gmail password
   - Revoke app passwords when no longer needed

3. **Rotate Passwords Regularly**
   - Change app passwords every 6 months
   - Update `.env` file

4. **Production Deployment**
   - Use environment variables (not `.env` file)
   - Use dedicated email service (SendGrid, AWS SES, etc.)

---

## Email Service Code

The email service is already implemented in:
- **Service**: `backend/src/services/emailService.js`
- **Templates**: `backend/src/utils/emailTemplates.js`
- **Usage**: `backend/src/controllers/salaryController.js` (lines 73-128)

### Functions Available

1. `sendSalaryProcessedEmail()` - Basic notification
2. `sendPayslipEmail()` - Email with PDF attachment
3. `sendTestEmail()` - Test SMTP configuration

---

## Summary

**To Enable Email Notifications:**
1. ✅ Get Gmail app password
2. ✅ Uncomment and update `.env` lines 33-39
3. ✅ Restart backend server
4. ✅ Test by creating a salary record

**Current Behavior (Without Email):**
- ✅ System works normally
- ✅ Payslips can be downloaded
- ⚠️ No automatic email notifications
- ⚠️ Backend logs show "SMTP not configured"

**After Email Configuration:**
- ✅ Employees receive automatic emails
- ✅ PDF payslips attached
- ✅ Professional email templates
- ✅ No manual distribution needed

---

Need help? Check backend logs for detailed error messages!
