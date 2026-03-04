-- ============================================
-- Make Password Hash Optional
-- ============================================
-- This script makes password_hash nullable
-- so employees can be created during bulk upload
-- without passwords. They can set passwords later
-- when they first log in or through password reset.
-- ============================================

-- Make password_hash nullable
ALTER TABLE hpms_core.employees 
ALTER COLUMN password_hash DROP NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'hpms_core' 
AND table_name = 'employees'
AND column_name = 'password_hash';

-- ============================================
-- DONE!
-- ============================================
-- password_hash is now optional.
-- Employees created via bulk upload won't have passwords
-- and will need to set them through password reset flow.
-- ============================================
