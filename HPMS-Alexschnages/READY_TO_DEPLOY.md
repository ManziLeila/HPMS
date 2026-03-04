# ✅ READY TO RUN MIGRATION!

## Current Status

All code has been updated to work with your **`hpms_core` schema**. The migration is ready to run!

---

## 🚀 Step-by-Step Deployment

### Step 1: Run the Migration Script

Open your SQL client (pgAdmin, DBeaver, or psql) and run:

```bash
# File location:
backend/migrations/001_multi_level_approval_system.sql
```

**Or using psql command line:**
```bash
psql -U your_username -d your_database_name -f "backend/migrations/001_multi_level_approval_system.sql"
```

### Step 2: Verify Migration Success

After running the migration, you should see these messages:
```
✅ Migration completed successfully!
✅ New role available: ManagingDirector
✅ New tables created: payroll_batches, approval_history, notifications
✅ Added batch_id to salaries table
✅ Created triggers and views
```

### Step 3: Run Verification Script

Run the verification script to confirm everything is set up:

```bash
# File location:
backend/scripts/verify-approval-system.sql
```

You should see:
- ✅ payroll_batches exists
- ✅ approval_history exists
- ✅ notifications exists
- Available roles: Admin, Employee, FinanceOfficer, HR, ManagingDirector

---

## 📊 What Was Created

### Database Tables (in hpms_core schema)
1. **payroll_batches** - Main workflow table
2. **approval_history** - Complete audit trail
3. **notifications** - User notifications

### Database Objects
- ✅ 3 new tables
- ✅ 1 new role (ManagingDirector)
- ✅ 11 indexes for performance
- ✅ 2 triggers for auto-updates
- ✅ 2 functions for calculations
- ✅ 1 view for easy querying

### Backend Code (All Updated for hpms_core)
- ✅ 3 Repositories
- ✅ 2 Services
- ✅ 2 Controllers
- ✅ 2 Route files
- ✅ 1 Constants file

---

## 🔧 Files Updated for hpms_core Schema

All these files now correctly reference `hpms_core.table_name`:

1. `backend/migrations/001_multi_level_approval_system.sql` ✅
2. `backend/src/repositories/payrollBatchRepo.js` ✅
3. `backend/src/repositories/approvalHistoryRepo.js` ✅
4. `backend/src/repositories/notificationRepo.js` ✅
5. `backend/src/services/notificationService.js` ✅

---

## 🎯 Next Steps After Migration

### 1. Restart Backend Server
```bash
cd backend
npm run dev
```

### 2. Create Test Users

Use your existing admin account to create users for each role:

**Finance Officer:**
```json
POST /api/employees
{
  "fullName": "John Finance",
  "email": "finance@hcsolutions.rw",
  "role": "FinanceOfficer",
  "temporaryPassword": "SecurePass123!"
}
```

**HR Manager:**
```json
POST /api/employees
{
  "fullName": "Jane HR",
  "email": "hr@hcsolutions.rw",
  "role": "HR",
  "temporaryPassword": "SecurePass123!"
}
```

**Managing Director:**
```json
POST /api/employees
{
  "fullName": "Bob Director",
  "email": "md@hcsolutions.rw",
  "role": "ManagingDirector",
  "temporaryPassword": "SecurePass123!"
}
```

### 3. Test the Workflow

#### A. Login as Finance Officer
```bash
POST /api/auth/login
{
  "email": "finance@hcsolutions.rw",
  "password": "SecurePass123!"
}
```

#### B. Create Some Salaries
```bash
POST /api/salaries
# Create a few salary records
```

#### C. Create a Batch
```bash
POST /api/payroll-batches
{
  "batchName": "February 2026 Payroll",
  "periodMonth": 2,
  "periodYear": 2026,
  "salaryIds": [1, 2, 3]  # IDs from step B
}
```

#### D. Login as HR → Approve
```bash
POST /api/auth/login
{
  "email": "hr@hcsolutions.rw",
  "password": "SecurePass123!"
}

GET /api/payroll-batches/pending-hr

POST /api/payroll-batches/hr-review
{
  "batchId": 1,
  "action": "APPROVE",
  "comments": "Verified and approved"
}
```

#### E. Login as MD → Final Approve
```bash
POST /api/auth/login
{
  "email": "md@hcsolutions.rw",
  "password": "SecurePass123!"
}

GET /api/payroll-batches/pending-md

POST /api/payroll-batches/md-review
{
  "batchId": 1,
  "action": "APPROVE",
  "comments": "Final approval granted"
}
```

#### F. Send to Bank
```bash
POST /api/payroll-batches/send-to-bank
{
  "batchId": 1
}
```

---

## 🔔 Notifications

After each action, check notifications:

```bash
GET /api/notifications
GET /api/notifications/unread-count
```

Each user will receive notifications when:
- Finance Officer: When HR/MD reviews their batch
- HR Manager: When new batch is submitted
- Managing Director: When HR approves (needs final approval)

---

## 🐛 Troubleshooting

### Migration Fails
**Error**: "relation already exists"
- **Solution**: Tables already created, migration is idempotent, safe to ignore

**Error**: "role already exists in enum"
- **Solution**: Role already added, safe to ignore

### Backend Won't Start
**Error**: "Cannot find module"
- **Solution**: Run `npm install` in backend directory

**Error**: "Database connection failed"
- **Solution**: Check your `.env` file database credentials

### API Returns 404
- **Solution**: Make sure backend server restarted after code changes
- **Solution**: Check routes are registered in `routes/index.js`

### No Notifications Received
- **Solution**: Check that users exist with correct roles
- **Solution**: Verify notification table has records: `SELECT * FROM hpms_core.notifications;`

---

## ✅ Checklist

Before testing:
- [ ] Migration script executed successfully
- [ ] Verification script shows all tables exist
- [ ] All 5 roles visible in employee_role enum
- [ ] Backend server restarted
- [ ] No errors in server console

For testing:
- [ ] Created Finance Officer user
- [ ] Created HR Manager user
- [ ] Created Managing Director user
- [ ] Created test salary records
- [ ] Tested complete approval workflow
- [ ] Verified notifications work
- [ ] Checked audit trail in approval_history table

---

## 📖 Documentation

Refer to these files for more details:
- `MULTI_LEVEL_APPROVAL_SYSTEM.md` - Complete technical specification
- `APPROVAL_SYSTEM_QUICK_START.md` - Quick reference guide
- `SETUP_GUIDE.md` - Detailed setup instructions
- `BUILD_PROGRESS.md` - Development progress

---

## 🎉 You're Ready!

The migration script is ready to run. Just execute it in your SQL client and you'll have the complete multi-level approval system!

**Good luck!** 🚀
