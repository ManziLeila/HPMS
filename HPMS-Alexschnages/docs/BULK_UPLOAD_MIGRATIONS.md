# Bulk Upload Feature - Database Migrations Required

## Issue
The bulk upload feature is encountering database errors that need to be fixed with SQL migrations.

---

## Migration 1: Add Bulk Upload Audit Actions ✅

**File**: `backend/scripts/add-bulk-upload-audit-actions.sql`

**Error Fixed**: 
```
invalid input value for enum hpms_core.audit_action: "BULK_UPLOAD_SALARIES"
```

**What it does**:
- Adds `BULK_UPLOAD_SALARIES` to the audit_action enum
- Adds `BULK_SEND_PAYSLIP_EMAILS` to the audit_action enum

**SQL to run**:
```sql
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'BULK_UPLOAD_SALARIES' 
        AND enumtypid = 'hpms_core.audit_action'::regtype
    ) THEN
        ALTER TYPE hpms_core.audit_action ADD VALUE 'BULK_UPLOAD_SALARIES';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'BULK_SEND_PAYSLIP_EMAILS' 
        AND enumtypid = 'hpms_core.audit_action'::regtype
    ) THEN
        ALTER TYPE hpms_core.audit_action ADD VALUE 'BULK_SEND_PAYSLIP_EMAILS';
    END IF;
END $$;
```

---

## Migration 2: Make Bank Fields Optional ✅

**File**: `backend/scripts/make-bank-fields-optional.sql`

**Error Fixed**: 
```
null value in column "bank_account_enc" of relation "employees" violates not-null constraint
```

**What it does**:
- Makes `bank_account_enc` field nullable
- Makes `account_number_enc` field nullable (if it exists)
- Allows employees to be created without bank details during bulk upload
- Bank details can be added later through the employee form

**SQL to run**:
```sql
ALTER TABLE hpms_core.employees 
ALTER COLUMN bank_account_enc DROP NOT NULL;

-- If account_number_enc exists and is not null
ALTER TABLE hpms_core.employees 
ALTER COLUMN account_number_enc DROP NOT NULL;
```

---

## Migration 3: Make Password Optional ⚠️ NEEDS TO BE RUN

**File**: `backend/scripts/make-password-optional.sql`

**Error to Fix**: 
```
null value in column "password_hash" of relation "employees" violates not-null constraint
```

**What it does**:
- Makes `password_hash` field nullable
- Allows employees to be created without passwords during bulk upload
- Employees can set passwords later through password reset flow or when first logging in

**SQL to run**:
```sql
ALTER TABLE hpms_core.employees 
ALTER COLUMN password_hash DROP NOT NULL;
```

---

## How to Run These Migrations

### Option 1: Using pgAdmin (Recommended)
1. Open **pgAdmin**
2. Connect to your PostgreSQL server
3. Navigate to **hpms_db** database
4. Right-click on **hpms_db** → **Query Tool**
5. Open each migration file and execute it
   - First: `add-bulk-upload-audit-actions.sql`
   - Second: `make-bank-fields-optional.sql`
   - Third: `make-password-optional.sql`

### Option 2: Using Command Line
```bash
cd backend

# Migration 1
psql -U postgres -d hpms_db -f scripts/add-bulk-upload-audit-actions.sql

# Migration 2
psql -U postgres -d hpms_db -f scripts/make-bank-fields-optional.sql

# Migration 3
psql -U postgres -d hpms_db -f scripts/make-password-optional.sql
```

### Option 3: Using Database GUI (DBeaver, DataGrip, etc.)
1. Connect to `hpms_db`
2. Open SQL editor
3. Copy and paste the SQL from each migration file
4. Execute

---

## After Running Migrations

Once all three migrations are complete, the bulk upload feature will work correctly:

✅ **Upload Excel files** with employee salary data
✅ **Create new employees** automatically (without passwords or bank details)
✅ **Process multiple salaries** at once
✅ **Download payslips** as ZIP
✅ **Send emails** to all employees

**Note**: Employees created via bulk upload will need to:
- Set their password through password reset flow
- Add bank details through the employee form (for future payroll)

---

## Testing the Bulk Upload

1. Navigate to **Bulk Upload** page
2. Download the template
3. Fill in employee data:
   - Full Name (required)
   - Email (required)
   - Basic Salary (required)
   - Allowances (optional)
4. Upload the file
5. Check the results

---

## Status

- ✅ Migration 1: **COMPLETED** (audit actions added)
- ✅ Migration 2: **COMPLETED** (bank fields made optional)
- ⚠️ Migration 3: **PENDING** (needs to be run to fix password error)

**Next Step**: Run Migration 3 to make password field optional!
