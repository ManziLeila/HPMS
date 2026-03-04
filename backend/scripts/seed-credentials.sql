-- ============================================
-- HC Solutions Payroll - Seed Admin Credentials
-- ============================================
-- Run this in pgAdmin Query Tool or psql
-- Make sure you're connected to the correct database
-- ============================================

-- First, ensure the schema exists
CREATE SCHEMA IF NOT EXISTS hpms_core;

-- Create employee_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE hpms_core.employee_role AS ENUM ('Admin', 'Employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ENSURE TABLE HAS REQUIRED COLUMNS
-- ============================================
-- Add password_hash and mfa_secret columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN password_hash TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'mfa_secret'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN mfa_secret TEXT;
    END IF;
END $$;

-- ============================================
-- INSERT ADMIN USERS
-- ============================================
-- Password: "Admin123!" (bcrypt hash with 12 rounds)
-- These are test credentials - change them in production!

-- Admin 1: sysadmin@hcsolutions.com
INSERT INTO hpms_core.employees (
    full_name,
    email,
    bank_account_enc,
    role,
    password_hash,
    mfa_secret,
    created_at,
    updated_at
) VALUES (
    'System Administrator',
    'sysadmin@hcsolutions.com',
    E'\\x50454e44494e47'::bytea, -- 'PENDING' as placeholder
    'Admin'::hpms_core.employee_role,
    '$2b$12$LbaMLdRYF5OeyYmLJ60DyupEZw/K71iqh9hsuOMCE6hIpv8kvS/I2', -- Password: Admin123!
    'PLACEHOLDER_MFA_SECRET_DISABLED',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- Admin 2: admin@hcsolutions.com
INSERT INTO hpms_core.employees (
    full_name,
    email,
    bank_account_enc,
    role,
    password_hash,
    mfa_secret,
    created_at,
    updated_at
) VALUES (
    'Administrator',
    'admin@hcsolutions.com',
    E'\\x50454e44494e47'::bytea, -- 'PENDING' as placeholder
    'Admin'::hpms_core.employee_role,
    '$2b$12$LbaMLdRYF5OeyYmLJ60DyupEZw/K71iqh9hsuOMCE6hIpv8kvS/I2', -- Password: Admin123!
    'PLACEHOLDER_MFA_SECRET_DISABLED',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- ============================================
-- VERIFY INSERTED USERS
-- ============================================
SELECT 
    employee_id,
    full_name,
    email,
    role,
    created_at
FROM hpms_core.employees
WHERE role = 'Admin'
ORDER BY created_at DESC;

-- ============================================
-- TEST CREDENTIALS SUMMARY
-- ============================================
-- Email: sysadmin@hcsolutions.com
-- Password: Admin123!
--
-- Email: admin@hcsolutions.com  
-- Password: Admin123!
--
-- Note: MFA is currently disabled in the backend
-- You can log in with just email + password

