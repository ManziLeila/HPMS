-- =====================================================
-- MIGRATION 006: Separate Users from Employees
-- Created: 2026-03-03
-- Purpose: Create hpms_core.users for Finance/HR/MD.
--          Keep hpms_core.employees for regular workers.
--          Remove Admin role entirely.
--
-- SAFE TO RE-RUN: the cleanup block at the top resets
-- any partial state from a previously failed run.
-- Run in psql / pgAdmin on your HPMS database.
-- =====================================================

BEGIN;

-- ─── Cleanup: reset partial state from any prior failed run ──────────────────
-- Drop users table (CASCADE removes FKs that already point to it).
-- This restores payroll_batches / approval_history FKs to their broken state,
-- which Step 5-6 below will fix properly.

DROP TABLE IF EXISTS hpms_core.users CASCADE;
DROP TYPE IF EXISTS hpms_core.user_role CASCADE;

-- Restore any dropped constraints back to employees so the migration
-- starts from a clean, known baseline every time.
DO $$
BEGIN
    -- payroll_batches.created_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payroll_batches_created_by_fkey'
          AND table_schema = 'hpms_core'
    ) THEN
        ALTER TABLE hpms_core.payroll_batches
            ADD CONSTRAINT payroll_batches_created_by_fkey
            FOREIGN KEY (created_by)
            REFERENCES hpms_core.employees(employee_id) ON DELETE RESTRICT;
    END IF;

    -- payroll_batches.hr_reviewed_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payroll_batches_hr_reviewed_by_fkey'
          AND table_schema = 'hpms_core'
    ) THEN
        ALTER TABLE hpms_core.payroll_batches
            ADD CONSTRAINT payroll_batches_hr_reviewed_by_fkey
            FOREIGN KEY (hr_reviewed_by)
            REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL;
    END IF;

    -- payroll_batches.md_reviewed_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payroll_batches_md_reviewed_by_fkey'
          AND table_schema = 'hpms_core'
    ) THEN
        ALTER TABLE hpms_core.payroll_batches
            ADD CONSTRAINT payroll_batches_md_reviewed_by_fkey
            FOREIGN KEY (md_reviewed_by)
            REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL;
    END IF;

    -- payroll_batches.sent_to_bank_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payroll_batches_sent_to_bank_by_fkey'
          AND table_schema = 'hpms_core'
    ) THEN
        ALTER TABLE hpms_core.payroll_batches
            ADD CONSTRAINT payroll_batches_sent_to_bank_by_fkey
            FOREIGN KEY (sent_to_bank_by)
            REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL;
    END IF;

    -- approval_history.action_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'approval_history_action_by_fkey'
          AND table_schema = 'hpms_core'
    ) THEN
        ALTER TABLE hpms_core.approval_history
            ADD CONSTRAINT approval_history_action_by_fkey
            FOREIGN KEY (action_by)
            REFERENCES hpms_core.employees(employee_id) ON DELETE RESTRICT;
    END IF;

    -- audit_logs.user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'audit_logs_user_id_fkey'
          AND table_schema = 'hpms_core'
    ) THEN
        ALTER TABLE hpms_core.audit_logs
            ADD CONSTRAINT audit_logs_user_id_fkey
            FOREIGN KEY (user_id)
            REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Remove user_type column from notifications if it was added by a prior run
ALTER TABLE hpms_core.notifications DROP COLUMN IF EXISTS user_type;

-- ─── Step 1: Create user_role enum ───────────────────────────────────────────

CREATE TYPE hpms_core.user_role AS ENUM ('FinanceOfficer', 'HR', 'ManagingDirector');

-- ─── Step 2: Create users table ──────────────────────────────────────────────

CREATE TABLE hpms_core.users (
    user_id       SERIAL PRIMARY KEY,
    full_name     TEXT NOT NULL,
    email         TEXT UNIQUE,
    password_hash TEXT,
    mfa_secret    TEXT,
    role          hpms_core.user_role NOT NULL,
    department    TEXT,
    status        TEXT NOT NULL DEFAULT 'ACTIVE',
    mfa_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _old_employee_id INTEGER  -- temporary; dropped at end of migration
);

