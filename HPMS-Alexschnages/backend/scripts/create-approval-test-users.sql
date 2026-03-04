-- ============================================
-- MULTI-LEVEL APPROVAL SYSTEM - TEST USERS
-- ============================================
-- Creates test users for all roles in the approval system
-- Password for all users: Admin123!
-- ============================================

-- ============================================
-- EXISTING ADMIN CREDENTIALS
-- ============================================
-- Email: sysadmin@hcsolutions.com
-- Password: Admin123!
-- Role: Admin
--
-- Email: admin@hcsolutions.com
-- Password: Admin123!
-- Role: Admin
-- ============================================

-- ============================================
-- CREATE TEST USERS FOR APPROVAL SYSTEM
-- ============================================

-- 1. Finance Officer
INSERT INTO hpms_core.employees (
    full_name,
    email,
    bank_account_enc,
    role,
    password_hash,
    mfa_secret,
    department,
    created_at,
    updated_at
) VALUES (
    'John Finance',
    'finance@hcsolutions.com',
    E'\\x50454e44494e47'::bytea, -- 'PENDING' as placeholder
    'FinanceOfficer'::hpms_core.employee_role,
    '$2b$12$LbaMLdRYF5OeyYmLJ60DyupEZw/K71iqh9hsuOMCE6hIpv8kvS/I2', -- Password: Admin123!
    'PLACEHOLDER_MFA_SECRET_DISABLED',
    'Finance Department',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 2. HR Manager
INSERT INTO hpms_core.employees (
    full_name,
    email,
    bank_account_enc,
    role,
    password_hash,
    mfa_secret,
    department,
    created_at,
    updated_at
) VALUES (
    'Jane HR',
    'hr@hcsolutions.com',
    E'\\x50454e44494e47'::bytea, -- 'PENDING' as placeholder
    'HR'::hpms_core.employee_role,
    '$2b$12$LbaMLdRYF5OeyYmLJ60DyupEZw/K71iqh9hsuOMCE6hIpv8kvS/I2', -- Password: Admin123!
    'PLACEHOLDER_MFA_SECRET_DISABLED',
    'Human Resources',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 3. Managing Director
INSERT INTO hpms_core.employees (
    full_name,
    email,
    bank_account_enc,
    role,
    password_hash,
    mfa_secret,
    department,
    created_at,
    updated_at
) VALUES (
    'Bob Director',
    'md@hcsolutions.com',
    E'\\x50454e44494e47'::bytea, -- 'PENDING' as placeholder
    'ManagingDirector'::hpms_core.employee_role,
    '$2b$12$LbaMLdRYF5OeyYmLJ60DyupEZw/K71iqh9hsuOMCE6hIpv8kvS/I2', -- Password: Admin123!
    'PLACEHOLDER_MFA_SECRET_DISABLED',
    'Executive Office',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 4. Regular Employee (for testing payslips)
INSERT INTO hpms_core.employees (
    full_name,
    email,
    bank_account_enc,
    role,
    password_hash,
    mfa_secret,
    department,
    created_at,
    updated_at
) VALUES (
    'Alice Employee',
    'employee@hcsolutions.com',
    E'\\x50454e44494e47'::bytea, -- 'PENDING' as placeholder
    'Employee'::hpms_core.employee_role,
    '$2b$12$LbaMLdRYF5OeyYmLJ60DyupEZw/K71iqh9hsuOMCE6hIpv8kvS/I2', -- Password: Admin123!
    'PLACEHOLDER_MFA_SECRET_DISABLED',
    'Operations',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = NOW();

-- ============================================
-- VERIFY ALL USERS
-- ============================================
SELECT 
    employee_id,
    full_name,
    email,
    role,
    department,
    created_at
FROM hpms_core.employees
WHERE email IN (
    'sysadmin@hcsolutions.com',
    'admin@hcsolutions.com',
    'finance@hcsolutions.com',
    'hr@hcsolutions.com',
    'md@hcsolutions.com',
    'employee@hcsolutions.com'
)
ORDER BY 
    CASE role
        WHEN 'Admin' THEN 1
        WHEN 'ManagingDirector' THEN 2
        WHEN 'HR' THEN 3
        WHEN 'FinanceOfficer' THEN 4
        WHEN 'Employee' THEN 5
    END;

-- ============================================
-- TEST CREDENTIALS SUMMARY
-- ============================================
-- All users have the same password: Admin123!
--
-- ADMIN USERS:
-- 1. sysadmin@hcsolutions.com (System Administrator)
-- 2. admin@hcsolutions.com (Administrator)
--
-- APPROVAL WORKFLOW USERS:
-- 3. finance@hcsolutions.com (Finance Officer - John Finance)
-- 4. hr@hcsolutions.com (HR Manager - Jane HR)
-- 5. md@hcsolutions.com (Managing Director - Bob Director)
--
-- REGULAR USER:
-- 6. employee@hcsolutions.com (Employee - Alice Employee)
--
-- Note: MFA is currently disabled
-- You can log in with just email + password
-- ============================================

-- ============================================
-- WORKFLOW TEST SCENARIO
-- ============================================
-- 1. Login as: finance@hcsolutions.com
--    - Create salaries for employees
--    - Create a payroll batch
--    - Submit for approval
--
-- 2. Login as: hr@hcsolutions.com
--    - View pending approvals
--    - Review batch details
--    - Approve or reject
--
-- 3. Login as: md@hcsolutions.com
--    - View HR-approved batches
--    - Review financial summary
--    - Give final approval
--
-- 4. Login as: finance@hcsolutions.com
--    - View approved batch
--    - Send to bank
-- ============================================
