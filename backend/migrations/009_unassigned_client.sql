-- =====================================================
-- UNASSIGNED CLIENT FOR EMPLOYEES WITHOUT CLIENT
-- Purpose: Allow payroll submission for employees with client_id IS NULL
-- =====================================================

INSERT INTO hpms_core.clients (name)
SELECT 'Unassigned'
WHERE NOT EXISTS (SELECT 1 FROM hpms_core.clients WHERE name = 'Unassigned');