-- ─── Step 3: Add user_type to notifications ──────────────────────────────────
-- Distinguishes system users (Finance/HR/MD) from regular employees
-- without a FK, since both tables use their own SERIAL sequences.

ALTER TABLE hpms_core.notifications ADD COLUMN user_type TEXT NOT NULL DEFAULT 'user';

-- Tag existing employee-welcome notifications before we migrate
UPDATE hpms_core.notifications n
SET user_type = 'employee'
WHERE EXISTS (
    SELECT 1 FROM hpms_core.employees e
    WHERE e.employee_id = n.user_id AND e.role = 'Employee'
);

-- ─── Step 4: Migrate Finance / HR / MD → users ───────────────────────────────

INSERT INTO hpms_core.users (
    full_name, email, password_hash, mfa_secret,
    role, department, status, mfa_enabled,
    created_at, updated_at, _old_employee_id
)
SELECT
    full_name,
    email,
    password_hash,
    mfa_secret,
    role::TEXT::hpms_core.user_role,
    department,
    COALESCE(status::TEXT, 'ACTIVE'),
    TRUE,
    created_at,
    updated_at,
    employee_id
FROM hpms_core.employees
WHERE role IN ('FinanceOfficer', 'HR', 'ManagingDirector');

-- ─── Step 5: Remap payroll_batches FKs → users ───────────────────────────────

ALTER TABLE hpms_core.payroll_batches DROP CONSTRAINT IF EXISTS payroll_batches_created_by_fkey;
UPDATE hpms_core.payroll_batches pb
   SET created_by = u.user_id
  FROM hpms_core.users u
 WHERE u._old_employee_id = pb.created_by;
ALTER TABLE hpms_core.payroll_batches
    ADD CONSTRAINT payroll_batches_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES hpms_core.users(user_id) ON DELETE RESTRICT;

ALTER TABLE hpms_core.payroll_batches DROP CONSTRAINT IF EXISTS payroll_batches_hr_reviewed_by_fkey;
UPDATE hpms_core.payroll_batches pb
   SET hr_reviewed_by = u.user_id
  FROM hpms_core.users u
 WHERE u._old_employee_id = pb.hr_reviewed_by;
ALTER TABLE hpms_core.payroll_batches
    ADD CONSTRAINT payroll_batches_hr_reviewed_by_fkey
    FOREIGN KEY (hr_reviewed_by) REFERENCES hpms_core.users(user_id) ON DELETE SET NULL;

ALTER TABLE hpms_core.payroll_batches DROP CONSTRAINT IF EXISTS payroll_batches_md_reviewed_by_fkey;
UPDATE hpms_core.payroll_batches pb
   SET md_reviewed_by = u.user_id
  FROM hpms_core.users u
 WHERE u._old_employee_id = pb.md_reviewed_by;
ALTER TABLE hpms_core.payroll_batches
    ADD CONSTRAINT payroll_batches_md_reviewed_by_fkey
    FOREIGN KEY (md_reviewed_by) REFERENCES hpms_core.users(user_id) ON DELETE SET NULL;

ALTER TABLE hpms_core.payroll_batches DROP CONSTRAINT IF EXISTS payroll_batches_sent_to_bank_by_fkey;
UPDATE hpms_core.payroll_batches pb
   SET sent_to_bank_by = u.user_id
  FROM hpms_core.users u
 WHERE u._old_employee_id = pb.sent_to_bank_by;
ALTER TABLE hpms_core.payroll_batches
    ADD CONSTRAINT payroll_batches_sent_to_bank_by_fkey
    FOREIGN KEY (sent_to_bank_by) REFERENCES hpms_core.users(user_id) ON DELETE SET NULL;

-- ─── Step 6: Remap approval_history FK → users ───────────────────────────────

ALTER TABLE hpms_core.approval_history DROP CONSTRAINT IF EXISTS approval_history_action_by_fkey;
UPDATE hpms_core.approval_history ah
   SET action_by = u.user_id
  FROM hpms_core.users u
 WHERE u._old_employee_id = ah.action_by;
