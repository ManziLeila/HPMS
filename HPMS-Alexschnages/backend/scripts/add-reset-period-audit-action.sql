-- Add RESET_PERIOD to audit_action enum
ALTER TYPE hpms_core.audit_action ADD VALUE IF NOT EXISTS 'RESET_PERIOD';
