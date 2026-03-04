# Quick Fix: Run This SQL Migration

## The Error
```
Failed to reset period: invalid input value for enum hpms_core.audit_action: "RESET_PERIOD"
```

## The Solution
You need to add the `RESET_PERIOD` value to the database audit_action enum.

## How to Fix

### Option 1: Using pgAdmin (Recommended)
1. Open **pgAdmin**
2. Connect to your `hpms` database
3. Click **Tools** → **Query Tool**
4. Copy and paste this SQL:

```sql
-- Add RESET_PERIOD to audit_action enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'RESET_PERIOD' 
        AND enumtypid = 'hpms_core.audit_action'::regtype
    ) THEN
        ALTER TYPE hpms_core.audit_action ADD VALUE 'RESET_PERIOD';
        RAISE NOTICE 'Added RESET_PERIOD to audit_action enum';
    ELSE
        RAISE NOTICE 'RESET_PERIOD already exists in audit_action enum';
    END IF;
END $$;
```

5. Click **Execute** (F5)
6. You should see: "Added RESET_PERIOD to audit_action enum"

### Option 2: Using Command Line
If you have PostgreSQL bin folder in your PATH:

```bash
cd "c:\Users\kezal\Desktop\hcsolutions payroll\backend"
psql -U postgres -d hpms -f "scripts\fix-audit-enum.sql"
```

### Option 3: Run the Full Migration Script
The file `backend/scripts/fix-audit-enum.sql` now includes the RESET_PERIOD enum value.

Just run it using your preferred PostgreSQL client.

## Verify It Worked
After running the SQL, try clicking the "Reset Period" button again. The error should be gone!

## What This Does
This adds "RESET_PERIOD" as a valid audit action type in the database, so when the backend tries to log the reset operation to the audit trail, it won't fail.
