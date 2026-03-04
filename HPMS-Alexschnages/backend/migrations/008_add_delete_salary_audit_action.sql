-- Add DELETE_SALARY to audit_action enum (required for salary delete audit logging)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'DELETE_SALARY'
        AND enumtypid = 'hpms_core.audit_action'::regtype
    ) THEN
        ALTER TYPE hpms_core.audit_action ADD VALUE 'DELETE_SALARY';
        RAISE NOTICE 'Added DELETE_SALARY to audit_action enum';
    ELSE
        RAISE NOTICE 'DELETE_SALARY already exists in audit_action enum';
    END IF;
END $$;
