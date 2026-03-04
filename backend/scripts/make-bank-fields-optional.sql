-- ============================================
-- Make Bank Account Fields Optional
-- ============================================
-- This script makes bank account fields nullable
-- so employees can be created without bank details
-- and updated later
-- ============================================

-- Make bank_account_enc nullable
ALTER TABLE hpms_core.employees 
ALTER COLUMN bank_account_enc DROP NOT NULL;

-- Make account_number_enc nullable (if it exists and is not null)
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
AND column_name IN ('bank_account_enc', 'account_number_enc', 'bank_name', 'account_holder_name')
ORDER BY column_name;

-- ============================================
-- DONE!
-- ============================================
-- Bank account fields are now optional.
-- Employees can be created without bank details
-- and bank information can be added later.
-- ============================================
