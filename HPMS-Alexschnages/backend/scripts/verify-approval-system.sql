-- Quick script to update all table references to use hpms_core schema
-- Run this in your SQL client to verify the schema structure

-- 1. Check current schema
SELECT current_schema();

-- 2. List all tables in hpms_core schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'hpms_core'
ORDER BY table_name;

-- 3. Check if the new tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hpms_core' AND table_name = 'payroll_batches') 
        THEN '✅ payroll_batches exists'
        ELSE '❌ payroll_batches missing'
    END as payroll_batches_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hpms_core' AND table_name = 'approval_history') 
        THEN '✅ approval_history exists'
        ELSE '❌ approval_history missing'
    END as approval_history_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hpms_core' AND table_name = 'notifications') 
        THEN '✅ notifications exists'
        ELSE '❌ notifications missing'
    END as notifications_status;

-- 4. Check available roles
SELECT enumlabel as available_roles
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid FROM pg_type 
    WHERE typname = 'employee_role' 
    AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'hpms_core')
)
ORDER BY enumlabel;
