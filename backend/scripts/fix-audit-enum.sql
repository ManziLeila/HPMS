-- ============================================
-- Fix Audit Action Enum - Add Missing Values
-- ============================================
-- This script adds missing audit action enum values
-- for employee management operations
-- ============================================

-- Add UPDATE_EMPLOYEE to audit_action enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'UPDATE_EMPLOYEE' 
        AND enumtypid = 'hpms_core.audit_action'::regtype
    ) THEN
        ALTER TYPE hpms_core.audit_action ADD VALUE 'UPDATE_EMPLOYEE';
        RAISE NOTICE 'Added UPDATE_EMPLOYEE to audit_action enum';
    ELSE
        RAISE NOTICE 'UPDATE_EMPLOYEE already exists in audit_action enum';
    END IF;
END $$;

-- Add DELETE_EMPLOYEE to audit_action enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DELETE_EMPLOYEE' 
        AND enumtypid = 'hpms_core.audit_action'::regtype
    ) THEN
        ALTER TYPE hpms_core.audit_action ADD VALUE 'DELETE_EMPLOYEE';
        RAISE NOTICE 'Added DELETE_EMPLOYEE to audit_action enum';
    ELSE
        RAISE NOTICE 'DELETE_EMPLOYEE already exists in audit_action enum';
    END IF;
END $$;

-- Add RESET_PERIOD to audit_action enum if it doesn't exist
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

-- Verify the enum values
SELECT enumlabel as audit_actions
FROM pg_enum
WHERE enumtypid = 'hpms_core.audit_action'::regtype
ORDER BY enumsortorder;

-- ============================================
-- DONE!
-- ============================================
-- The audit_action enum now includes:
-- - UPDATE_EMPLOYEE
-- - DELETE_EMPLOYEE
-- - RESET_PERIOD
-- 
-- You can now update, delete employees, and reset periods without errors!
-- ============================================
