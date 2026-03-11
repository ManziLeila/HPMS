-- ============================================================
-- Migration 007: Replace payroll_batches with payroll_periods
--
-- Payroll is now grouped by (client × month × year) instead of
-- custom Finance-Officer-defined batches.
--
-- Idempotent — safe to re-run.
-- ============================================================

BEGIN;

-- ─── Cleanup: reset any partially applied state ──────────────────────────────
DROP TABLE IF EXISTS hpms_core.payroll_periods CASCADE;
DROP VIEW  IF EXISTS hpms_core.v_batch_details;

-- Restore approval_history to pure batch-id state if period_id was already added
ALTER TABLE hpms_core.approval_history
    DROP COLUMN IF EXISTS period_id;

-- ─── Step 1: Create payroll_periods ──────────────────────────────────────────
-- One record per (client, month, year) tracks the entire approval lifecycle.
CREATE TABLE hpms_core.payroll_periods (
    period_id       SERIAL PRIMARY KEY,

    client_id       INTEGER NOT NULL
                    REFERENCES hpms_core.clients(client_id) ON DELETE CASCADE,

    period_month    INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year     INTEGER NOT NULL CHECK (period_year  >= 2020),

    status          VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED'
                    CHECK (status IN (
                        'SUBMITTED',   -- Finance Officer submitted for HR review
                        'HR_APPROVED', -- HR verified, forwarded to MD
                        'MD_APPROVED', -- MD gave final approval
                        'REJECTED',    -- Rejected (either by HR or MD)
                        'SENT_TO_BANK' -- Finance Officer processed payment
                    )),

    submitted_by    INTEGER REFERENCES hpms_core.users(user_id) ON DELETE SET NULL,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    hr_reviewed_by  INTEGER REFERENCES hpms_core.users(user_id) ON DELETE SET NULL,
    hr_reviewed_at  TIMESTAMPTZ,
    hr_comments     TEXT,

    md_reviewed_by  INTEGER REFERENCES hpms_core.users(user_id) ON DELETE SET NULL,
    md_reviewed_at  TIMESTAMPTZ,
    md_comments     TEXT,

    sent_to_bank_by INTEGER REFERENCES hpms_core.users(user_id) ON DELETE SET NULL,
    sent_to_bank_at TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(client_id, period_month, period_year)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION hpms_core.touch_payroll_periods()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payroll_periods_updated
    BEFORE UPDATE ON hpms_core.payroll_periods
    FOR EACH ROW EXECUTE FUNCTION hpms_core.touch_payroll_periods();

-- ─── Step 2: Add period_id FK to salaries ────────────────────────────────────
ALTER TABLE hpms_core.salaries
    ADD COLUMN IF NOT EXISTS period_id INTEGER
    REFERENCES hpms_core.payroll_periods(period_id) ON DELETE SET NULL;

-- ─── Step 3: Add period_id to approval_history (replacing batch_id) ──────────
ALTER TABLE hpms_core.approval_history
    ADD COLUMN IF NOT EXISTS period_id INTEGER
    REFERENCES hpms_core.payroll_periods(period_id) ON DELETE CASCADE;

ALTER TABLE hpms_core.approval_history
    DROP COLUMN IF EXISTS batch_id;

-- ─── Step 4: Drop batch_id from salaries then drop payroll_batches ───────────
-- Drop trigger that depends on batch_id before dropping the column
DROP TRIGGER IF EXISTS trigger_update_batch_summary ON hpms_core.salaries;

ALTER TABLE hpms_core.salaries  DROP COLUMN IF EXISTS batch_id;
DROP TABLE  IF EXISTS hpms_core.payroll_batches CASCADE;

COMMIT;
