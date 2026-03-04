# URGENT: Database Migration Check

## The Problem:
Your Reports page shows "No payroll records found" even though you created records.

## Most Likely Cause:
**You haven't run the database migration yet!**

Without the migration, the database doesn't have the new columns, so salary records can't be saved properly.

## SOLUTION - Run This NOW:

### Option 1: Using pgAdmin (RECOMMENDED)
1. Open **pgAdmin**
2. Connect to PostgreSQL
3. Right-click on **hpms_core** database
4. Click **"Query Tool"**
5. Click **"Open File"** button (folder icon)
6. Navigate to: `C:\Users\kezal\Desktop\hcsolutions payroll\backend\scripts\migration-bank-details.sql`
7. Click **Execute** (▶️ button or F5)
8. Look for **SUCCESS** messages

### Option 2: Using Command Line
```powershell
cd "C:\Users\kezal\Desktop\hcsolutions payroll\backend\scripts"
psql -U postgres -d hpms_core -f migration-bank-details.sql
# Password: keza123
```

## After Running Migration:

1. **Restart backend server**:
   - Press Ctrl+C in backend terminal
   - Run: `npm run dev`

2. **Refresh browser** (Ctrl+F5)

3. **Try creating a salary record again**

---

## About the Calculation Errors:

Once the migration is done and records are saving, please tell me:

1. **What specific values are you entering?**
   - Basic Salary: ?
   - Transport: ?
   - Housing: ?
   - Performance: ?

2. **What result are you getting?**
   - NET Salary showing: ?

3. **What result should it be?**
   - Expected NET Salary: ?

I'll fix the calculation formulas once I know the exact issue!

---

## CRITICAL: Run the migration FIRST!
Without it, nothing will work properly.
