# Multi-Level Approval System - Setup & Deployment Guide

## 🎉 BUILD COMPLETE!

All backend code is now complete and ready to deploy. Here's how to set it up:

---

## Step 1: Run Database Migration

### Option A: Using psql command line
```bash
cd backend
psql -U your_postgres_user -d your_database_name -f migrations/001_multi_level_approval_system.sql
```

### Option B: Using pgAdmin or database GUI
1. Open your database tool
2. Connect to your database
3. Run the SQL file: `backend/migrations/001_multi_level_approval_system.sql`

### Verify Migration
```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payroll_batches', 'approval_history', 'notifications');

-- Check if new roles are available
SELECT DISTINCT role FROM employees;
```

---

## Step 2: Create Test Users for Each Role

### Using the API (Recommended)
```bash
# 1. Create Finance Officer
POST http://localhost:5000/api/employees
{
  "fullName": "John Finance",
  "email": "finance@hcsolutions.rw",
  "role": "FinanceOfficer",
  "temporaryPassword": "TempPass123!"
}

# 2. Create HR Manager
POST http://localhost:5000/api/employees
{
  "fullName": "Jane HR",
  "email": "hr@hcsolutions.rw",
  "role": "HR",
  "temporaryPassword": "TempPass123!"
}

# 3. Create Managing Director
POST http://localhost:5000/api/employees
{
  "fullName": "Bob Director",
  "email": "md@hcsolutions.rw",
  "role": "ManagingDirector",
  "temporaryPassword": "TempPass123!"
}
```

### Using SQL (Alternative)
```sql
-- Insert test users directly
INSERT INTO employees (full_name, email, role, password_hash, mfa_secret)
VALUES 
  ('John Finance', 'finance@test.com', 'FinanceOfficer', '$2b$10$...', 'secret1'),
  ('Jane HR', 'hr@test.com', 'HR', '$2b$10$...', 'secret2'),
  ('Bob Director', 'md@test.com', 'ManagingDirector', '$2b$10$...', 'secret3');
```

---

## Step 3: Test the Backend APIs

### Using Postman or similar tool:

#### 1. Login as Finance Officer
```bash
POST /api/auth/login
{
  "email": "finance@hcsolutions.rw",
  "password": "TempPass123!"
}
# Save the token
```

#### 2. Create a Payroll Batch
```bash
POST /api/payroll-batches
Authorization: Bearer {finance_officer_token}
{
  "batchName": "February 2026 Payroll",
  "periodMonth": 2,
  "periodYear": 2026,
  "salaryIds": [1, 2, 3, 4, 5]  # IDs of existing salary records
}
```

#### 3. Login as HR Manager
```bash
POST /api/auth/login
{
  "email": "hr@hcsolutions.rw",
  "password": "TempPass123!"
}
```

#### 4. Get Pending Approvals (HR)
```bash
GET /api/payroll-batches/pending-hr
Authorization: Bearer {hr_token}
```

#### 5. Approve as HR
```bash
POST /api/payroll-batches/hr-review
Authorization: Bearer {hr_token}
{
  "batchId": 1,
  "action": "APPROVE",
  "comments": "All calculations verified. Approved."
}
```

#### 6. Login as Managing Director
```bash
POST /api/auth/login
{
  "email": "md@hcsolutions.rw",
  "password": "TempPass123!"
}
```

#### 7. Get Pending Final Approvals (MD)
```bash
GET /api/payroll-batches/pending-md
Authorization: Bearer {md_token}
```

#### 8. Final Approve as MD
```bash
POST /api/payroll-batches/md-review
Authorization: Bearer {md_token}
{
  "batchId": 1,
  "action": "APPROVE",
  "comments": "Budget approved. Proceed to bank transfer."
}
```

#### 9. Send to Bank (Finance Officer or MD)
```bash
POST /api/payroll-batches/send-to-bank
Authorization: Bearer {finance_officer_token}
{
  "batchId": 1
}
```

#### 10. Check Notifications
```bash
GET /api/notifications
Authorization: Bearer {any_user_token}

GET /api/notifications/unread-count
Authorization: Bearer {any_user_token}
```

---

## Step 4: Restart Backend Server

