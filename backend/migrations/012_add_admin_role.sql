-- Add Admin to user_role so Management Console admins can be stored in hpms_core.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'hpms_core' AND t.typname = 'user_role' AND e.enumlabel = 'Admin'
  ) THEN
    ALTER TYPE hpms_core.user_role ADD VALUE 'Admin';
  END IF;
END $$;
