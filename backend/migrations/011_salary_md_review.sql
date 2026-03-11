-- Migration: MD per-employee review fields on salaries
-- Enables MD to approve/reject individual employees before period-level approval

ALTER TABLE hpms_core.salaries
    ADD COLUMN IF NOT EXISTS md_status       VARCHAR(20)  DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS md_comment      TEXT,
    ADD COLUMN IF NOT EXISTS md_reviewed_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS md_reviewed_by  INTEGER REFERENCES hpms_core.users(user_id) ON DELETE SET NULL;

COMMENT ON COLUMN hpms_core.salaries.md_status      IS 'MD review status: PENDING | MD_APPROVED | MD_REJECTED';
COMMENT ON COLUMN hpms_core.salaries.md_comment     IS 'Optional MD note when rejecting';
COMMENT ON COLUMN hpms_core.salaries.md_reviewed_by IS 'Which MD user reviewed this record';
