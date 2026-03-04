-- ============================================================
-- Migration: Contract Templates
-- ============================================================

CREATE TABLE IF NOT EXISTS hpms_core.contract_templates (
    template_id   SERIAL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    description   TEXT,
    contract_type VARCHAR(50) DEFAULT 'fixed-term',
    -- Template body — supports {{placeholders}}
    body          TEXT NOT NULL DEFAULT '',
    -- Header/footer HTML snippets
    header_html   TEXT,
    footer_html   TEXT,
    is_default    BOOLEAN DEFAULT FALSE,
    created_by    INTEGER REFERENCES hpms_core.employees(employee_id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_type
    ON hpms_core.contract_templates(contract_type);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION hpms_core.update_contract_templates_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_contract_templates_ts ON hpms_core.contract_templates;
CREATE TRIGGER trg_contract_templates_ts
    BEFORE UPDATE ON hpms_core.contract_templates
    FOR EACH ROW EXECUTE FUNCTION hpms_core.update_contract_templates_ts();

-- Link templates to contracts (optional reference)
ALTER TABLE hpms_core.contracts
    ADD COLUMN IF NOT EXISTS template_id INTEGER
    REFERENCES hpms_core.contract_templates(template_id) ON DELETE SET NULL;

-- ── Seed: default HC Solutions template ───────────────────────
INSERT INTO hpms_core.contract_templates (name, description, contract_type, body, is_default)
VALUES (
  'HC Solutions Standard Employment Contract',
  'Default template for full-time employees',
  'fixed-term',
  E'EMPLOYMENT CONTRACT\n\nThis Employment Contract ("Agreement") is entered into as of {{start_date}}, between:\n\nEMPLOYER:\nHC Solutions Ltd\nKigali, Rwanda\n("The Company")\n\nEMPLOYEE:\nFull Name: {{full_name}}\nEmail: {{email}}\nDepartment: {{department}}\n\n──────────────────────────────────────────\n1. POSITION & DUTIES\n──────────────────────────────────────────\nThe Employee is hired as {{job_title}} in the {{department}} department.\nThe Employee agrees to perform all duties assigned by management diligently and professionally.\n\n──────────────────────────────────────────\n2. CONTRACT DURATION\n──────────────────────────────────────────\nContract Type: {{contract_type}}\nStart Date:    {{start_date}}\nEnd Date:      {{end_date}}\n\nThis contract may be renewed by mutual written agreement before the end date.\n\n──────────────────────────────────────────\n3. REMUNERATION\n──────────────────────────────────────────\nGross Monthly Salary: {{gross_salary}} RWF\nSalary Grade:         {{salary_grade}}\n\nSalary shall be paid monthly, subject to statutory deductions (PAYE, RAMA, Pension).\n\n──────────────────────────────────────────\n4. WORKING HOURS\n──────────────────────────────────────────\nStandard working hours are 40 hours per week, Monday to Friday.\nOvertime is subject to the Rwanda Labour Law provisions.\n\n──────────────────────────────────────────\n5. LEAVE ENTITLEMENT\n──────────────────────────────────────────\nThe Employee is entitled to 18 days of annual leave per year.\nMaternity/Paternity leave as per Rwanda Labour Code.\n\n──────────────────────────────────────────\n6. CONFIDENTIALITY\n──────────────────────────────────────────\nThe Employee shall maintain strict confidentiality of all company data, client information, and financial records.\n\n──────────────────────────────────────────\n7. TERMINATION\n──────────────────────────────────────────\nEither party may terminate this agreement with 30 days written notice.\nThe Company may terminate immediately for gross misconduct.\n\n──────────────────────────────────────────\n8. GOVERNING LAW\n──────────────────────────────────────────\nThis Agreement is governed by the laws of the Republic of Rwanda.\n\n──────────────────────────────────────────\nSIGNATURES\n──────────────────────────────────────────\n\nEmployee: _______________________    Date: _______________\n          {{full_name}}\n\nEmployer: _______________________    Date: _______________\n          Authorized Representative\n          HC Solutions Ltd\n\n\n— Additional Notes —\n{{notes}}',
  TRUE
)
ON CONFLICT DO NOTHING;

SELECT 'Contract templates table created ✅' AS result;
