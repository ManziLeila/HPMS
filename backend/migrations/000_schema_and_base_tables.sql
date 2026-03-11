-- =====================================================
-- BOOTSTRAP: Schema and base tables
-- Run this FIRST on an empty database (e.g. hpms_core).
-- Safe to re-run (idempotent).
-- =====================================================

CREATE SCHEMA IF NOT EXISTS hpms_core;

-- Roles for employees (001 adds ManagingDirector; 005b adds HR/FinanceOfficer if needed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'hpms_core' AND t.typname = 'employee_role') THEN
    CREATE TYPE hpms_core.employee_role AS ENUM ('Admin', 'Employee', 'HR', 'FinanceOfficer', 'ManagingDirector');
  END IF;
END $$;

-- Audit enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'hpms_core' AND t.typname = 'audit_action') THEN
    CREATE TYPE hpms_core.audit_action AS ENUM (
      'LOGIN_REQUEST', 'MFA_CHALLENGE', 'ACCESS_GRANTED', 'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE',
      'CREATE_SALARY', 'UPDATE_SALARY', 'DOWNLOAD_PAYSLIP'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'hpms_core' AND t.typname = 'audit_action_type') THEN
    CREATE TYPE hpms_core.audit_action_type AS ENUM (
      'CONTRACT_CREATED', 'CONTRACT_UPDATED', 'CONTRACT_TERMINATED', 'CONTRACT_EXPIRY_NOTIFIED'
    );
  END IF;
END $$;

-- Base table: employees (004 adds client_id)
CREATE TABLE IF NOT EXISTS hpms_core.employees (
  employee_id                 SERIAL PRIMARY KEY,
  full_name                   VARCHAR(160) NOT NULL,
  email                       TEXT UNIQUE,
  bank_account_enc            BYTEA,
  role                        hpms_core.employee_role NOT NULL DEFAULT 'Employee',
  password_hash               TEXT,
  mfa_secret                  TEXT,
  bank_name                   TEXT,
  account_number_enc          BYTEA,
  account_holder_name         TEXT,
  phone_number                TEXT,
  department                  VARCHAR(120),
  date_of_joining             DATE,
  rssb_number                 VARCHAR(40),
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  sms_notifications_enabled   BOOLEAN DEFAULT FALSE,
  status                      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_email ON hpms_core.employees (email);

-- Base table: salaries (001 adds batch_id; 007 later adds period_id and drops batch_id)
CREATE TABLE IF NOT EXISTS hpms_core.salaries (
  salary_id             SERIAL PRIMARY KEY,
  employee_id           INTEGER NOT NULL REFERENCES hpms_core.employees(employee_id) ON DELETE CASCADE,
  pay_period            DATE NOT NULL,
  pay_frequency         VARCHAR(16) NOT NULL DEFAULT 'monthly',
  basic_salary_enc      BYTEA,
  transport_allow_enc   BYTEA,
  housing_allow_enc     BYTEA,
  variable_allow_enc    BYTEA,
  performance_allow_enc BYTEA,
  gross_salary          NUMERIC(14,2) NOT NULL DEFAULT 0,
  rssb_pension          NUMERIC(14,2) NOT NULL DEFAULT 0,
  rssb_maternity        NUMERIC(14,2) NOT NULL DEFAULT 0,
  rama_insurance        NUMERIC(14,2) NOT NULL DEFAULT 0,
  paye                  NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_paid_enc          BYTEA,
  total_employer_contrib NUMERIC(14,2) NOT NULL DEFAULT 0,
  advance_amount        NUMERIC(12,2) DEFAULT 0,
  payroll_snapshot_enc  BYTEA,
  created_by            INTEGER REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL,
  hr_status             VARCHAR(20) DEFAULT 'PENDING',
  hr_comment            TEXT,
  hr_reviewed_at        TIMESTAMPTZ,
  hr_reviewed_by        INTEGER REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, pay_period)
);

CREATE INDEX IF NOT EXISTS idx_salaries_pay_period ON hpms_core.salaries (pay_period);
CREATE INDEX IF NOT EXISTS idx_salaries_employee_period ON hpms_core.salaries (employee_id, pay_period DESC);

-- Audit trail (006 migrates user_id from employees to users)
CREATE TABLE IF NOT EXISTS hpms_core.audit_logs (
  audit_id       BIGSERIAL PRIMARY KEY,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id        INTEGER REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL,
  action_type    hpms_core.audit_action NOT NULL,
  details        JSONB NOT NULL DEFAULT '{}',
  ip_address     INET,
  user_agent     TEXT,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE INDEX IF NOT EXISTS idx_audit_action_time ON hpms_core.audit_logs (action_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_time ON hpms_core.audit_logs (user_id, timestamp DESC);

-- =====================================================
-- BOOTSTRAP COMPLETE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Bootstrap complete: schema hpms_core, employees, salaries, audit_logs';
END $$;
