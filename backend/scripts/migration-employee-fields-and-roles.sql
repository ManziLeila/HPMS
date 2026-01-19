-- ============================================
-- HC Solutions Payroll - Add Employee Fields for Payslip
-- ============================================
-- PART 1: Add new columns
-- Run this first, then run PART 2 in a separate query
-- ============================================

DO $$ 
BEGIN
    -- Add department column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'department'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN department TEXT;
    END IF;
    
    -- Add date_of_joining column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'date_of_joining'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN date_of_joining DATE;
    END IF;
END $$;

-- ============================================
-- UPDATE EMPLOYEE ROLE ENUM
-- ============================================
-- Add HR and FinanceOfficer roles to the enum

-- First, check if the new roles already exist
DO $$ 
BEGIN
    -- Add 'HR' to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'HR' 
        AND enumtypid = (
            SELECT oid FROM pg_type 
            WHERE typname = 'employee_role' 
            AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'hpms_core')
        )
    ) THEN
        ALTER TYPE hpms_core.employee_role ADD VALUE 'HR';
    END IF;
    
    -- Add 'FinanceOfficer' to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'FinanceOfficer' 
        AND enumtypid = (
            SELECT oid FROM pg_type 
            WHERE typname = 'employee_role' 
            AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'hpms_core')
        )
    ) THEN
        ALTER TYPE hpms_core.employee_role ADD VALUE 'FinanceOfficer';
    END IF;
END $$;

-- ============================================
-- VERIFY MIGRATION PART 1
-- ============================================
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'hpms_core' 
AND table_name = 'employees'
AND column_name IN ('department', 'date_of_joining')
ORDER BY column_name;

-- Check that new roles were added
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid FROM pg_type 
    WHERE typname = 'employee_role' 
    AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'hpms_core')
)
ORDER BY enumlabel;
