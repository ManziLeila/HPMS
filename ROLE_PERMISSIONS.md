# Role Permissions Summary

## HR (Senior HR) - Full Administrative Access

The HR role has **complete access** to all system features:

### 📊 Analytics & Reporting
- ✅ View all dashboard analytics
- ✅ Access executive dashboard statistics
- ✅ View comprehensive payroll reports
- ✅ Export data to Excel
- ✅ Download all payslips

### 👥 Employee & Salary Management
- ✅ Create, edit, delete employees
- ✅ Manage all employee details
- ✅ Create and manage salary records
- ✅ Compute salary calculations
- ✅ Generate payslips
- ✅ Process payroll

### 🔐 Credential & MFA Management (HR ONLY)
- ✅ Generate MFA QR codes for Finance Officers
- ✅ Reset MFA for any user
- ✅ View MFA status for all users
- ✅ Provide authenticator codes to Finance Officers
- ✅ Manage user access and permissions

### 💼 Full System Access
- ✅ All features available
- ✅ Complete administrative control
- ✅ Can perform all operations

---

## Finance Officer - Payroll Operations Access

Finance Officers can manage day-to-day payroll operations:

### 💰 Payroll Operations
- ✅ Create, edit, delete employees
- ✅ Manage employee details
- ✅ Create and manage salary records
- ✅ Compute salary calculations
- ✅ Generate and download payslips
- ✅ View payroll reports
- ✅ Export monthly reports to Excel

### 📈 Limited Analytics
- ✅ View basic payroll reports
- ✅ Access monthly summaries
- ❌ No access to executive analytics (HR only)

### 🔒 No Credential Management
- ❌ Cannot generate MFA codes
- ❌ Cannot reset MFA for users
- ❌ Cannot manage user credentials
- ℹ️ Must receive MFA setup from HR

---

## Employee - Limited Access

Regular employees have restricted access:

### 📄 Personal Access Only
- ✅ View own payslip (if implemented)
- ❌ No access to employee management
- ❌ No access to salary operations
- ❌ No access to reports
- ❌ No access to analytics

---

## Key Differences

| Feature | HR | Finance Officer | Employee |
|---------|----|-----------------| ---------|
| **Analytics Dashboard** | ✅ Full | ⚠️ Limited | ❌ No |
| **Employee Management** | ✅ Yes | ✅ Yes | ❌ No |
| **Salary Calculations** | ✅ Yes | ✅ Yes | ❌ No |
| **Generate Payslips** | ✅ Yes | ✅ Yes | ❌ No |
| **MFA Management** | ✅ Yes | ❌ No | ❌ No |
| **Credential Management** | ✅ Yes | ❌ No | ❌ No |
| **Export Reports** | ✅ Yes | ✅ Yes | ❌ No |

---

## Workflow: HR and Finance Officer

### 1. HR Sets Up Finance Officer
1. HR creates Finance Officer account
2. HR generates MFA QR code
3. HR provides credentials + QR code to Finance Officer
4. Finance Officer scans QR code with Google Authenticator
5. Finance Officer can now login with MFA

### 2. Daily Operations
- **Finance Officer**: Handles day-to-day payroll processing
  - Creates salary records
  - Generates payslips
  - Manages employee data
  
- **HR**: Oversees operations and manages access
  - Views analytics
  - Manages credentials
  - Handles MFA for new users
  - Monitors system usage

### 3. Security Model
- **HR** = Full administrative control
- **Finance Officer** = Operational access, no credential management
- **Employee** = Personal data only (future feature)

---

## Summary

**HR Role**: Complete system administrator with full access to analytics, credentials, and all operations.

**Finance Officer Role**: Operational role for payroll processing, can compute calculations and manage salaries, but cannot manage user credentials or MFA.

**Employee Role**: Limited to personal data viewing only.
