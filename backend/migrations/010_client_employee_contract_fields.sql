-- ============================================================
-- Migration 010: Client & Employee Contract Enhancements
-- Purpose: Add email, contact_info to clients; contract document
--          storage for client_contracts and employee contracts.
-- ============================================================

-- 1. Extend clients table
ALTER TABLE hpms_core.clients
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_info TEXT;

-- 2. Add contract document path to client_contracts
ALTER TABLE hpms_core.client_contracts
  ADD COLUMN IF NOT EXISTS contract_document_path VARCHAR(500);

-- 3. Add contract document path to employee contracts
ALTER TABLE hpms_core.contracts
  ADD COLUMN IF NOT EXISTS contract_document_path VARCHAR(500);

SELECT 'Migration 010 applied' AS result;
