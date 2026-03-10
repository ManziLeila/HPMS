-- =====================================================
-- MULTI-LEVEL APPROVAL SYSTEM MIGRATION
-- Run 001a_multi_level_approval_tables.sql then
-- 001b_multi_level_approval_triggers_views.sql instead
-- (this file is kept for reference; single-file run can fail on "batch_id").
-- =====================================================

-- Step 1: Add ManagingDirector role to the enum
DO $$ 
BEGIN
    -- Add 'ManagingDirector' to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'ManagingDirector' 
        AND enumtypid = (
            SELECT oid FROM pg_type 
            WHERE typname = 'employee_role' 
            AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'hpms_core')
        )
    ) THEN
        ALTER TYPE hpms_core.employee_role ADD VALUE 'ManagingDirector';
        RAISE NOTICE 'Added ManagingDirector role to employee_role enum';
    ELSE
        RAISE NOTICE 'ManagingDirector role already exists';
    END IF;
END $$;

-- Step 2: Create Payroll Batches table
CREATE TABLE IF NOT EXISTS hpms_core.payroll_batches (
    batch_id SERIAL PRIMARY KEY,
    batch_name VARCHAR(255) NOT NULL,
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL CHECK (period_year >= 2020),
    created_by INTEGER NOT NULL REFERENCES hpms_core.employees(employee_id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Approval workflow status
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',           -- Waiting for HR review
        'HR_APPROVED',       -- HR approved, waiting for MD
        'MD_APPROVED',       -- MD approved, ready to send
        'REJECTED',          -- Rejected by HR or MD
        'SENT_TO_BANK'       -- Completed and sent
    )),
    
    -- HR Approval tracking
    hr_reviewed_by INTEGER REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL,
    hr_reviewed_at TIMESTAMP,
    hr_comments TEXT,
    hr_status VARCHAR(50) CHECK (hr_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    
    -- MD Approval tracking
    md_reviewed_by INTEGER REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL,
    md_reviewed_at TIMESTAMP,
    md_comments TEXT,
    md_status VARCHAR(50) CHECK (md_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    
    -- Bank Transfer tracking
    sent_to_bank_at TIMESTAMP,
    sent_to_bank_by INTEGER REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL,
    
    -- Financial Summary (cached for performance)
    total_employees INTEGER DEFAULT 0,
    total_gross_salary DECIMAL(15, 2) DEFAULT 0,
    total_net_salary DECIMAL(15, 2) DEFAULT 0,
    total_deductions DECIMAL(15, 2) DEFAULT 0,
    total_rssb DECIMAL(15, 2) DEFAULT 0,
    total_paye DECIMAL(15, 2) DEFAULT 0,
    total_rama DECIMAL(15, 2) DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique batch per period
    UNIQUE(period_month, period_year, batch_name)
);

-- Step 3: Add batch_id to salaries table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'hpms_core' AND table_name = 'salaries' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE hpms_core.salaries
      ADD COLUMN batch_id INTEGER REFERENCES hpms_core.payroll_batches(batch_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 4: Create Approval History table (audit trail)
CREATE TABLE IF NOT EXISTS hpms_core.approval_history (
    history_id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES hpms_core.payroll_batches(batch_id) ON DELETE CASCADE,
    action_by INTEGER NOT NULL REFERENCES hpms_core.employees(employee_id) ON DELETE RESTRICT,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'SUBMIT',           -- Finance Officer submits batch
        'HR_APPROVE',       -- HR approves
        'HR_REJECT',        -- HR rejects
        'MD_APPROVE',       -- MD gives final approval
        'MD_REJECT',        -- MD rejects
        'SEND_TO_BANK',     -- Sent to bank
        'CANCEL'            -- Batch cancelled
    )),
    comments TEXT,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Step 5: Create Notifications table
CREATE TABLE IF NOT EXISTS hpms_core.notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES hpms_core.employees(employee_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'PAYROLL_SUBMITTED',        -- New batch submitted (for HR)
        'PAYROLL_HR_APPROVED',      -- HR approved (for Finance & MD)
        'PAYROLL_HR_REJECTED',      -- HR rejected (for Finance)
        'PAYROLL_MD_APPROVED',      -- MD approved (for Finance & HR)
        'PAYROLL_MD_REJECTED',      -- MD rejected (for Finance)
        'PAYROLL_SENT_TO_BANK',     -- Sent to bank (for all)
        'APPROVAL_REMINDER',        -- Reminder for pending approval
        'BATCH_CANCELLED'           -- Batch cancelled
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    batch_id INTEGER REFERENCES hpms_core.payroll_batches(batch_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Link to specific action
    action_url VARCHAR(500),
    
    -- Priority level
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'))
);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payroll_batches_status ON hpms_core.payroll_batches(status);
CREATE INDEX IF NOT EXISTS idx_payroll_batches_created_by ON hpms_core.payroll_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_payroll_batches_period ON hpms_core.payroll_batches(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_batches_hr_reviewer ON hpms_core.payroll_batches(hr_reviewed_by);
CREATE INDEX IF NOT EXISTS idx_payroll_batches_md_reviewer ON hpms_core.payroll_batches(md_reviewed_by);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'hpms_core' AND table_name = 'salaries' AND column_name = 'batch_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_salaries_batch ON hpms_core.salaries(batch_id)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_approval_history_batch ON hpms_core.approval_history(batch_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_action_by ON hpms_core.approval_history(action_by);
CREATE INDEX IF NOT EXISTS idx_approval_history_created ON hpms_core.approval_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON hpms_core.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON hpms_core.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_batch ON hpms_core.notifications(batch_id);

-- Step 7: Create function to update batch summary (only if batch_id exists on salaries)
-- Use dynamic SQL so the trigger is not parsed until after batch_id exists.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'hpms_core' AND table_name = 'salaries' AND column_name = 'batch_id') THEN
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION hpms_core.update_batch_summary()
  RETURNS TRIGGER AS $func$
  BEGIN
      UPDATE hpms_core.payroll_batches
      SET 
          total_employees = (SELECT COUNT(*) FROM hpms_core.salaries WHERE batch_id = NEW.batch_id),
          total_gross_salary = (SELECT COALESCE(SUM(gross_salary), 0) FROM hpms_core.salaries WHERE batch_id = NEW.batch_id),
          total_net_salary = (SELECT COALESCE(SUM(net_salary), 0) FROM hpms_core.salaries WHERE batch_id = NEW.batch_id),
          total_deductions = (SELECT COALESCE(SUM(total_deductions), 0) FROM hpms_core.salaries WHERE batch_id = NEW.batch_id),
          total_rssb = (SELECT COALESCE(SUM(rssb_employee), 0) FROM hpms_core.salaries WHERE batch_id = NEW.batch_id),
          total_paye = (SELECT COALESCE(SUM(paye), 0) FROM hpms_core.salaries WHERE batch_id = NEW.batch_id),
          total_rama = (SELECT COALESCE(SUM(rama_insurance), 0) FROM hpms_core.salaries WHERE batch_id = NEW.batch_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE batch_id = NEW.batch_id;
      RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trigger_update_batch_summary ON hpms_core.salaries;
  EXECUTE 'CREATE TRIGGER trigger_update_batch_summary AFTER INSERT OR UPDATE ON hpms_core.salaries FOR EACH ROW WHEN (NEW.batch_id IS NOT NULL) EXECUTE FUNCTION hpms_core.update_batch_summary()';
END $$;

-- Step 9: Create function to auto-update timestamps
CREATE OR REPLACE FUNCTION hpms_core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger for updated_at on payroll_batches
DROP TRIGGER IF EXISTS trigger_payroll_batches_updated_at ON hpms_core.payroll_batches;
CREATE TRIGGER trigger_payroll_batches_updated_at
BEFORE UPDATE ON hpms_core.payroll_batches
FOR EACH ROW
EXECUTE FUNCTION hpms_core.update_updated_at_column();

-- Step 11: Create view for batch details with approver names
CREATE OR REPLACE VIEW hpms_core.v_batch_details AS
SELECT 
    pb.*,
    creator.full_name as created_by_name,
    creator.email as created_by_email,
    hr.full_name as hr_reviewed_by_name,
    hr.email as hr_reviewed_by_email,
    md.full_name as md_reviewed_by_name,
    md.email as md_reviewed_by_email,
    sender.full_name as sent_to_bank_by_name,
    sender.email as sent_to_bank_by_email
FROM hpms_core.payroll_batches pb
LEFT JOIN hpms_core.employees creator ON pb.created_by = creator.employee_id
LEFT JOIN hpms_core.employees hr ON pb.hr_reviewed_by = hr.employee_id
LEFT JOIN hpms_core.employees md ON pb.md_reviewed_by = md.employee_id
LEFT JOIN hpms_core.employees sender ON pb.sent_to_bank_by = sender.employee_id;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '✅ New role available: ManagingDirector';
    RAISE NOTICE '✅ New tables created: payroll_batches, approval_history, notifications';
    RAISE NOTICE '✅ Added batch_id to salaries table';
    RAISE NOTICE '✅ Created triggers and views';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Create users with new roles (FinanceOfficer, HR, ManagingDirector)';
    RAISE NOTICE '2. Restart your backend server';
    RAISE NOTICE '3. Test the approval workflow';
END $$;

-- Verification queries (run these to verify the migration)
SELECT 'Checking new tables...' as step;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'hpms_core' 
AND table_name IN ('payroll_batches', 'approval_history', 'notifications');

SELECT 'Checking employee roles...' as step;
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid FROM pg_type 
    WHERE typname = 'employee_role' 
    AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'hpms_core')
)
ORDER BY enumlabel;

SELECT 'Checking batch_id column in salaries...' as step;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'hpms_core' 
AND table_name = 'salaries'
AND column_name = 'batch_id';
