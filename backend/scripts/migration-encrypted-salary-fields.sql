-- ============================================
-- HC Solutions Payroll - Add Encrypted Salary Fields Migration
-- ============================================
-- This migration adds encrypted columns to the salaries table
-- to store sensitive compensation data securely
-- ============================================

-- Add encrypted salary fields to salaries table
DO $$ 
BEGIN
    -- Add basic_salary_enc column (encrypted)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'salaries' 
        AND column_name = 'basic_salary_enc'
    ) THEN
        ALTER TABLE hpms_core.salaries ADD COLUMN basic_salary_enc TEXT;
        RAISE NOTICE 'Added basic_salary_enc column';
    ELSE
        RAISE NOTICE 'basic_salary_enc column already exists';
    END IF;
    
    -- Add transport_allow_enc column (encrypted)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'salaries' 
        AND column_name = 'transport_allow_enc'
    ) THEN
        ALTER TABLE hpms_core.salaries ADD COLUMN transport_allow_enc TEXT;
        RAISE NOTICE 'Added transport_allow_enc column';
    ELSE
        RAISE NOTICE 'transport_allow_enc column already exists';
    END IF;
    
    -- Add housing_allow_enc column (encrypted)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'salaries' 
        AND column_name = 'housing_allow_enc'
    ) THEN
        ALTER TABLE hpms_core.salaries ADD COLUMN housing_allow_enc TEXT;
        RAISE NOTICE 'Added housing_allow_enc column';
    ELSE
        RAISE NOTICE 'housing_allow_enc column already exists';
    END IF;
    
    -- Add variable_allow_enc column (encrypted)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'salaries' 
        AND column_name = 'variable_allow_enc'
    ) THEN
        ALTER TABLE hpms_core.salaries ADD COLUMN variable_allow_enc TEXT;
        RAISE NOTICE 'Added variable_allow_enc column';
    ELSE
        RAISE NOTICE 'variable_allow_enc column already exists';
    END IF;
    
    -- Add performance_allow_enc column (encrypted)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'salaries' 
        AND column_name = 'performance_allow_enc'
    ) THEN
        ALTER TABLE hpms_core.salaries ADD COLUMN performance_allow_enc TEXT;
        RAISE NOTICE 'Added performance_allow_enc column';
    ELSE
        RAISE NOTICE 'performance_allow_enc column already exists';
    END IF;
    
    -- Add net_paid_enc column (encrypted)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'salaries' 
        AND column_name = 'net_paid_enc'
    ) THEN
        ALTER TABLE hpms_core.salaries ADD COLUMN net_paid_enc TEXT;
        RAISE NOTICE 'Added net_paid_enc column';
    ELSE
        RAISE NOTICE 'net_paid_enc column already exists';
    END IF;
    
    -- Add include_medical column (boolean flag)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'salaries' 
        AND column_name = 'include_medical'
    ) THEN
        ALTER TABLE hpms_core.salaries ADD COLUMN include_medical BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added include_medical column';
    ELSE
        RAISE NOTICE 'include_medical column already exists';
    END IF;
END $$;

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'hpms_core' 
AND table_name = 'salaries'
AND column_name IN (
    'basic_salary_enc', 
    'transport_allow_enc', 
    'housing_allow_enc', 
    'variable_allow_enc', 
    'performance_allow_enc', 
    'net_paid_enc',
    'include_medical'
)
ORDER BY column_name;

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- To run this migration:
-- 1. Open pgAdmin or psql
-- 2. Connect to your hpms_core database
-- 3. Execute this entire script
-- 4. Verify the output shows all columns were added
-- 5. Restart the backend server
-- 6. Create a new salary record to test encryption
-- ============================================
