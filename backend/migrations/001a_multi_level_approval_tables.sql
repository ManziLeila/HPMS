-- =====================================================
-- 001a: Multi-level approval — TABLES ONLY (run before 001b)
-- Creates payroll_batches, adds batch_id to salaries,
-- creates approval_history and notifications.
-- Run: 001a, then 001b (separate invocations).
-- =====================================================

-- Step 1: Add ManagingDirector role to the enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'ManagingDirector' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'employee_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'hpms_core'))
    ) THEN
        ALTER TYPE hpms_core.employee_role ADD VALUE 'ManagingDirector';
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
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'HR_APPROVED', 'MD_APPROVED', 'REJECTED', 'SENT_TO_BANK')),
    hr_reviewed_by INTEGER REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL,
    hr_reviewed_at TIMESTAMP,
    hr_comments TEXT,
    hr_status VARCHAR(50) CHECK (hr_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    md_reviewed_by INTEGER REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL,
    md_reviewed_at TIMESTAMP,
    md_comments TEXT,
    md_status VARCHAR(50) CHECK (md_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    sent_to_bank_at TIMESTAMP,
    sent_to_bank_by INTEGER REFERENCES hpms_core.employees(employee_id) ON DELETE SET NULL,
    total_employees INTEGER DEFAULT 0,
    total_gross_salary DECIMAL(15, 2) DEFAULT 0,
    total_net_salary DECIMAL(15, 2) DEFAULT 0,
    total_deductions DECIMAL(15, 2) DEFAULT 0,
    total_rssb DECIMAL(15, 2) DEFAULT 0,
    total_paye DECIMAL(15, 2) DEFAULT 0,
    total_rama DECIMAL(15, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_month, period_year, batch_name)
);

-- Step 3: Add batch_id to salaries
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

-- Step 4: Approval History table
CREATE TABLE IF NOT EXISTS hpms_core.approval_history (
    history_id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES hpms_core.payroll_batches(batch_id) ON DELETE CASCADE,
    action_by INTEGER NOT NULL REFERENCES hpms_core.employees(employee_id) ON DELETE RESTRICT,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('SUBMIT', 'HR_APPROVE', 'HR_REJECT', 'MD_APPROVE', 'MD_REJECT', 'SEND_TO_BANK', 'CANCEL')),
    comments TEXT,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Step 5: Notifications table
CREATE TABLE IF NOT EXISTS hpms_core.notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES hpms_core.employees(employee_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    batch_id INTEGER REFERENCES hpms_core.payroll_batches(batch_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    action_url VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'))
);
