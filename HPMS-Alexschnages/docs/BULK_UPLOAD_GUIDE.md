# Bulk Salary Upload Feature

## Overview
The Bulk Salary Upload feature allows Finance Officers and HR personnel to process multiple employee salaries at once by uploading an Excel file. This significantly reduces the time needed to calculate salaries for many employees.

## Key Features

### 1. **Excel File Upload**
- Upload a single Excel file containing salary data for multiple employees
- Supports both `.xls` and `.xlsx` formats
- Maximum file size: 10MB

### 2. **Automatic Processing**
- Automatically creates employee records if they don't exist
- Calculates all payroll components (PAYE, RSSB, RAMA, CBHI, etc.)
- Encrypts sensitive salary data
- Provides detailed success/failure reports

### 3. **Batch Payslip Generation**
- Download all payslips as a single ZIP file
- Each payslip is a PDF with complete salary breakdown
- Organized by employee name and pay period

### 4. **Automated Email Distribution**
- Send payslip emails to all employees with one click
- Each email includes personalized salary information
- PDF payslip attached to each email

## Excel File Format

### Required Columns
- **Full Name**: Employee's full name (e.g., "John Doe")
- **Email**: Employee's email address (e.g., "john.doe@company.com")
- **Basic Salary**: Base salary amount in RWF (e.g., 1000000)

### Optional Columns
- **Transport Allowance**: Transportation allowance in RWF
- **Housing Allowance**: Housing allowance in RWF
- **Performance Allowance**: Performance-based allowance in RWF
- **Variable Allowance**: Variable/incentive allowance in RWF
- **Advance Amount**: Advance payment to deduct in RWF

### Example Excel Structure

| Full Name | Email | Basic Salary | Transport Allowance | Housing Allowance | Performance Allowance | Variable Allowance | Advance Amount |
|-----------|-------|--------------|---------------------|-------------------|----------------------|-------------------|----------------|
| John Doe | john.doe@example.com | 1000000 | 50000 | 100000 | 50000 | 0 | 0 |
| Jane Smith | jane.smith@example.com | 1200000 | 60000 | 120000 | 60000 | 0 | 0 |

## How to Use

### Step 1: Prepare Your Excel File
1. Download the template from the Bulk Upload page
2. Fill in employee data following the format above
3. Ensure all required columns are present
4. Save the file as `.xlsx` or `.xls`

### Step 2: Configure Upload Settings
1. Select the **Pay Period** (month and year)
2. Choose the **Pay Frequency** (Monthly, Weekly, or Daily)
3. Check/uncheck **Include RAMA Insurance** (7.5%)

### Step 3: Upload and Process
1. Click "Choose Excel File" and select your file
2. Click "Upload & Process"
3. Wait for the system to process all records
4. Review the results summary

### Step 4: Download Payslips or Send Emails
After successful upload, you can:
- **Download All Payslips**: Get a ZIP file with all payslips
- **Send Emails to All Employees**: Automatically send payslip emails

## Important Notes

### Decimal Values
- All salary values are now displayed with **2 decimal places**
- Calculations preserve exact decimal values (no rounding)
- This ensures accurate financial reporting

### Error Handling
- If any row fails to process, it will be listed in the "Failed Records" section
- Successful records are still saved even if some fail
- Review error messages to fix issues in your Excel file

### Employee Creation
- If an employee email doesn't exist in the system, a new employee record is created automatically
- Existing employees are matched by email address
- Employee role defaults to "Employee"

### Security
- All salary data is encrypted in the database
- Only authorized users (Finance Officer, HR, Admin) can access bulk upload
- All operations are logged in the audit trail

## Best Practices

1. **Test with Small Batches First**: Start with 2-3 employees to verify your Excel format
2. **Double-Check Email Addresses**: Ensure all emails are correct before uploading
3. **Verify Calculations**: Review the results summary before sending emails
4. **Keep Backups**: Save your Excel files for record-keeping
5. **Download Payslips**: Always download the ZIP file before sending emails

## Troubleshooting

### Common Errors

**"Missing required fields"**
- Ensure Full Name, Email, and Basic Salary are filled for all rows

**"Failed to create/find employee"**
- Check that email addresses are valid
- Ensure no duplicate emails in the same file

**"Only Excel files (.xls, .xlsx) are allowed"**
- Save your file in Excel format, not CSV or other formats

**"File too large"**
- Maximum file size is 10MB
- Split large files into smaller batches

## API Endpoints

### Upload Salaries
```
POST /api/salaries/bulk/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: Excel file
- payPeriod: YYYY-MM-DD
- frequency: monthly|weekly|daily
- includeMedical: true|false
```

### Download Payslips
```
POST /api/salaries/bulk/download-payslips
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "salaryIds": [1, 2, 3, ...]
}
```

### Send Emails
```
POST /api/salaries/bulk/send-emails
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "salaryIds": [1, 2, 3, ...]
}
```

## Changes Made

### Backend Changes
1. Created `bulkSalaryController.js` with three main functions:
   - `bulkUploadSalaries`: Process Excel file and create salary records
   - `downloadBulkPayslips`: Generate ZIP file with all payslips
   - `sendBulkPayslipEmails`: Send emails to all employees

2. Created `bulkSalaryRoutes.js` with protected routes

3. Added required packages:
   - `xlsx`: Excel file parsing
   - `jszip`: ZIP file generation
   - `multer`: File upload handling

### Frontend Changes
1. Created `BulkUploadPage.jsx`: Main bulk upload interface
2. Created `BulkUploadPage.css`: Styling for the page
3. Updated `App.jsx`: Added route for `/bulk-upload`
4. Updated `Sidebar.jsx`: Added navigation link
5. Updated `ShellLayout.jsx`: Added page title
6. Updated `payroll.js`: Changed currency formatting to show 2 decimal places

## Future Enhancements

Potential improvements for future versions:
- Support for Google Sheets direct integration
- Validation preview before processing
- Scheduled bulk uploads
- Custom email templates
- Progress bar for large uploads
- Export failed records to Excel for correction
