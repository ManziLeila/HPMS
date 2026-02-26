-- ============================================
-- Add Bulk Upload Audit Actions
-- ============================================
-- This script adds audit action enum values
-- for bulk salary upload operations
-- ============================================

-- Add BULK_UPLOAD_SALARIES to audit_action enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'BULK_UPLOAD_SALARIES' 
        AND enumtypid = 'hpms_core.audit_action'::regtype
    ) THEN
        ALTER TYPE hpms_core.audit_action ADD VALUE 'BULK_UPLOAD_SALARIES';
        RAISE NOTICE 'Added BULK_UPLOAD_SALARIES to audit_action enum';
    ELSE
        RAISE NOTICE 'BULK_UPLOAD_SALARIES already exists in audit_action enum';
    END IF;
END $$;

-- Add BULK_SEND_PAYSLIP_EMAILS to audit_action enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'BULK_SEND_PAYSLIP_EMAILS' 
        AND enumtypid = 'hpms_core.audit_action'::regtype
    ) THEN
        ALTER TYPE hpms_core.audit_action ADD VALUE 'BULK_SEND_PAYSLIP_EMAILS';
        RAISE NOTICE 'Added BULK_SEND_PAYSLIP_EMAILS to audit_action enum';
    ELSE
        RAISE NOTICE 'BULK_SEND_PAYSLIP_EMAILS already exists in audit_action enum';
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
-- - BULK_UPLOAD_SALARIES
-- - BULK_SEND_PAYSLIP_EMAILS
-- 
-- You can now use bulk upload features without errors!
-- ============================================
