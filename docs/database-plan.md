# HC Solutions Payroll — Database Plan

## 1. Overview
- **Engine**: Managed PostgreSQL 15+ (Cloud SQL/Aurora/RDS). Single primary with read replica for analytics.
- **Schema**: `hpms_core`.
- **Encryption**: AES-256 via `pgcrypto`, wrapped by the backend `encryptionService`. Deterministic mode for searchable fields, random IV for high-sensitivity values.
- **Connectivity**: Private VPC peering only; API layer connects through API Gateway and rotates credentials with IAM/Secrets Manager.

## 2. Key Management & Encryption
| Requirement | Implementation |
|-------------|----------------|
| AES-256 at rest | `pgcrypto` (`pgp_sym_encrypt`, `pgp_sym_decrypt`) with 256-bit key |
| Key storage | Backend pulls master key from KMS (Cloud KMS/KeyVault). Key never stored in DB. |
| Envelope pattern | Backend derives per-column keys using HKDF(master, column_name). |
| Deterministic encryption | `pgp_sym_encrypt` with `cipher-algo=aes256, compress-algo=0` + fixed IV only for equality comparisons (emails not encrypted). |
| Rotation | Store `encryption_version` in each row; re-encrypt batches via background job. |

### Helper SQL Functions (created in migrations)
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION hpms_core.encrypt_text(value text, key text)
RETURNS bytea LANGUAGE plpgsql AS $$
BEGIN
  RETURN pgp_sym_encrypt(value, key, 'cipher-algo=aes256');
END $$;

CREATE OR REPLACE FUNCTION hpms_core.decrypt_text(value bytea, key text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RETURN pgp_sym_decrypt(value, key, 'cipher-algo=aes256');
END $$;
```
Backend never calls these directly—`encryptionService` handles it to ensure keys do not leak into SQL logs.

## 3. Tables

### 3.1 `employees`
```sql
CREATE TABLE hpms_core.employees (
  employee_id       SERIAL PRIMARY KEY,
  full_name         VARCHAR(160) NOT NULL,
  email             CITEXT UNIQUE NOT NULL,
  bank_account_enc  BYTEA NOT NULL,
  role              hpms_core.employee_role NOT NULL DEFAULT 'Employee',
  status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  encryption_version SMALLINT NOT NULL DEFAULT 1
);

CREATE INDEX idx_employees_email ON hpms_core.employees (email);
```
- `bank_account_enc` holds AES-256 ciphertext. Backend decrypts only on demand (e.g., payout exports).

### 3.2 `salaries`
```sql
CREATE TABLE hpms_core.salaries (
  salary_id            SERIAL PRIMARY KEY,
  employee_id          INT NOT NULL REFERENCES hpms_core.employees(employee_id) ON DELETE CASCADE,
  pay_period           DATE NOT NULL,
  pay_frequency        VARCHAR(16) NOT NULL DEFAULT 'monthly',
  basic_salary_enc     BYTEA NOT NULL,
  transport_allow_enc  BYTEA,
  housing_allow_enc    BYTEA,
  variable_allow_enc   BYTEA,
  performance_allow_enc BYTEA,
  gross_salary         NUMERIC(14,2) NOT NULL,
  rssb_pension         NUMERIC(14,2) NOT NULL,
  rssb_maternity       NUMERIC(14,2) NOT NULL,
  rama_insurance       NUMERIC(14,2) NOT NULL,
  paye                 NUMERIC(14,2) NOT NULL,
  net_paid_enc         BYTEA NOT NULL,
  total_employer_contrib NUMERIC(14,2) NOT NULL,
  created_by           INT NOT NULL REFERENCES hpms_core.employees(employee_id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  encryption_version   SMALLINT NOT NULL DEFAULT 1,
  UNIQUE (employee_id, pay_period)
);

CREATE INDEX idx_salaries_pay_period ON hpms_core.salaries (pay_period);
CREATE INDEX idx_salaries_employee_period ON hpms_core.salaries (employee_id, pay_period DESC);
```
- Allowance columns are encrypted to hide sensitive compensation details.
- `pay_frequency` allows weekly or monthly payroll processing without duplicating pay periods.
- `gross_salary`, statutory deductions, and employer contributions remain in cleartext for analytics.
- `net_paid_enc` -> AES-256 as final payout is considered “highly sensitive”.

### 3.3 `audits`
```sql
CREATE TABLE hpms_core.audit_logs (
  audit_id    BIGSERIAL PRIMARY KEY,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     INT REFERENCES hpms_core.employees(employee_id),
  action_type hpms_core.audit_action NOT NULL,
  details     JSONB NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE INDEX idx_audit_action_time ON hpms_core.audit_logs (action_type, timestamp DESC);
CREATE INDEX idx_audit_user_time ON hpms_core.audit_logs (user_id, timestamp DESC);
```
- `details` stores structured payloads: `{ "salary_id": 42, "old": {...}, "new": {...} }`.
- All controller actions must insert into this table inside the transaction boundary to satisfy SRDS audit mandates.

## 4. Supporting Types
```sql
CREATE TYPE hpms_core.employee_role AS ENUM ('Admin', 'Employee');

CREATE TYPE hpms_core.audit_action AS ENUM (
  'LOGIN_REQUEST',
  'MFA_CHALLENGE',
  'ACCESS_GRANTED',
  'CREATE_EMPLOYEE',
  'UPDATE_EMPLOYEE',
  'CREATE_SALARY',
  'UPDATE_SALARY',
  'DOWNLOAD_PAYSLIP'
);
```

## 5. Views & Materialized Views
- `vw_payroll_overview`: joins employees + salaries, exposes decrypted fields only for privileged roles. Backend filters columns by RBAC layer.
- `mv_payroll_kpis`: monthly aggregates for dashboard (total payroll cost, net payments, employer contributions). Refresh nightly.

## 6. Operational Considerations
- **Backups**: PITR enabled with 14-day retention. Key rotation schedule quarterly.
- **Row-Level Security**: Enabled on `salaries`; policies restrict non-admins to their own rows (future self-service portal).
- **Monitoring**: Cloud SQL insights, slow-query log retention 30 days, alerts for replication lag > 60s.
- **Migrations**: Use Prisma/MikroORM or plain SQL via `migrate` job inside the backend CI/CD. All migrations run inside a change-window with audit entry `System Maintenance`.

