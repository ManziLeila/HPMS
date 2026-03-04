-- ============================================================
-- Migration: Client contracts (contracts per client, not per employee)
-- Run in pgAdmin / psql against hpms_core
-- ============================================================

CREATE TABLE IF NOT EXISTS hpms_core.client_contracts (
    contract_id   SERIAL PRIMARY KEY,
    client_id     INTEGER NOT NULL REFERENCES hpms_core.clients(client_id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL DEFAULT 'service-agreement',
    -- service-agreement | master | renewal | other
    start_date    DATE NOT NULL,
    end_date      DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'active',
    -- active | expired | terminated | renewed
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_contracts_client   ON hpms_core.client_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_status  ON hpms_core.client_contracts(status);
CREATE INDEX IF NOT EXISTS idx_client_contracts_end_date ON hpms_core.client_contracts(end_date) WHERE status = 'active';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION hpms_core.update_client_contracts_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_client_contracts_updated_at ON hpms_core.client_contracts;
CREATE TRIGGER trg_client_contracts_updated_at
    BEFORE UPDATE ON hpms_core.client_contracts
    FOR EACH ROW EXECUTE FUNCTION hpms_core.update_client_contracts_timestamp();

SELECT 'Client contracts table created' AS result;
