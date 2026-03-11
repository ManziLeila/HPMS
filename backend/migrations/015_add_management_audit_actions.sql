-- Add Management Console audit action types for user/role/permission changes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'hpms_core' AND t.typname = 'audit_action' AND e.enumlabel = 'CREATE_USER') THEN
    ALTER TYPE hpms_core.audit_action ADD VALUE 'CREATE_USER';
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'hpms_core' AND t.typname = 'audit_action' AND e.enumlabel = 'UPDATE_USER') THEN
    ALTER TYPE hpms_core.audit_action ADD VALUE 'UPDATE_USER';
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'hpms_core' AND t.typname = 'audit_action' AND e.enumlabel = 'DELETE_USER') THEN
    ALTER TYPE hpms_core.audit_action ADD VALUE 'DELETE_USER';
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'hpms_core' AND t.typname = 'audit_action' AND e.enumlabel = 'UPDATE_USER_ROLE') THEN
    ALTER TYPE hpms_core.audit_action ADD VALUE 'UPDATE_USER_ROLE';
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'hpms_core' AND t.typname = 'audit_action' AND e.enumlabel = 'UPDATE_ROLE_PERMISSIONS') THEN
    ALTER TYPE hpms_core.audit_action ADD VALUE 'UPDATE_ROLE_PERMISSIONS';
  END IF;
END $$;
