-- ============================================
-- Make All Optional Employee Fields Nullable
-- ============================================
-- This script makes all non-essential employee fields nullable
-- so employees can be created during bulk upload with minimal data
-- and complete their profiles later.
-- ============================================

-- Make password_hash nullable
ALTER TABLE hpms_core.employees 
ALTER COLUMN password_hash DROP NOT NULL;

-- Make mfa_secret nullable
ALTER TABLE hpms_core.employees 
ALTER COLUMN mfa_secret DROP NOT NULL;

-- Make bank_account_enc nullable (if not already done)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'bank_account_enc'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE hpms_core.employees 
        ALTER COLUMN bank_account_enc DROP NOT NULL;
        RAISE NOTICE 'Made bank_account_enc nullable';
    END IF;
END $$;

-- Make account_number_enc nullable (if exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'account_number_enc'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE hpms_core.employees 
        ALTER COLUMN account_number_enc DROP NOT NULL;
        RAISE NOTICE 'Made account_number_enc nullable';
    END IF;
END $$;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'hpms_core' 
AND table_name = 'employees'
AND column_name IN (
    'password_hash', 
    'mfa_secret', 
    'bank_account_enc', 
    'account_number_enc', 
    'bank_name', 
    'account_holder_name'
)
ORDER BY column_name;

-- ============================================
-- DONE!
-- ============================================
-- All optional fields are now nullable.
-- Employees can be created via bulk upload with just:
-- - full_name
-- - email
-- - role
--
-- They can complete their profile later with:
-- - Password (via password reset)
-- - Bank details (via employee form)
-- - MFA setup (when they first log in)
-- ============================================