ALTER TABLE hpms_core.approval_history
    ADD CONSTRAINT approval_history_action_by_fkey
    FOREIGN KEY (action_by) REFERENCES hpms_core.users(user_id) ON DELETE RESTRICT;

-- ─── Step 7: Remap notifications — drop old FK, update system-user rows ──────

ALTER TABLE hpms_core.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
UPDATE hpms_core.notifications n
   SET user_id = u.user_id
  FROM hpms_core.users u
 WHERE u._old_employee_id = n.user_id AND n.user_type = 'user';

-- ─── Step 8: Remap audit_logs — drop old FK, update system-user rows ─────────

ALTER TABLE hpms_core.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
UPDATE hpms_core.audit_logs al
   SET user_id = u.user_id
  FROM hpms_core.users u
 WHERE u._old_employee_id = al.user_id;

-- ─── Step 9: Drop any remaining unknown FKs pointing to employees ────────────
-- Safety net: dynamically drops every remaining FK on any table that still
-- references hpms_core.employees, preventing the DELETE in Step 11 from failing.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name, tc.table_schema, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name  = ccu.constraint_name
         AND tc.constraint_schema = ccu.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_schema   = 'hpms_core'
          AND ccu.table_name     = 'employees'
    LOOP
        RAISE NOTICE 'Dropping lingering FK % on %.%',
            r.constraint_name, r.table_schema, r.table_name;
        EXECUTE format(
            'ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
            r.table_schema, r.table_name, r.constraint_name
        );
    END LOOP;
END $$;

-- ─── Step 10: Rebuild v_batch_details view ───────────────────────────────────

DROP VIEW IF EXISTS hpms_core.v_batch_details;

CREATE VIEW hpms_core.v_batch_details AS
SELECT
    pb.*,
    creator.full_name AS created_by_name,
    creator.email     AS created_by_email,
    hr.full_name      AS hr_reviewed_by_name,
    hr.email          AS hr_reviewed_by_email,
    md.full_name      AS md_reviewed_by_name,
    md.email          AS md_reviewed_by_email,
    sender.full_name  AS sent_to_bank_by_name,
    sender.email      AS sent_to_bank_by_email
FROM hpms_core.payroll_batches pb
LEFT JOIN hpms_core.users creator ON pb.created_by      = creator.user_id
LEFT JOIN hpms_core.users hr      ON pb.hr_reviewed_by  = hr.user_id
LEFT JOIN hpms_core.users md      ON pb.md_reviewed_by  = md.user_id
LEFT JOIN hpms_core.users sender  ON pb.sent_to_bank_by = sender.user_id;

-- ─── Step 11: Remove the migration helper column ─────────────────────────────

ALTER TABLE hpms_core.users DROP COLUMN _old_employee_id;

-- ─── Step 12: Delete Admin / Finance / HR / MD from employees ────────────────

DELETE FROM hpms_core.employees
WHERE role IN ('Admin', 'FinanceOfficer', 'HR', 'ManagingDirector');

-- ─── Step 13: Rebuild employee_role enum as Employee-only ────────────────────

ALTER TABLE hpms_core.employees ALTER COLUMN role TYPE TEXT;
DROP TYPE IF EXISTS hpms_core.employee_role CASCADE;
CREATE TYPE hpms_core.employee_role AS ENUM ('Employee');
UPDATE hpms_core.employees SET role = 'Employee' WHERE role <> 'Employee';
ALTER TABLE hpms_core.employees
    ALTER COLUMN role TYPE hpms_core.employee_role
    USING role::hpms_core.employee_role;

COMMIT;

-- ─── Verification ────────────────────────────────────────────────────────────

SELECT 'users'     AS "table", COUNT(*) AS rows FROM hpms_core.users
UNION ALL
SELECT 'employees' AS "table", COUNT(*) AS rows FROM hpms_core.employees;

SELECT user_id, full_name, email, role, status FROM hpms_core.users ORDER BY role, full_name;
