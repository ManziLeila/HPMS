-- ============================================
-- Make Employee Email Optional
-- ============================================
-- Not all employees have email addresses.
-- Those without email simply won't receive
-- payslip emails or welcome emails.
-- ============================================

-- 1. Make email column nullable
ALTER TABLE hpms_core.employees
ALTER COLUMN email DROP NOT NULL;

-- 2. Drop the existing unique constraint on email (if it exists)
--    and recreate it as a partial unique index that ignores NULLs.
--    This allows multiple employees to have NULL email,
--    but still prevents duplicate non-NULL emails.
DO $$
BEGIN
    -- Drop existing unique constraint (try common constraint names)
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'employees_email_key'
        AND conrelid = 'hpms_core.employees'::regclass
    ) THEN
        ALTER TABLE hpms_core.employees DROP CONSTRAINT employees_email_key;
        RAISE NOTICE 'Dropped constraint employees_email_key';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'employees_email_unique'
        AND conrelid = 'hpms_core.employees'::regclass
    ) THEN
        ALTER TABLE hpms_core.employees DROP CONSTRAINT employees_email_unique;
        RAISE NOTICE 'Dropped constraint employees_email_unique';
    END IF;
END $$;

-- Also drop any unique index on email
DROP INDEX IF EXISTS hpms_core.employees_email_key;
DROP INDEX IF EXISTS hpms_core.employees_email_unique;
DROP INDEX IF EXISTS hpms_core.idx_employees_email_unique;

-- 3. Create partial unique index (only for non-NULL emails)
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_unique
ON hpms_core.employees (email)
WHERE email IS NOT NULL;

-- Verify
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'hpms_core'
AND table_name = 'employees'
AND column_name = 'email';

-- ============================================
-- DONE!
-- ============================================
-- Email is now optional. Employees without email:
-- - Won't receive welcome emails
-- - Won't receive payslip emails
-- - Can still be created and managed normally
-- ============================================
