-- Add TechAdmin to user_role so tech-only Management Console users can be stored in hpms_core.users
-- If hpms_core.user_role does not exist (e.g. 006 not run), create it with all role values.
DO $$
BEGIN
  -- Create type if missing (bootstrap; normally created in 006, then 012 adds Admin)
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'hpms_core' AND t.typname = 'user_role'
  ) THEN
    CREATE TYPE hpms_core.user_role AS ENUM (
      'FinanceOfficer', 'HR', 'ManagingDirector', 'Admin', 'TechAdmin'
    );
    RETURN;
  END IF;

  -- Type exists: add TechAdmin if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'hpms_core' AND t.typname = 'user_role' AND e.enumlabel = 'TechAdmin'
  ) THEN
    ALTER TYPE hpms_core.user_role ADD VALUE 'TechAdmin';
  END IF;
END $$;
