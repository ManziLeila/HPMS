-- =====================================================
-- CLIENTS TABLE & EMPLOYEE CLIENT LINK
-- Purpose: Support client → employees hierarchy
-- Schema: hpms_core
-- =====================================================

-- Create clients table if it doesn't exist (e.g. already present from dump)
CREATE TABLE IF NOT EXISTS hpms_core.clients (
    client_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add client_id to employees if missing (nullable for backward compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'hpms_core'
          AND table_name = 'employees'
          AND column_name = 'client_id'
    ) THEN
        ALTER TABLE hpms_core.employees
        ADD COLUMN client_id INTEGER REFERENCES hpms_core.clients(client_id) ON DELETE SET NULL;
        RAISE NOTICE 'Added client_id to hpms_core.employees';
    ELSE
        RAISE NOTICE 'client_id already exists on hpms_core.employees';
    END IF;
END $$;

-- Optional: seed one default client if table is empty
INSERT INTO hpms_core.clients (name)
SELECT 'Default Client'
WHERE NOT EXISTS (SELECT 1 FROM hpms_core.clients LIMIT 1);
