# 🔐 TEST CREDENTIALS - Multi-Level Approval System

## All Users Password: `Admin123!`

---

## 👤 ADMIN USERS (Existing)

### 1. System Administrator
- **Email**: `sysadmin@hcsolutions.com`
- **Password**: `Admin123!`
- **Role**: Admin
- **Can do**: Everything

### 2. Administrator
- **Email**: `admin@hcsolutions.com`
- **Password**: `Admin123!`
- **Role**: Admin
- **Can do**: Everything

---

## 👥 APPROVAL WORKFLOW USERS (New)

### 3. Finance Officer
- **Email**: `finance@hcsolutions.com`
- **Password**: `Admin123!`
- **Role**: FinanceOfficer
- **Name**: John Finance
- **Department**: Finance Department

**Responsibilities**:
- ✅ Create employee salaries
- ✅ Create payroll batches
- ✅ Submit batches for approval
- ✅ Send approved batches to bank
- ❌ Cannot approve batches

---

### 4. HR Manager
- **Email**: `hr@hcsolutions.com`
- **Password**: `Admin123!`
- **Role**: HR
- **Name**: Jane HR
- **Department**: Human Resources

**Responsibilities**:
- ✅ Review pending payroll batches
- ✅ Approve or reject batches
- ✅ Add review comments
- ✅ Validate salary calculations
- ❌ Cannot create salaries
- ❌ Cannot send to bank

---

### 5. Managing Director
- **Email**: `md@hcsolutions.com`
- **Password**: `Admin123!`
- **Role**: ManagingDirector
- **Name**: Bob Director
- **Department**: Executive Office

**Responsibilities**:
- ✅ Review HR-approved batches
- ✅ Give final approval or reject
- ✅ View financial summaries
- ✅ Authorize bank transfers
- ❌ Cannot create or edit salaries

---

### 6. Regular Employee
- **Email**: `employee@hcsolutions.com`
- **Password**: `Admin123!`
- **Role**: Employee
- **Name**: Alice Employee
- **Department**: Operations

**Responsibilities**:
- ✅ View own payslips
- ❌ Cannot access payroll management

---

## 🚀 Quick Login Test

### Test the Approval Workflow:

#### Step 1: Finance Officer Creates Batch
```bash
POST /api/auth/login
{
  "email": "finance@hcsolutions.com",
  "password": "Admin123!"
}

# Then create a batch
POST /api/payroll-batches
{
  "batchName": "February 2026 Payroll",
  "periodMonth": 2,
  "periodYear": 2026,
  "salaryIds": [1, 2, 3]
}
```

#### Step 2: HR Manager Reviews
```bash
POST /api/auth/login
{
  "email": "hr@hcsolutions.com",
  "password": "Admin123!"
}

# View pending
GET /api/payroll-batches/pending-hr

# Approve
POST /api/payroll-batches/hr-review
{
  "batchId": 1,
  "action": "APPROVE",
  "comments": "All calculations verified"
}
```

#### Step 3: Managing Director Approves
```bash
POST /api/auth/login
{
  "email": "md@hcsolutions.com",
  "password": "Admin123!"
}

# View pending
GET /api/payroll-batches/pending-md

# Final approve
POST /api/payroll-batches/md-review
{
  "batchId": 1,
  "action": "APPROVE",
  "comments": "Budget approved"
}
```

#### Step 4: Finance Officer Sends to Bank
```bash
POST /api/auth/login
{
  "email": "finance@hcsolutions.com",
  "password": "Admin123!"
}

# Send to bank
POST /api/payroll-batches/send-to-bank
{
  "batchId": 1
}
```

---

## 📝 How to Create These Users

### Option 1: Run SQL Script (Recommended)
```bash
# File: backend/scripts/create-approval-test-users.sql
# Run this in your SQL client (pgAdmin, DBeaver, or psql)
```

### Option 2: Use API (After migration)
```bash
# Login as admin first
POST /api/auth/login
{
  "email": "admin@hcsolutions.com",
  "password": "Admin123!"
}

# Then create each user via API
POST /api/employees
{
  "fullName": "John Finance",
  "email": "finance@hcsolutions.com",
  "role": "FinanceOfficer",
  "temporaryPassword": "Admin123!"
}
```

---

## 🔔 Notifications

Each user will receive notifications:

**Finance Officer** gets notified when:
- HR reviews their batch (approve/reject)
- MD gives final approval (approve/reject)
- Batch is sent to bank

**HR Manager** gets notified when:
- New batch is submitted
- Batch is sent to bank

**Managing Director** gets notified when:
- HR approves a batch (needs final approval)
- Batch is sent to bank

---

## ⚠️ Important Notes

1. **Password**: All test users use `Admin123!` - **CHANGE IN PRODUCTION!**
2. **MFA**: Currently disabled for testing
3. **Emails**: Use @hcsolutions.com domain
4. **Roles**: Make sure migration ran successfully before creating users

---

## 🔒 Security Reminder

**These are TEST credentials!**

Before going to production:
- [ ] Change all passwords
- [ ] Enable MFA for all users
- [ ] Use real email addresses
- [ ] Set up proper email notifications
- [ ] Review user permissions

---

## ✅ Verification

After creating users, verify with:

```sql
SELECT 
    employee_id,
    full_name,
    email,
    role,
    department
FROM hpms_core.employees
WHERE role IN ('FinanceOfficer', 'HR', 'ManagingDirector')
ORDER BY role;
```

You should see:
- ✅ finance@hcsolutions.com (FinanceOfficer)
- ✅ hr@hcsolutions.com (HR)
- ✅ md@hcsolutions.com (ManagingDirector)

---

**Ready to test the approval workflow!** 🎉
