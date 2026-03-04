# Email Setup Guide for HC Solutions Payroll

## Overview
The payroll system has email functionality built-in to automatically send:
1. **Salary Processed Notifications** - When a new salary is created
2. **Payslip PDFs** - Attached to emails when salaries are processed
3. **Test Emails** - To verify SMTP configuration

## Current Status
✅ Email service implemented (`src/services/emailService.js`)
✅ Professional HTML email templates (`src/utils/emailTemplates.js`)
✅ Integration with salary controller
⚠️ **SMTP credentials need to be configured**

## Setup Instructions

### Step 1: Generate Gmail App Password

Since you're using Gmail (`manzileila03@gmail.com`), you need to create an **App Password** (not your regular Gmail password):

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/security

2. **Enable 2-Step Verification** (if not already enabled)
   - Click on "2-Step Verification"
   - Follow the prompts to enable it

3. **Create App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device and name it "HC Solutions Payroll"
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 2: Update .env File

Open `backend/.env` and replace the placeholder password:

```bash
SMTP_PASSWORD=your-app-specific-password-here
```

With your actual app password (remove spaces):

```bash
SMTP_PASSWORD=abcdefghijklmnop
```

### Step 3: Restart Backend Server

After updating the `.env` file, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test Email Configuration

You can test the email setup using the test endpoint:

**Using curl:**
```bash
curl -X POST http://localhost:4000/api/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{\"email\": \"manzileila03@gmail.com\"}"
```

**Using Postman or Thunder Client:**
- Method: POST
- URL: `http://localhost:4000/api/test-email`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_JWT_TOKEN`
- Body (JSON):
  ```json
  {
    "email": "manzileila03@gmail.com"
  }
  ```

## How Email Works in the System

### 1. When Creating a Salary
When you create a new salary record via the API, the system automatically:
- Generates a payslip PDF
- Sends an email to the employee with the PDF attached
- Uses the `payslipDeliveryTemplate` for the email body

**Example API Call:**
```bash
POST /api/salaries
{
  "employeeId": 1,
  "payPeriod": "2026-01-01",
  "baseSalary": 500000,
  "transportAllowance": 50000,
  "housingAllowance": 100000
}
```

### 2. Email Notification Features
- ✅ Professional HTML templates with company branding
- ✅ PDF payslip attachment
- ✅ Salary breakdown (gross, net, deductions)
- ✅ Automatic retry on failure (logged to console)
- ✅ Graceful fallback if SMTP not configured

### 3. Employee Email Preferences
Employees can disable email notifications in their profile. Check the `email_notifications_enabled` field in the employees table.

## Troubleshooting

### Error: "SMTP not configured"
**Solution:** Make sure you've uncommented the SMTP settings in `.env` and added your app password.

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"
**Solution:** 
- You're using your regular Gmail password instead of an App Password
- Generate an App Password following Step 1 above
- Make sure 2-Step Verification is enabled

### Error: "Connection timeout"
**Solution:**
- Check your firewall settings
- Ensure port 587 is not blocked
- Try using port 465 with `SMTP_SECURE=true`

### Emails not being sent
**Check the backend console logs:**
- Look for "SMTP not configured" warnings
- Check for "Payslip email sent successfully" messages
- Review any error messages

### Testing with different email provider
If you want to use a different email provider (not Gmail):

**For Outlook/Hotmail:**
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

**For SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

## Email Templates

The system includes two professional email templates:

### 1. Salary Processed Template
- Blue gradient header
- Salary summary table
- Call-to-action button
- Professional footer

### 2. Payslip Delivery Template
- Green gradient header
- PDF attachment notice
- Instructions for viewing payslip
- Important reminders

Both templates are mobile-responsive and look great on all devices.

## Security Notes

⚠️ **Important Security Considerations:**
- Never commit your `.env` file to Git
- App passwords are safer than regular passwords
- Rotate app passwords periodically
- Use environment variables in production
- Consider using a dedicated email service (SendGrid, AWS SES) for production

## Next Steps

1. ✅ Generate Gmail App Password
2. ✅ Update `.env` with the app password
3. ✅ Restart backend server
4. ✅ Test email functionality
5. ✅ Create a test salary record to verify email delivery

## Support

If you encounter any issues:
1. Check the backend console logs
2. Verify your Gmail App Password is correct
3. Ensure 2-Step Verification is enabled on your Google account
4. Test with the `/api/test-email` endpoint first
