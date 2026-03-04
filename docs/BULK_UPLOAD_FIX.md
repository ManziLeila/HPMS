# Bulk Upload - Final Migration Fix

## The Problem
Bulk upload is failing because several employee fields are marked as NOT NULL in the database, but we don't have that data during bulk upload.

## The Solution
Run this **ONE** comprehensive migration that makes all optional fields nullable.

---

## 🚀 Quick Fix - Run This SQL:

```sql
-- Make password_hash nullable
ALTER TABLE hpms_core.employees 
ALTER COLUMN password_hash DROP NOT NULL;

-- Make mfa_secret nullable
ALTER TABLE hpms_core.employees 
ALTER COLUMN mfa_secret DROP NOT NULL;

-- Make bank_account_enc nullable
ALTER TABLE hpms_core.employees 
ALTER COLUMN bank_account_enc DROP NOT NULL;
```

---

## Or Use the Migration File

**File**: `backend/scripts/make-employee-fields-optional.sql`

This file includes all the fixes above plus additional safety checks.

### How to Run:

**Option 1: pgAdmin**
1. Open pgAdmin
2. Connect to `hpms_db`
3. Right-click → Query Tool
4. Copy and paste the SQL above
5. Execute (F5)

**Option 2: Database GUI**
1. Open your database tool (DBeaver, DataGrip, etc.)
2. Connect to `hpms_db`
3. Open SQL editor
4. Paste the SQL above
5. Run it

---

## What This Does

Makes these fields **optional** (nullable):
- ✅ `password_hash` - Employees set password later via reset flow
- ✅ `mfa_secret` - MFA setup when they first log in
- ✅ `bank_account_enc` - Bank details added via employee form
- ✅ `account_number_enc` - Bank details added via employee form

## After Running This

Bulk upload will work! Employees will be created with:
- ✅ Full Name (from Excel)
- ✅ Email (from Excel)
- ✅ Role = "Employee"
- ❌ No password (set later)
- ❌ No MFA (set later)
- ❌ No bank details (add later)

Then salary records are created and you can:
- ✅ Download all payslips as ZIP
- ✅ Send emails to all employees
- ✅ View reports

---

## Status

**Previous Migrations:**
- ✅ Audit actions added
- ✅ Bank fields attempted (partial)
- ✅ Password field attempted (partial)

**This Migration:**
- ⚠️ **COMPREHENSIVE FIX** - Makes all optional fields nullable in one go

**Run the SQL above and bulk upload will work!** 🎉
