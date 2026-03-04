-- Migration: Add payroll_snapshot_enc column to salaries table
-- This column stores the encrypted complete payroll snapshot needed for PDF generation

-- Add the column
ALTER TABLE hpms_core.salaries 
ADD COLUMN IF NOT EXISTS payroll_snapshot_enc TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN hpms_core.salaries.payroll_snapshot_enc IS 
'Encrypted JSON snapshot of complete payroll calculation data used for PDF generation and email sending';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'hpms_core' 
  AND table_name = 'salaries' 
  AND column_name = 'payroll_snapshot_enc';
