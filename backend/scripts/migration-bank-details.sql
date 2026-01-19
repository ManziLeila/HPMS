-- ============================================
-- HC Solutions Payroll - Bank Details & Notifications Migration
-- ============================================
-- Run this in pgAdmin Query Tool or psql
-- Make sure you're connected to the correct database
-- ============================================

-- Add bank details and notification fields to employees table
DO $$ 
BEGIN
    -- Add bank_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'bank_name'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN bank_name TEXT;
    END IF;
    
    -- Add account_number_enc column (encrypted)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'account_number_enc'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN account_number_enc BYTEA;
    END IF;
    
    -- Add account_holder_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'account_holder_name'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN account_holder_name TEXT;
    END IF;
    
    -- Add phone_number column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN phone_number TEXT;
    END IF;
    
    -- Add email_notifications_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'email_notifications_enabled'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add sms_notifications_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'employees' 
        AND column_name = 'sms_notifications_enabled'
    ) THEN
        ALTER TABLE hpms_core.employees ADD COLUMN sms_notifications_enabled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add advance_amount column to salaries table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'hpms_core' 
        AND table_name = 'salaries' 
        AND column_name = 'advance_amount'
    ) THEN
        ALTER TABLE hpms_core.salaries ADD COLUMN advance_amount NUMERIC(12,2) DEFAULT 0;
    END IF;
END $$;

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'hpms_core' 
AND table_name = 'employees'
AND column_name IN ('bank_name', 'account_number_enc', 'account_holder_name', 'phone_number', 'email_notifications_enabled', 'sms_notifications_enabled')
ORDER BY column_name;

SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'hpms_core' 
AND table_name = 'salaries'
AND column_name = 'advance_amount';
