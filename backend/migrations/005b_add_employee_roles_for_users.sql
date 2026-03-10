-- Add HR and FinanceOfficer to employee_role so 006 can migrate them to users table.
-- (ManagingDirector is added by 001.)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'hpms_core' AND t.typname = 'employee_role' AND e.enumlabel = 'HR') THEN
    ALTER TYPE hpms_core.employee_role ADD VALUE 'HR';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'hpms_core' AND t.typname = 'employee_role' AND e.enumlabel = 'FinanceOfficer') THEN
    ALTER TYPE hpms_core.employee_role ADD VALUE 'FinanceOfficer';
  END IF;
END $$;
