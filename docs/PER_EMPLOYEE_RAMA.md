# Per-Employee RAMA Insurance Settings

## Feature Overview

The bulk upload now supports **per-employee RAMA insurance** settings, allowing you to specify which employees should have RAMA insurance deducted and which shouldn't.

---

## How It Works

### **Option 1: Global Setting (Default)**

If you don't include the "Include RAMA" column in your Excel file, the system uses the **global checkbox** setting from the upload form:

- ✅ **Checked** = All employees get RAMA (7.5%)
- ❌ **Unchecked** = No employees get RAMA

### **Option 2: Per-Employee Setting (Recommended)**

Add an **"Include RAMA"** column to your Excel file to control RAMA insurance for each employee individually:

```csv
Full Name,Email,Basic Salary,...,Include RAMA
John Doe,john@example.com,1000000,...,Yes
Jane Smith,jane@example.com,1200000,...,No
Bob Wilson,bob@example.com,800000,...,Yes
```

---

## Accepted Values for "Include RAMA" Column

The system accepts multiple formats:

| Value | Result |
|-------|--------|
| `Yes`, `yes`, `Y`, `y` | ✅ Include RAMA (7.5% deduction) |
| `No`, `no`, `N`, `n` | ❌ No RAMA deduction |
| `True`, `true`, `TRUE`, `1` | ✅ Include RAMA |
| `False`, `false`, `FALSE`, `0` | ❌ No RAMA |
| *(empty)* | Uses global setting |

---

## Examples

### Example 1: Mixed RAMA Settings

```csv
Full Name,Email,Basic Salary,Transport Allowance,Housing Allowance,Performance Allowance,Variable Allowance,Advance Amount,Include RAMA
John Doe,john.doe@example.com,1000000,50000,100000,50000,0,0,Yes
Jane Smith,jane.smith@example.com,1200000,60000,120000,60000,0,0,No
Bob Wilson,bob.wilson@example.com,800000,40000,80000,40000,0,0,Yes
Alice Brown,alice.brown@example.com,900000,45000,90000,45000,0,0,No
```

**Result:**
- John Doe: RAMA deducted (7.5% of 1,000,000 = 75,000 RWF)
- Jane Smith: No RAMA
- Bob Wilson: RAMA deducted (7.5% of 800,000 = 60,000 RWF)
- Alice Brown: No RAMA

### Example 2: Using Global Setting

If you **don't** include the "Include RAMA" column:

```csv
Full Name,Email,Basic Salary,Transport Allowance,Housing Allowance,Performance Allowance,Variable Allowance,Advance Amount
John Doe,john.doe@example.com,1000000,50000,100000,50000,0,0
Jane Smith,jane.smith@example.com,1200000,60000,120000,60000,0,0
```

Then check/uncheck the **"Include RAMA Insurance (7.5%)"** checkbox in the upload form:
- ✅ Checked = Both employees get RAMA
- ❌ Unchecked = Neither employee gets RAMA

---

## Priority

**Per-employee setting overrides global setting:**

1. If "Include RAMA" column exists → Use the value from Excel
2. If "Include RAMA" column is empty → Use global checkbox setting
3. If "Include RAMA" column doesn't exist → Use global checkbox setting

---

## Use Cases

### ✅ When to Use Per-Employee Settings:

- **Mixed workforce**: Some employees are Rwandan (need RAMA), others are expats (don't need RAMA)
- **Contract types**: Full-time employees get RAMA, contractors don't
- **Probation periods**: New employees might not have RAMA during probation
- **Part-time workers**: May or may not be eligible for RAMA

### ✅ When to Use Global Setting:

- **Uniform policy**: All employees have the same RAMA status
- **Simple payroll**: Small company with consistent benefits
- **Quick uploads**: Don't want to add extra column to Excel

---

## Updated Template

Download the new template from the Bulk Upload page. It now includes:

```csv
Full Name,Email,Basic Salary,Transport Allowance,Housing Allowance,Performance Allowance,Variable Allowance,Advance Amount,Include RAMA
John Doe,john.doe@example.com,1000000,50000,100000,50000,0,0,Yes
Jane Smith,jane.smith@example.com,1200000,60000,120000,60000,0,0,No
```

---

## Benefits

✅ **Flexibility**: Different RAMA settings for different employees  
✅ **Accuracy**: Correct deductions based on employee eligibility  
✅ **Compliance**: Properly handle expats, contractors, and special cases  
✅ **Backward Compatible**: Old Excel files without "Include RAMA" column still work  

---

## Summary

- **Add "Include RAMA" column** to your Excel for per-employee control
- **Use Yes/No, True/False, or 1/0** as values
- **Leave empty or omit column** to use global checkbox setting
- **Download updated template** for the correct format

This gives you complete control over RAMA insurance deductions for each employee! 🎯
