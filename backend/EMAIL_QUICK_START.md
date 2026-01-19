# Quick Start: Email Configuration

## 🎯 What You Need to Do

Your email system is **already built** and ready to use! You just need to add your Gmail App Password.

## 📋 Step-by-Step Setup (5 minutes)

### 1️⃣ Get Your Gmail App Password

1. **Open this link:** https://myaccount.google.com/apppasswords
   - You'll need to sign in with `manzileila03@gmail.com`
   
2. **If you see "App passwords":**
   - Click "Select app" → Choose "Mail"
   - Click "Select device" → Choose "Other" → Type "HC Payroll"
   - Click **Generate**
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

3. **If you DON'T see "App passwords":**
   - First enable 2-Step Verification: https://myaccount.google.com/signinoptions/two-step-verification
   - Follow the prompts to set it up
   - Then go back to step 1

### 2️⃣ Update Your .env File

1. Open `backend/.env` in your editor
2. Find this line:
   ```
   SMTP_PASSWORD=your-app-specific-password-here
   ```
3. Replace it with your app password (remove the spaces):
   ```
   SMTP_PASSWORD=abcdefghijklmnop
   ```
4. **Save the file**

### 3️⃣ Restart Your Backend

In your terminal where the backend is running:
- Press `Ctrl+C` to stop
- Run `npm run dev` to restart

### 4️⃣ Test It!

**Option A: Using the Test Script (Easiest)**
```bash
cd backend
node test-email.js manzileila03@gmail.com YOUR_JWT_TOKEN
```

**Option B: Using Thunder Client / Postman**
- Method: `POST`
- URL: `http://localhost:4000/api/test-email`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_JWT_TOKEN`
- Body:
  ```json
  {
    "email": "manzileila03@gmail.com"
  }
  ```

## ✅ Success Indicators

If everything works, you should see:
- ✅ "Test email sent successfully" in the API response
- ✅ An email in your inbox with subject "Test Email - HC Solutions Payroll"

## 🎉 What Happens Next?

Once configured, the system will **automatically**:
- 📧 Send payslip emails when you create new salary records
- 📎 Attach PDF payslips to the emails
- 💰 Include salary breakdown and details
- 🎨 Use professional HTML email templates

## 🆘 Troubleshooting

### "SMTP not configured"
→ You forgot to update the `.env` file or didn't restart the backend

### "Invalid login"
→ You're using your regular Gmail password instead of an App Password

### "Connection timeout"
→ Check your firewall or try port 465 with `SMTP_SECURE=true`

### Still stuck?
→ Check `EMAIL_SETUP_GUIDE.md` for detailed troubleshooting

## 📚 More Information

- **Full Setup Guide:** `EMAIL_SETUP_GUIDE.md`
- **Email Templates:** `src/utils/emailTemplates.js`
- **Email Service:** `src/services/emailService.js`

---

**Need help?** All the email functionality is already implemented. You just need to add your Gmail App Password! 🚀
