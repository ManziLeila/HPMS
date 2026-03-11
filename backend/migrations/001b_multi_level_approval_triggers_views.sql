-- =====================================================
-- 001b: Multi-level approval — INDEXES, TRIGGERS, VIEW (run after 001a)
-- Safe when batch_id or payroll_batches is missing (e.g. 007 already ran).
-- =====================================================

-- Step 6: Indexes on payroll_batches (skip if table was dropped by 007)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hpms_core' AND table_name = 'payroll_batches') THEN
    RETURN;
  END IF;
  CREATE INDEX IF NOT EXISTS idx_payroll_batches_status ON hpms_core.payroll_batches(status);
  CREATE INDEX IF NOT EXISTS idx_payroll_batches_created_by ON hpms_core.payroll_batches(created_by);
  CREATE INDEX IF NOT EXISTS idx_payroll_batches_period ON hpms_core.payroll_batches(period_year, period_month);
  CREATE INDEX IF NOT EXISTS idx_payroll_batches_hr_reviewer ON hpms_core.payroll_batches(hr_reviewed_by);
  CREATE INDEX IF NOT EXISTS idx_payroll_batches_md_reviewer ON hpms_core.payroll_batches(md_reviewed_by);
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'hpms_core' AND table_name = 'salaries' AND column_name = 'batch_id') THEN
    CREATE INDEX IF NOT EXISTS idx_salaries_batch ON hpms_core.salaries(batch_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'hpms_core' AND table_name = 'approval_history' AND column_name = 'batch_id') THEN
    CREATE INDEX IF NOT EXISTS idx_approval_history_batch ON hpms_core.approval_history(batch_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_approval_history_action_by ON hpms_core.approval_history(action_by);
CREATE INDEX IF NOT EXISTS idx_approval_history_created ON hpms_core.approval_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON hpms_core.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON hpms_core.notifications(created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'hpms_core' AND table_name = 'notifications' AND column_name = 'batch_id') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_batch ON hpms_core.notifications(batch_id);
  END IF;
END $$;

-- Step 7: Batch summary function and trigger (only if batch_id exists and payroll_batches exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'hpms_core' AND table_name = 'salaries' AND column_name = 'batch_id') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hpms_core' AND table_name = 'payroll_batches') THEN
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION hpms_core.update_batch_summary()
  RETURNS TRIGGER AS $f$
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
  $f$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trigger_update_batch_summary ON hpms_core.salaries;
  EXECUTE 'CREATE TRIGGER trigger_update_batch_summary AFTER INSERT OR UPDATE ON hpms_core.salaries FOR EACH ROW WHEN (NEW.batch_id IS NOT NULL) EXECUTE FUNCTION hpms_core.update_batch_summary()';
END $$;

-- Step 8: updated_at trigger on payroll_batches (only if table exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hpms_core' AND table_name = 'payroll_batches') THEN
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION hpms_core.update_updated_at_column()
  RETURNS TRIGGER AS $f$
  BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
  END;
  $f$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trigger_payroll_batches_updated_at ON hpms_core.payroll_batches;
  CREATE TRIGGER trigger_payroll_batches_updated_at
  BEFORE UPDATE ON hpms_core.payroll_batches
  FOR EACH ROW
  EXECUTE FUNCTION hpms_core.update_updated_at_column();
END $$;

-- Step 9: View (only if payroll_batches exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'hpms_core' AND table_name = 'payroll_batches') THEN
    RETURN;
  END IF;
  DROP VIEW IF EXISTS hpms_core.v_batch_details;
  EXECUTE '
    CREATE VIEW hpms_core.v_batch_details AS
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
    LEFT JOIN hpms_core.employees sender ON pb.sent_to_bank_by = sender.employee_id
  ';
END $$;
