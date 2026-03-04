-- =====================================================
-- RESET ALL DATA - Fresh Start
-- =====================================================
-- Deletes all employees, salaries, payroll periods,
-- contracts, and related data. Keeps users (login) and clients.
-- Stats will start from zero.
--
-- Run in psql or pgAdmin:
--   \i backend/scripts/reset-all-data.sql
-- Or: psql -d your_database -f backend/scripts/reset-all-data.sql
-- =====================================================

BEGIN;

-- 1. Approval history (references payroll_periods)
DELETE FROM hpms_core.approval_history;

-- 2. Unlink salaries from periods, then delete salaries
UPDATE hpms_core.salaries SET period_id = NULL WHERE period_id IS NOT NULL;
DELETE FROM hpms_core.salaries;

-- 3. Payroll periods
DELETE FROM hpms_core.payroll_periods;

-- 4. Employee contracts (references employees)
DELETE FROM hpms_core.contracts;

-- 5. Client contracts
DELETE FROM hpms_core.client_contracts;

-- 6. Notifications (may reference employees via user_id + user_type)
DELETE FROM hpms_core.notifications WHERE user_type = 'employee';

-- 7. Audit logs (optional - clears history; user_id can reference employees)
DELETE FROM hpms_core.audit_logs;

-- 8. Employees (regular workers only - users are separate)
DELETE FROM hpms_core.employees;

-- 9. Reset sequences so new IDs start from 1 (ignore if sequence names differ)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT quote_ident(sequence_schema) || '.' || quote_ident(sequence_name) AS seq
        FROM information_schema.sequences
        WHERE sequence_schema = 'hpms_core'
          AND sequence_name IN (
            'employees_employee_id_seq', 'salaries_salary_id_seq',
            'payroll_periods_period_id_seq', 'contracts_contract_id_seq',
            'client_contracts_contract_id_seq', 'approval_history_history_id_seq',
            'notifications_notification_id_seq', 'audit_logs_audit_id_seq'
          )
    ) LOOP
        EXECUTE format('ALTER SEQUENCE %s RESTART WITH 1', r.seq);
        RAISE NOTICE 'Reset sequence %', r.seq;
    END LOOP;
END $$;

COMMIT;

-- Verify
SELECT 'employees' AS tbl, COUNT(*) AS cnt FROM hpms_core.employees
UNION ALL SELECT 'salaries', COUNT(*) FROM hpms_core.salaries
UNION ALL SELECT 'payroll_periods', COUNT(*) FROM hpms_core.payroll_periods
UNION ALL SELECT 'contracts', COUNT(*) FROM hpms_core.contracts
UNION ALL SELECT 'client_contracts', COUNT(*) FROM hpms_core.client_contracts
UNION ALL SELECT 'users (kept)', COUNT(*) FROM hpms_core.users
UNION ALL SELECT 'clients (kept)', COUNT(*) FROM hpms_core.clients;
