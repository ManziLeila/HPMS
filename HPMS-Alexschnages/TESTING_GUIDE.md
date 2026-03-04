# 🚀 Quick Start Testing Guide

## Prerequisites Checklist

Before testing the new salary CRUD features, ensure:

- [ ] Backend server is running on port 5000
- [ ] Frontend server is running on port 5173  
- [ ] Database migration has been applied
- [ ] You have admin login credentials

---

## Starting the Servers

### Backend Server
```powershell
cd "c:\Users\kezal\Desktop\hcsolutions payroll\backend"
npm run dev
```
**Expected output**: `Server running on port 5000`

### Frontend Server
```powershell
cd "c:\Users\kezal\Desktop\hcsolutions payroll\frontend"
npm run dev
```
**Expected output**: `Local: http://localhost:5173/`

---

## Quick Test (5 Minutes)

### 1. Login
- Navigate to: http://localhost:5173
- Email: `sysadmin@hcsolutions.com`
- Password: `Admin123!`

### 2. Create Test Salary Record
- Go to **Employee Form** page
- Fill in:
  - Full Name: `Test Employee`
  - Email: `test@example.com`
  - Pay Period: `2026-01-31` (current month)
  - Basic Salary: `1000000`
  - Transport: `50000`
  - Housing: `100000`
- Click **"Create Salary"**
- ✅ Should see success message

### 3. Test Edit Feature
- Go to **Reports** page
- Set filters: Year `2026`, Month `01`
- Click **"Refresh"**
- Find your test record
- Click **"✏️ Edit"** button
- ✅ Modal should open
- Change Basic Salary to: `1500000`
- Click **"Save Changes"**
- ✅ Record should update, gross salary changes

### 4. Test Delete Feature
- On same record, click **"🗑️ Delete"** button
- ✅ Confirmation modal appears
- Click **"Delete Salary Record"**
- ✅ Record removed from table

### 5. Verify UI
- Check that all 3 buttons appear: Edit, Delete, Download
- Try clicking **"📄 Download"** on another record
- ✅ PDF should download

---

## What to Look For

### ✅ Success Indicators
- No errors in browser console (F12)
- No errors in backend terminal
- Modals open and close smoothly
- Tables refresh after edit/delete
- Status messages appear
- Buttons are styled correctly (green Edit, red Delete, blue Download)

### ❌ Potential Issues
- If edit modal shows all zeros: This is expected (see walkthrough)
- If "No records found": Check month/year filters
- If buttons don't appear: Clear browser cache (Ctrl+Shift+R)
- If API fails: Check backend server is running

---

## Database Migration (If Needed)

If you see errors about missing columns:

### Option 1: pgAdmin
1. Open pgAdmin
2. Connect to `hpms_core` database
3. Open Query Tool
4. Load file: `backend/scripts/migration-bank-details.sql`
5. Execute (F5)

### Option 2: Command Line
```powershell
# Find psql.exe location first
Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Filter "psql.exe" -Recurse

# Then run (adjust path as needed):
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d hpms_core -f "backend\scripts\migration-bank-details.sql"
# Password: keza123
```

---

## Troubleshooting

### Backend won't start
```powershell
cd backend
npm install
npm run dev
```

### Frontend won't start
```powershell
cd frontend
npm install
npm run dev
```

### Port already in use
```powershell
# Find and kill process on port 5000 or 5173
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## Next Steps After Testing

1. Review the [walkthrough.md](file:///C:/Users/kezal/.gemini/antigravity/brain/a6a55879-2170-4ffd-9b15-58df43b95e38/walkthrough.md) for detailed documentation
2. Check the [implementation_plan.md](file:///C:/Users/kezal/.gemini/antigravity/brain/a6a55879-2170-4ffd-9b15-58df43b95e38/implementation_plan.md) for technical details
3. Report any issues or request additional features
4. Consider implementing the recommended enhancements listed in walkthrough

---

**Ready to test!** 🎉
