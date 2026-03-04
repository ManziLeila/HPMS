# HC Solutions Payroll System - Rwandan Tax Implementation

## Recent Updates

This system has been updated to comply with Rwandan tax regulations and includes the following new features:

### ✅ Payroll Calculations (Updated)
- **Basic Salary**: Initial salary (not including allowances)
- **Gross Salary**: Transport + Housing + Performance allowances
- **PAYE Base**: 60,000 RWF exemption
- **Tax Brackets**: 0% (0-60k), 10% (60k-100k), 20% (100k-200k), 30% (>200k)
- **RSSB Pension**: 6% of gross salary (employee & employer)
- **RSSB Maternity**: 0.3% of basic salary
- **RAMA Insurance**: 7.5% of basic salary (optional)
- **CBHI**: 0.5% of NET (before CBHI)
- **Occupational Hazard**: 2% of basic salary (employer only)

### ✅ New Features
- **Bank Details**: Store employee bank account information
- **Advance Payments**: Track salary advances
- **Email Notifications**: Notify employees when salary is processed
- **Enhanced Payslips**: Improved PDF with bank details and advance amounts
- **Responsive Design**: Mobile-friendly employee forms

---

## 🚀 Setup Instructions

### 1. Database Migration

**IMPORTANT**: Run this migration to add new fields to your database.

#### Option A: Using pgAdmin
1. Open pgAdmin and connect to your `hpms_core` database
2. Open the Query Tool
3. Open the file: `backend/scripts/migration-bank-details.sql`
4. Execute the script (F5)
5. Verify the output shows successful column additions

#### Option B: Using psql Command Line
```bash
cd backend/scripts
psql -U postgres -d hpms_core -f migration-bank-details.sql
```

### 2. Email Notifications Setup (Optional)

To enable email notifications when salaries are processed:

1. Edit `backend/.env` file
2. Uncomment and configure the SMTP settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=HC Solutions Payroll
```

**For Gmail users:**
- Go to Google Account Settings → Security → 2-Step Verification
- Generate an "App Password" for "Mail"
- Use that app password (not your regular password)

### 3. Restart Backend Server

After running the migration and configuring SMTP:

```bash
cd backend
npm run dev
```

---

## 📋 Default Login Credentials

```
Email: sysadmin@hcsolutions.com
Password: Admin123!
```

OR

```
Email: admin@hcsolutions.com
Password: Admin123!
```

---

## 🧪 Testing the New Features

### Test Payroll Calculations

1. Navigate to **Employee Form** page
2. Fill in the following test data:
   - **Full Name**: Test Employee
   - **Email**: test@example.com
   - **Phone Number**: +250 XXX XXX XXX
   - **Bank Name**: Bank of Kigali
   - **Account Number**: 1234567890
   - **Account Holder Name**: Test Employee
   - **Basic Salary**: 1,000,000 RWF
   - **Transport Allowance**: 50,000 RWF
   - **Housing Allowance**: 100,000 RWF
   - **Performance Allowance**: 50,000 RWF
   - **Advance Amount**: 50,000 RWF

3. Click "Validate with Payroll Engine"
4. Verify the calculations match Rwandan tax regulations

### Expected Results (for above test data):
- **Gross Salary**: 1,200,000 RWF
- **PAYE Tax**: ~228,000 RWF (progressive)
- **RSSB Pension (6%)**: 72,000 RWF
- **RSSB Maternity (0.3%)**: 3,000 RWF
- **RAMA (7.5%)**: 75,000 RWF
- **CBHI (0.5% of NET before CBHI)**: ~4,100 RWF
- **Advance**: 50,000 RWF
- **Net Salary**: ~767,900 RWF

### Test Payslip Download

1. Go to **Reports** page
2. Create a salary record for an employee
3. Click the download button
4. Verify the PDF includes:
   - Bank details (if provided)
   - Advance amount (if any)
   - Correct calculations
   - Updated percentages (6% RSSB, 0.5% CBHI, etc.)

### Test Email Notifications

1. Configure SMTP settings in `.env`
2. Create a salary record
3. Check the employee's email inbox
4. Verify they received a notification with salary details

---

## 📱 Responsive Design

The employee form is now fully responsive:
- **Desktop**: Multi-column layout with all fields visible
- **Tablet**: Adaptive grid layout
- **Mobile**: Single column, touch-friendly inputs

Test on different screen sizes using browser DevTools (F12 → Toggle Device Toolbar).

---

## 🔧 Troubleshooting

### Database Migration Issues

**Error: "column already exists"**
- This is normal if you run the migration twice
- The migration script is idempotent (safe to run multiple times)

**Error: "permission denied"**
- Make sure you're connected as a user with ALTER TABLE permissions
- Try connecting as `postgres` superuser

### Email Notification Issues

**Emails not sending**
- Check SMTP credentials in `.env`
- Verify SMTP_HOST and SMTP_PORT are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Check backend console for error messages

**No error but emails not received**
- Check spam/junk folder
- Verify the employee's email address is correct
- Check that `email_notifications_enabled` is TRUE in the database

### Calculation Issues

**Numbers don't match expectations**
- Verify you're using the correct formula:
  - Gross = Basic + Transport + Housing + Performance
  - RSSB Pension = 6% of Gross (not Basic)
  - CBHI = 0.5% of NET before CBHI
- Check browser console for JavaScript errors
- Compare frontend and backend calculations

---

## 📚 Additional Resources

### Database Schema Changes

New columns added to `employees` table:
- `bank_name` (TEXT)
- `account_number_enc` (BYTEA) - encrypted
- `account_holder_name` (TEXT)
- `phone_number` (TEXT)
- `email_notifications_enabled` (BOOLEAN)
- `sms_notifications_enabled` (BOOLEAN)

New column added to `salaries` table:
- `advance_amount` (NUMERIC)

### API Endpoints

No new endpoints were added, but existing endpoints now support:
- `advanceAmount` parameter in salary creation
- Bank details in employee data
- Email notifications triggered automatically

---

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Configure SMTP (optional)
3. ✅ Test payroll calculations
4. ✅ Test payslip downloads
5. ⏭️ Train users on new fields
6. ⏭️ Update employee records with bank details
7. ⏭️ Configure production SMTP for live environment

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the implementation plan in `.gemini/antigravity/brain/*/implementation_plan.md`
3. Check backend logs for detailed error messages

---

**Last Updated**: December 2025
**Version**: 2.0.0 - Rwandan Tax Compliance Update
