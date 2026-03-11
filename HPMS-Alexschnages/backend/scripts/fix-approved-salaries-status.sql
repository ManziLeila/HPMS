-- Fix: Update hr_status for salaries in already-approved periods
-- Run this if salaries still show PENDING after the period was HR/MD approved
-- (e.g. approved before the bulkHrApproveByPeriod fix was added)
--
-- Run: psql -d your_database -f backend/scripts/fix-approved-salaries-status.sql

BEGIN;

-- Set hr_status = 'HR_APPROVED' for all salaries in HR_APPROVED, MD_APPROVED, or SENT_TO_BANK periods
UPDATE hpms_core.salaries s
SET hr_status = 'HR_APPROVED',
    updated_at = NOW()
FROM hpms_core.payroll_periods pp
WHERE s.period_id = pp.period_id
  AND pp.status IN ('HR_APPROVED', 'MD_APPROVED', 'SENT_TO_BANK')
  AND s.hr_status = 'PENDING';

-- Set md_status = 'MD_APPROVED' for all salaries in MD_APPROVED or SENT_TO_BANK periods
UPDATE hpms_core.salaries s
SET md_status = 'MD_APPROVED',
    updated_at = NOW()
FROM hpms_core.payroll_periods pp
WHERE s.period_id = pp.period_id
  AND pp.status IN ('MD_APPROVED', 'SENT_TO_BANK')
  AND (s.md_status IS NULL OR s.md_status = 'PENDING');

COMMIT;

-- Verify
SELECT pp.period_id, pp.client_id, c.name, pp.status, pp.period_month, pp.period_year,
       COUNT(*) FILTER (WHERE s.hr_status = 'PENDING') AS pending_hr,
       COUNT(*) FILTER (WHERE s.hr_status = 'HR_APPROVED') AS hr_approved,
       COUNT(*) AS total
FROM hpms_core.payroll_periods pp
LEFT JOIN hpms_core.clients c ON c.client_id = pp.client_id
LEFT JOIN hpms_core.salaries s ON s.period_id = pp.period_id
WHERE pp.status IN ('HR_APPROVED', 'MD_APPROVED', 'SENT_TO_BANK')
GROUP BY pp.period_id, pp.client_id, c.name, pp.status, pp.period_month, pp.period_year;
