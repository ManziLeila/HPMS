# Database Migration Instructions - UPDATED

## ⚠️ Important: Two-Step Migration Process

PostgreSQL requires enum values to be committed before they can be used. Therefore, this migration is split into **two parts** that must be run separately.

---

## Step 1: Run Part 1 - Add Columns and Enum Values

1. **Open pgAdmin 4**
2. **Connect to your database**: `hpms_core`
3. **Open Query Tool** (Tools → Query Tool)
4. **Open the migration file**: 
   - File → Open
   - Navigate to: `c:\Users\kezal\Desktop\hcsolutions payroll\backend\scripts\migration-employee-fields-and-roles.sql`
5. **Execute the script** (Click the ▶ Execute button or press F5)
6. **Verify** you see:
   - ✅ New columns: `department`, `date_of_joining`
   - ✅ New enum values: `Admin`, `Employee`, `FinanceOfficer`, `HR`

---

## Step 2: Run Part 2 - Migrate Admin to HR

**IMPORTANT**: Wait a few seconds after Part 1, then:

1. **In the same Query Tool** (or open a new one)
2. **Open the second migration file**:
   - File → Open
   - Navigate to: `c:\Users\kezal\Desktop\hcsolutions payroll\backend\scripts\migration-employee-fields-and-roles-part2.sql`
3. **Execute the script** (Click ▶ or press F5)
4. **Verify** you see:
   - ✅ Existing Admin users now have role = 'HR'

---

## What These Migrations Do

### Part 1:
✅ Adds `department` field to employees table  
✅ Adds `date_of_joining` field to employees table  
✅ Adds `HR` role to employee_role enum  
✅ Adds `FinanceOfficer` role to employee_role enum  

### Part 2:
✅ Migrates existing `Admin` users to `HR` role  

---

## Verification

After running both parts, you should see:
- New columns in the employees table
- Your admin users now have the HR role
- The system ready to use the new features

---

## Troubleshooting

### Error: "unsafe use of new value"
- This means you tried to run both parts together
- Solution: Run Part 1 first, wait a moment, then run Part 2 separately

### Error: "enum value already exists"
- This is safe to ignore - it means the migration has already been run
- The script checks for existing values before adding them

---

## Next Steps

Once you've run both migration parts:
1. ✅ Test the new payslip design
2. ✅ Create Finance Officer accounts
3. ✅ Generate MFA for users
4. ✅ Enable MFA in `.env` if desired

---

**Note**: You only need to run these migrations once. The scripts are designed to be safe to run multiple times (they check if changes already exist before making them).
