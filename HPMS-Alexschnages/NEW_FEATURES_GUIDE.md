# HC Solutions Payroll - New Features Guide

## 🎯 What's New

### 1. Professional Payslip Design ✅
- Clean, business-style layout with bordered tables
- Employee information section (name, department, role, joining date)
- Earnings and deductions in organized tables
- Net salary displayed in both numbers and words
- Signature sections for employer and employee

### 2. MFA (Multi-Factor Authentication) System ✅
- HR can generate MFA QR codes for employees
- Finance Officers receive credentials from HR
- Secure authentication using Google Authenticator

### 3. New Employee Roles ✅
- **HR Role**: Full administrative access, can manage MFA for all users
- **Finance Officer Role**: Limited access to payroll reports and payslips

---

## 📋 Setup Instructions

### Step 1: Run Database Migration

**IMPORTANT**: You must run this migration first!

1. Open **pgAdmin 4**
2. Connect to database: `hpms_core`
3. Open Query Tool (Tools → Query Tool)
4. Open file: `backend/scripts/migration-employee-fields-and-roles.sql`
5. Execute the script (F5 or click ▶)

This migration adds:
- `department` and `date_of_joining` fields to employees
- `HR` and `FinanceOfficer` roles
- Migrates existing Admin users to HR role

### Step 2: Enable MFA (Optional)

MFA is currently **DISABLED** to allow testing without authenticator setup.

To enable MFA:
1. Open `backend/.env`
2. Add this line: `MFA_REQUIRED=true`
3. Restart the backend server

---

## 🔐 MFA Management (For HR)

### Generate MFA for a Finance Officer

**API Endpoint**: `POST /api/mfa/generate`

**Request Body**:
```json
{
  "employeeId": 123
}
```

**Response**:
```json
{
  "message": "MFA credentials generated successfully",
  "data": {
    "employeeId": 123,
    "employeeName": "John Doe",
    "employeeEmail": "john@example.com",
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,...",
    "otpauthUrl": "otpauth://totp/..."
  }
}
```

### How HR Provides MFA to Finance Officer

1. **Generate MFA** using the endpoint above
2. **Share the QR Code** with the Finance Officer (display it on screen or send securely)
3. Finance Officer **scans the QR code** with Google Authenticator
4. Finance Officer can now **login with MFA code**

### Reset MFA for an Employee

**API Endpoint**: `POST /api/mfa/reset`

**Request Body**:
```json
{
  "employeeId": 123
}
```

---

## 📄 New Payslip Features

### What's Included

The new payslip now shows:
- **Employee Details**: Name, Department, Role, Date of Joining
- **Pay Information**: Pay Period, Worked Days (default: 26)
- **Earnings Table**: Basic Salary, Allowances, Total Earnings
- **Deductions Table**: PAYE, RSSB, RAMA, CBHI, Total Deductions, Net Pay
- **Net Pay in Words**: e.g., "Five Hundred Thousand"
- **Signature Sections**: For employer and employee

### How to Generate Payslips

The payslip generation works the same way as before:
1. Create a salary record via the API or frontend
2. Download the payslip PDF
3. The new professional design will be automatically applied

---

## 🧪 Testing Checklist

### Test Payslip Design
- [ ] Create a test salary record
- [ ] Download the payslip PDF
- [ ] Verify the new professional layout
- [ ] Check that all fields display correctly
- [ ] Verify net salary appears in words

### Test MFA System (After Migration)
- [ ] Login as HR user
- [ ] Create a Finance Officer account
- [ ] Generate MFA for the Finance Officer
- [ ] Scan QR code with Google Authenticator
- [ ] Login as Finance Officer with MFA code
- [ ] Verify Finance Officer can access payroll reports

### Test Database Migration
- [ ] Run the migration script in pgAdmin
- [ ] Verify new columns exist (department, date_of_joining)
- [ ] Verify new roles exist (HR, FinanceOfficer)
- [ ] Check that existing Admin users are now HR users

---

## 🔧 API Endpoints Reference

### MFA Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/mfa/generate` | Generate MFA for employee | HR only |
| POST | `/api/mfa/reset` | Reset MFA for employee | HR only |
| GET | `/api/mfa/status/:employeeId` | Check MFA status | HR or self |

### Employee Fields (Updated)

When creating or updating employees, you can now include:
- `department` (string)
- `dateOfJoining` (date, format: YYYY-MM-DD)

---

## 📝 Notes

- **MFA is currently DISABLED** - This allows you to test the system first
- **Default worked days**: 26 (can be made configurable later)
- **Existing Admin users**: Automatically migrated to HR role
- **QR Codes**: Generated as base64 data URLs for easy display

---

## 🆘 Troubleshooting

### Payslip shows "N/A" for department
- Make sure you've run the database migration
- Update employee records to include department field

### MFA endpoints return 403 Forbidden
- Make sure you're logged in as an HR user
- Check that the migration has been run (HR role must exist)

### Backend won't start after changes
- Make sure `qrcode` package is installed: `npm install qrcode`
- Check that all new files are in the correct locations
- Restart the backend server

---

## 🎉 Ready to Use!

Your payroll system now has:
✅ Professional payslip design  
✅ MFA management for HR  
✅ Role-based access control  
✅ Department and joining date tracking  

For questions or issues, check the implementation plan or contact support.
