# Email Testing Guide

## 🧪 Test Email Functionality

The SMTP is configured with:
- **Host**: smtp.gmail.com
- **Port**: 587
- **User**: manzileila03@gmail.com
- **Password**: yclmfqyqdjqxyogr (App Password)

### Quick Test Options

#### Option 1: Test via API Endpoint

**Using Thunder Client / Postman:**

```http
POST http://localhost:4000/api/test-email
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "email": "manzileila03@gmail.com"
}
```

#### Option 2: Create a Salary Record

When you create a salary, an email should be sent automatically:

```http
POST http://localhost:4000/api/salaries
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "employeeId": 1,
  "payPeriod": "2026-01-15",
  "baseSalary": 500000,
  "transportAllowance": 50000,
  "housingAllowance": 100000
}
```

### Check Backend Logs

After attempting to send an email, check the backend console for:

**Success:**
```
✅ Payslip email sent successfully: <message-id>
```

**Failure:**
```
❌ Failed to send payslip email: <error message>
⚠️  SMTP not configured. Skipping payslip email.
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "SMTP not configured" | Password not set | Already configured ✅ |
| "Invalid login" | Wrong password | Try regenerating app password |
| "Connection timeout" | Firewall/port blocked | Check firewall settings |
| "Authentication failed" | 2FA not enabled | Enable 2-Step Verification |

### Verify Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Check if "HC Solutions Payroll" app password exists
3. If not, generate a new one
4. Update `.env` with new password
5. Restart backend

### Manual SMTP Test (Node.js)

Create a file `test-smtp.js` in backend directory:

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'manzileila03@gmail.com',
    pass: 'yclmfqyqdjqxyogr'
  }
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"HC Solutions" <manzileila03@gmail.com>',
      to: 'manzileila03@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email from HC Solutions Payroll',
      html: '<h1>Test Email</h1><p>SMTP is working!</p>'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
}

testEmail();
```

Run it:
```bash
node test-smtp.js
```

### What to Check

1. **Backend Console** - Look for email-related logs
2. **Gmail Inbox** - Check for test emails (and spam folder)
3. **Gmail Security** - Check for blocked sign-in attempts
4. **App Password** - Verify it's still valid

### Next Steps

Please try:
1. Send a test email via the API endpoint
2. Share the backend console output
3. Check if you received any email
4. Check Gmail for security alerts

This will help me identify the exact issue!
