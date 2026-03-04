# TROUBLESHOOTING GUIDE

## Issue 1: Calculations Don't Match

### Quick Test:
1. Open browser: http://localhost:5173
2. Login: sysadmin@hcsolutions.com / Admin123!
3. Go to Employee Form page
4. Enter these EXACT values:
   - Basic Salary: 752292
   - Transport Allowance: 252311
   - Housing Allowance: 525407
   - Performance Allowance: 0
   - Advance Amount: 0

5. Look at "Calculated Results" section
6. Check if NET SALARY shows approximately: **706,652 RWF**

### If the number is DIFFERENT:
- The calculation formula might be wrong
- Tell me what number you see instead

### If you get an ERROR:
- You probably didn't run the database migration
- See "CRITICAL STEP" below

---

## Issue 2: Layout Problems

### What to check:
1. Are there TOO MANY fields on the form?
2. Is the form CONFUSING or CLUTTERED?
3. Are fields in the WRONG ORDER?
4. Is it hard to USE on your screen?

### Tell me:
- Which page has the problem? (Employee Form / Reports / Dashboard)
- What specifically looks wrong?
- What would you like it to look like instead?

---

## CRITICAL STEP: Database Migration

### You MUST run this first or nothing will work!

**Using pgAdmin:**
1. Open pgAdmin
2. Connect to PostgreSQL
3. Right-click "hpms_core" database
4. Click "Query Tool"
5. Click "Open File" button
6. Select: C:\Users\kezal\Desktop\hcsolutions payroll\backend\scripts\migration-bank-details.sql
7. Click Execute (F5)
8. Look for SUCCESS messages

**Using Command Line:**
```powershell
cd "C:\Users\kezal\Desktop\hcsolutions payroll\backend\scripts"
psql -U postgres -d hpms_core -f migration-bank-details.sql
```

---

## After Migration:

1. Restart backend server:
   - Press Ctrl+C in backend terminal
   - Run: npm run dev

2. Refresh browser:
   - Press Ctrl+F5 (hard refresh)

3. Test again with the values above

---

## Still Having Issues?

Please tell me:
1. ✅ Did you run the migration? (Yes/No)
2. ✅ What NET SALARY number do you see?
3. ✅ What page has layout problems?
4. ✅ What specifically looks wrong?

I'll fix it immediately once I know the specific issues!
