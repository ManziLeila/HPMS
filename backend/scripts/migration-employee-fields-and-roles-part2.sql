-- ============================================
-- HC Solutions Payroll - Migrate Admin to HR Role
-- ============================================
-- PART 2: Migrate existing Admin users to HR role
-- Run this AFTER Part 1 has been committed
-- ============================================

-- ============================================
-- MIGRATE EXISTING ADMIN USERS TO HR ROLE
-- ============================================
UPDATE hpms_core.employees
SET role = 'HR'::hpms_core.employee_role
WHERE role = 'Admin'::hpms_core.employee_role;

-- ============================================
-- VERIFY MIGRATION PART 2
-- ============================================
-- Check updated roles
SELECT 
    employee_id,
    full_name,
    email,
    role,
    department,
    date_of_joining
FROM hpms_core.employees
ORDER BY created_at DESC;
