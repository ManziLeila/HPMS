-- Editable role permissions for Management Console CRUD.
-- Seeded from application defaults; can be updated via API.

CREATE TABLE IF NOT EXISTS hpms_core.role_permissions (
  role     TEXT PRIMARY KEY,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Seed from current ROLE_PERMISSIONS (matches backend constants)
INSERT INTO hpms_core.role_permissions (role, permissions) VALUES
  ('Admin', '["all"]'::jsonb),
  ('FinanceOfficer', '["create_employee","view_employees","create_salary","bulk_upload","view_reports","create_batch","submit_batch","send_to_bank"]'::jsonb),
  ('HR', '["view_employees","view_salaries","view_batches","approve_batch","reject_batch","view_reports","add_comments"]'::jsonb),
  ('ManagingDirector', '["view_all","view_financial_summary","final_approve","final_reject","authorize_bank_transfer","view_audit_trail"]'::jsonb),
  ('Employee', '["view_own_payslip"]'::jsonb)
ON CONFLICT (role) DO NOTHING;

COMMENT ON TABLE hpms_core.role_permissions IS 'Editable per-role permissions; used by requirePermission middleware and Management Console';
