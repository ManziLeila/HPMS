-- Migration: HR individual salary review fields
-- Run once against the production database

ALTER TABLE hpms_core.salaries
    ADD COLUMN IF NOT EXISTS hr_status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS hr_comment      TEXT,
    ADD COLUMN IF NOT EXISTS hr_reviewed_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hr_reviewed_by  TEXT;   -- stores employee_id of HR reviewer (no FK to avoid type issues)

-- Valid values: PENDING | HR_APPROVED | HR_REJECTED
COMMENT ON COLUMN hpms_core.salaries.hr_status      IS 'HR review status: PENDING | HR_APPROVED | HR_REJECTED';
COMMENT ON COLUMN hpms_core.salaries.hr_comment     IS 'Optional HR note visible to the Finance Officer';
COMMENT ON COLUMN hpms_core.salaries.hr_reviewed_by IS 'Which HR user reviewed this record (stored as text ID)';
