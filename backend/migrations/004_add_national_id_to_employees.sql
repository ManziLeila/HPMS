-- =====================================================
-- ADD NATIONAL ID TO EMPLOYEES
-- Created: 2026-02-27
-- Purpose: Add national ID number field for employees
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core'
        AND table_name = 'employees' 
        AND column_name = 'national_id'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN national_id VARCHAR(50);
        RAISE NOTICE 'Added national_id column to employees table';
    ELSE
        RAISE NOTICE 'national_id column already exists in employees table';
    END IF;
END $$;
