# Updated Email Template Documentation

## 📧 New Professional Payslip Email Template

The email template has been updated to a more professional format with detailed employee information and confidentiality notices.

## ✨ Template Features

### 1. **Complete Employee Information**
- Employee Name
- Employee ID
- Pay Period
- Net Pay (formatted in RWF)
- Payment Date (automatically calculated as 2 business days after processing)

### 2. **Professional Styling**
- Clean, modern design with blue gradient header
- Organized summary box with employee details
- Confidentiality notice with warning styling
- Complete company signature with contact information

### 3. **Confidentiality Notice**
- Prominent warning about confidential information
- Professional legal language
- Eye-catching yellow notice box

### 4. **Company Branding**
- Company name throughout the email
- Complete contact information (email & phone)
- Professional signature block

## 📋 Template Parameters

### Required Parameters
- `employeeName` - Full name of the employee
- `employeeId` - Employee's ID number
- `payPeriod` - Formatted pay period (e.g., "January 2026")
- `netSalary` - Formatted net salary (e.g., "RWF 450,000")
- `payDate` - Payment date (e.g., "January 17, 2026")
- `pdfBuffer` - PDF payslip attachment
- `filename` - PDF filename

### Optional Parameters (with defaults)
- `companyName` - Default: "HC Solutions"
- `hrContact` - Default: "HR Department"
- `responseDays` - Default: "5"
- `senderName` - Default: "Payroll Team"
- `jobTitle` - Default: "Payroll Administrator"
- `companyEmail` - Default: "payroll@hcsolutions.rw"
- `companyPhone` - Default: "+250 788 000 000"

## 🎨 Email Structure

```
┌─────────────────────────────────────────┐
│  📄 Your Payslip for January 2026      │  ← Blue gradient header
├─────────────────────────────────────────┤
│                                         │
│  Dear John Doe,                         │
│                                         │
│  We hope this message finds you well.   │
│                                         │
│  Please find attached your payslip...   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 📋 Payslip Summary:               │ │  ← Summary box
│  │                                   │ │
│  │  Employee Name:     John Doe      │ │
│  │  Employee ID:       EMP001        │ │
│  │  Pay Period:        January 2026  │ │
│  │  Net Pay:           RWF 450,000   │ │
│  │  Payment Date:      Jan 17, 2026  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Kindly review the attached document... │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🔒 Confidentiality Notice:        │ │  ← Warning box
│  │ This email and the attached...    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Thank you for your contribution...     │
│                                         │
│  Kind regards,                          │
│  Payroll Team                           │  ← Signature
│  Payroll Administrator                  │
│  HC Solutions                           │
│  📧 payroll@hcsolutions.rw             │
│  📞 +250 788 000 000                   │
│                                         │
├─────────────────────────────────────────┤
│  Automated message from HC Solutions    │  ← Footer
└─────────────────────────────────────────┘
```

## 🔄 Automatic Data Formatting

The system automatically formats:

1. **Pay Period**: Converts date to readable format
   - Input: `"2026-01-01"`
   - Output: `"January 2026"`

2. **Net Salary**: Formats with Rwandan Franc currency
   - Input: `450000`
   - Output: `"RWF 450,000"`

3. **Payment Date**: Calculates 2 business days after processing
   - Input: `"2026-01-15"` (processing date)
   - Output: `"January 17, 2026"` (payment date)

## 📝 Example Usage

### When Creating a Salary

```javascript
// Automatically sent when creating a salary record
POST /api/salaries
{
  "employeeId": 1,
  "payPeriod": "2026-01-01",
  "baseSalary": 500000,
  "transportAllowance": 50000,
  "housingAllowance": 100000
}

// Email is automatically sent with:
// - Employee Name: Retrieved from database
// - Employee ID: Retrieved from database
// - Pay Period: "January 2026"
// - Net Salary: "RWF 450,000" (calculated)
// - Payment Date: "January 17, 2026" (auto-calculated)
// - PDF Attachment: Generated payslip
```

### Manual Email Send

```javascript
// When downloading a payslip with email option
GET /api/salaries/123/payslip?sendEmail=true
```

## 🎯 Customization Options

You can customize the email by providing optional parameters:

```javascript
sendPayslipEmail({
  employeeEmail: "john@example.com",
  employeeName: "John Doe",
  employeeId: "EMP001",
  payPeriod: "January 2026",
  netSalary: "RWF 450,000",
  payDate: "January 17, 2026",
  pdfBuffer: pdfBuffer,
  filename: "payslip.pdf",
  
  // Custom company details
  companyName: "Your Company Name",
  hrContact: "HR Manager - Jane Smith",
  responseDays: "7",
  senderName: "Finance Team",
  jobTitle: "Senior Payroll Officer",
  companyEmail: "finance@yourcompany.com",
  companyPhone: "+250 123 456 789",
});
```

## 🔐 Security Features

1. **Confidentiality Notice**: Legal disclaimer about sensitive information
2. **Recipient Verification**: Email only sent to employee's registered email
3. **Secure Attachment**: PDF payslip attached securely
4. **Response Window**: Clear deadline for reporting discrepancies (5 working days)

## 📱 Mobile Responsive

The email template is fully responsive and looks great on:
- Desktop email clients (Outlook, Thunderbird, etc.)
- Web email (Gmail, Outlook.com, etc.)
- Mobile devices (iOS Mail, Android Gmail, etc.)

## 🎨 Color Scheme

- **Header**: Blue gradient (#0ea5e9 to #0284c7)
- **Summary Box**: Light blue background (#f0f9ff) with blue border
- **Notice Box**: Yellow background (#fef3c7) with orange border
- **Text**: Professional grays and blacks for readability

## ✅ What Changed from Previous Template

| Feature | Old Template | New Template |
|---------|-------------|--------------|
| Employee ID | ❌ Not included | ✅ Included in summary |
| Net Salary | ❌ Not in summary | ✅ Formatted in summary |
| Payment Date | ❌ Not shown | ✅ Auto-calculated and shown |
| Confidentiality Notice | ❌ Generic warning | ✅ Professional legal notice |
| Company Contact | ❌ Basic footer | ✅ Full contact details |
| Signature | ❌ Generic | ✅ Professional with title |
| Response Deadline | ❌ Not specified | ✅ Clear 5-day deadline |

## 🚀 Testing the New Template

1. **Create a test salary record**:
   ```bash
   POST http://localhost:4000/api/salaries
   {
     "employeeId": 1,
     "payPeriod": "2026-01-01",
     "baseSalary": 500000
   }
   ```

2. **Check your email** for the new professional format

3. **Verify all fields** are populated correctly:
   - ✅ Employee name and ID
   - ✅ Formatted pay period
   - ✅ Formatted net salary
   - ✅ Payment date
   - ✅ PDF attachment
   - ✅ Company contact info

## 📞 Support

If you need to customize the template further:
1. Edit `backend/src/utils/emailTemplates.js`
2. Modify the `payslipDeliveryTemplate` function
3. Update default values or styling as needed
4. Restart the backend server

---

**Template Version**: 2.0 (Professional Edition)
**Last Updated**: January 15, 2026
**Author**: HC Solutions Development Team
