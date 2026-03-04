-- ============================================================
-- Migration: Contract Management System
-- Run this in pgAdmin / psql against hpms_core
-- ============================================================

-- 1. Contracts table
CREATE TABLE IF NOT EXISTS hpms_core.contracts (
    contract_id       SERIAL PRIMARY KEY,
    employee_id       INTEGER NOT NULL REFERENCES hpms_core.employees(employee_id) ON DELETE CASCADE,
    contract_type     VARCHAR(50)  NOT NULL DEFAULT 'fixed-term',
    -- fixed-term | permanent | internship | probation | part-time
    job_title         VARCHAR(120) NOT NULL,
    department        VARCHAR(120),
    start_date        DATE NOT NULL,
    end_date          DATE,          -- NULL for permanent contracts
    salary_grade      VARCHAR(40),
    gross_salary      NUMERIC(14,2) DEFAULT 0,
    status            VARCHAR(20)  NOT NULL DEFAULT 'active',
    -- active | expired | terminated | renewed
    notes             TEXT,
    created_by        INTEGER REFERENCES hpms_core.employees(employee_id),
    notified_30days   BOOLEAN DEFAULT FALSE,
    notified_14days   BOOLEAN DEFAULT FALSE,
    notified_7days    BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index for fast expiry queries
CREATE INDEX IF NOT EXISTS idx_contracts_end_date   ON hpms_core.contracts(end_date)   WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_contracts_employee   ON hpms_core.contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status     ON hpms_core.contracts(status);

-- 3. Auto-update updated_at
CREATE OR REPLACE FUNCTION hpms_core.update_contracts_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON hpms_core.contracts;
CREATE TRIGGER trg_contracts_updated_at
    BEFORE UPDATE ON hpms_core.contracts
    FOR EACH ROW EXECUTE FUNCTION hpms_core.update_contracts_timestamp();

-- 4. Auto-expire contracts whose end_date has passed
CREATE OR REPLACE FUNCTION hpms_core.expire_old_contracts()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE hpms_core.contracts
  SET status = 'expired'
  WHERE status = 'active' AND end_date < CURRENT_DATE;
END;
$$;

-- 5. Add new audit action types for contracts
DO $$
BEGIN
  -- Extend the enum if it exists (adjust name if yours differs)
  BEGIN
    ALTER TYPE hpms_core.audit_action_type ADD VALUE IF NOT EXISTS 'CONTRACT_CREATED';
    ALTER TYPE hpms_core.audit_action_type ADD VALUE IF NOT EXISTS 'CONTRACT_UPDATED';
    ALTER TYPE hpms_core.audit_action_type ADD VALUE IF NOT EXISTS 'CONTRACT_TERMINATED';
    ALTER TYPE hpms_core.audit_action_type ADD VALUE IF NOT EXISTS 'CONTRACT_EXPIRY_NOTIFIED';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Audit enum may not exist or values already present — skipping: %', SQLERRM;
  END;
END;
$$;

-- Verify
SELECT 'Contracts table created ✅' AS result;
