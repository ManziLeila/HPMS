-- Add RSSB Number column to employees table
-- ==================================================
-- RSSB = Rwanda Social Security Board
-- This field is OPTIONAL because not all employees have an RSSB number.
-- It can be populated via the employee form, bulk upload, or manual edit.
-- ==================================================

-- Step 1: Add the column (nullable)
ALTER TABLE hpms_core.employees
ADD COLUMN IF NOT EXISTS rssb_number VARCHAR(20) DEFAULT NULL;

-- Step 2: Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'hpms_core'
  AND table_name = 'employees'
  AND column_name = 'rssb_number';

-- Done! The rssb_number column is now available.
-- It is optional and can be set during:
--   1. Employee creation (form or bulk upload)
--   2. Employee profile update