```bash
cd backend
npm install  # Install any new dependencies (if needed)
npm run dev  # or npm start
```

The server should start without errors. Check the console for:
```
✓ HPMS backend listening on port 5000
```

---

## Step 5: Test Complete Workflow

### Scenario: Create and Approve Payroll

1. **Finance Officer**:
   - Creates salaries for employees
   - Groups them into a batch
   - Submits for approval
   - ✅ Gets notification when HR reviews
   - ✅ Gets notification when MD approves
   - Sends to bank after full approval

2. **HR Manager**:
   - ✅ Gets notification of new submission
   - Reviews batch details
   - Validates calculations
   - Approves or rejects with comments
   - ✅ Gets notification when sent to bank

3. **Managing Director**:
   - ✅ Gets notification when HR approves
   - Reviews financial summary
   - Gives final approval or rejects
   - ✅ Gets notification when sent to bank

---

## API Endpoints Summary

### Payroll Batches
```
POST   /api/payroll-batches              - Create batch
GET    /api/payroll-batches/my-batches   - Get my batches
GET    /api/payroll-batches/stats        - Get dashboard stats
GET    /api/payroll-batches/pending-hr   - Get pending for HR
GET    /api/payroll-batches/pending-md   - Get pending for MD
POST   /api/payroll-batches/hr-review    - HR approve/reject
POST   /api/payroll-batches/md-review    - MD approve/reject
POST   /api/payroll-batches/send-to-bank - Send to bank
GET    /api/payroll-batches/:id          - Get batch details
DELETE /api/payroll-batches/:id          - Delete batch
```

### Notifications
```
GET    /api/notifications                - Get my notifications
GET    /api/notifications/unread-count   - Get unread count
PUT    /api/notifications/:id/read       - Mark as read
PUT    /api/notifications/read-all       - Mark all as read
DELETE /api/notifications/:id            - Delete notification
```

---

## Database Tables Created

1. **payroll_batches** - Main batch table
   - Tracks approval workflow
   - Stores HR and MD reviews
   - Caches financial summaries

2. **approval_history** - Complete audit trail
   - Every action logged
   - IP address tracking
   - User agent tracking

3. **notifications** - User notifications
   - Real-time alerts
   - Read/unread status
   - Priority levels

---

## Troubleshooting

### Migration Errors
```bash
# If migration fails, check:
1. Database connection
2. User permissions
3. Existing table conflicts

# To rollback (if needed):
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS approval_history CASCADE;
DROP TABLE IF EXISTS payroll_batches CASCADE;
ALTER TABLE salaries DROP COLUMN IF EXISTS batch_id;
```

### Server Won't Start
```bash
# Check for:
1. Missing imports
2. Syntax errors in new files
3. Database connection issues

# View logs:
npm run dev
```

### API Returns 404
```bash
# Verify:
1. Routes are registered in routes/index.js
2. Server restarted after changes
3. Correct endpoint URL
```

---

## Next Steps: Frontend Development

Now that the backend is complete, you can:

1. **Create Frontend Dashboards**:
   - Finance Officer Dashboard
   - HR Manager Dashboard
   - Managing Director Dashboard

2. **Add Batch Management UI**:
   - Create batch modal
   - Batch list view
   - Batch details view
   - Approval action buttons

3. **Implement Notifications**:
   - Notification bell icon
   - Notification dropdown
   - Real-time updates (polling or WebSocket)

4. **Update Navigation**:
   - Role-based sidebar
   - Dashboard routing
   - Permission-based UI elements

---

## Production Checklist

Before deploying to production:

- [ ] Run database migration on production database
- [ ] Create real user accounts for each role
- [ ] Test complete approval workflow
- [ ] Test rejection scenarios
- [ ] Verify email notifications work
- [ ] Check audit trail logging
- [ ] Test permissions for each role
- [ ] Backup database before deployment
- [ ] Update environment variables
- [ ] Deploy backend changes
- [ ] Monitor logs for errors

---

## Support

If you encounter any issues:
1. Check the console logs
2. Verify database migration completed
3. Ensure all new files are present
4. Check API responses with Postman
5. Review the BUILD_PROGRESS.md file

**Backend is 100% complete and ready to use!** 🎉
