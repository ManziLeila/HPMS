import db from './db.js';

const employeeRepo = {
  async create({ fullName, email, bankAccountEnc, role, passwordHash, mfaSecret, bankName, accountNumberEnc, accountHolderName, phoneNumber, department, dateOfJoining, rssbNumber, clientId }) {
    const { rows } = await db.query(
      `INSERT INTO hpms_core.employees
        (full_name, email, bank_account_enc, role, password_hash, mfa_secret,
         bank_name, account_number_enc, account_holder_name, phone_number, department, date_of_joining, rssb_number, client_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING employee_id, full_name, email, role, department, date_of_joining, rssb_number, client_id, created_at`,
      [fullName, email || null, bankAccountEnc, role, passwordHash, mfaSecret, bankName || null, accountNumberEnc || null, accountHolderName || null, phoneNumber || null, department || null, dateOfJoining || null, rssbNumber || null, clientId || null],
    );
    return rows[0];
  },

  async findByEmail(email) {
    if (!email) return undefined;
    const { rows } = await db.query(
      `SELECT employee_id, full_name, email, role, password_hash, mfa_secret,
              bank_name, account_number_enc, account_holder_name, phone_number,
              email_notifications_enabled, sms_notifications_enabled,
              department, date_of_joining, rssb_number, client_id
       FROM hpms_core.employees
       WHERE email = $1`,
      [email],
    );
    return rows[0];
  },

  async list({ limit = 25, offset = 0 }) {
    const { rows } = await db.query(
      `SELECT employee_id, full_name, email, role, created_at,
              bank_name, account_holder_name, phone_number,
              department, date_of_joining, rssb_number
       FROM hpms_core.employees
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows;
  },

  async listByClientId(clientId, { limit = 25, offset = 0 } = {}) {
    const { rows } = await db.query(
      `SELECT e.employee_id, e.full_name, e.email, e.role, e.created_at,
              e.bank_name, e.account_holder_name, e.phone_number,
              e.department, e.date_of_joining, e.rssb_number, e.client_id,
              c.contract_id, c.start_date AS contract_start_date, c.end_date AS contract_end_date,
              c.contract_document_path AS contract_document_path
       FROM hpms_core.employees e
       LEFT JOIN (
         SELECT DISTINCT ON (employee_id) employee_id, contract_id, start_date, end_date, contract_document_path
         FROM hpms_core.contracts
         ORDER BY employee_id, start_date DESC
       ) c ON c.employee_id = e.employee_id
       WHERE e.client_id = $1
       ORDER BY e.full_name ASC
       LIMIT $2 OFFSET $3`,
      [clientId, limit, offset],
    );
    return rows;
  },

  async updateBankDetails({ employeeId, bankName, accountNumberEnc, accountHolderName }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.employees
       SET bank_name = $2,
           account_number_enc = $3,
           account_holder_name = $4,
           updated_at = NOW()
       WHERE employee_id = $1
       RETURNING employee_id, full_name, email, bank_name, account_holder_name`,
      [employeeId, bankName, accountNumberEnc, accountHolderName],
    );
    return rows[0];
  },

  async updateNotificationPreferences({ employeeId, emailNotifications, smsNotifications }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.employees
       SET email_notifications_enabled = $2,
           sms_notifications_enabled = $3,
           updated_at = NOW()
       WHERE employee_id = $1
       RETURNING employee_id, email_notifications_enabled, sms_notifications_enabled`,
      [employeeId, emailNotifications, smsNotifications],
    );
    return rows[0];
  },

  async findById(employeeId) {
    const { rows } = await db.query(
      `SELECT employee_id, full_name, email, role, created_at,
              bank_name, account_number_enc, account_holder_name, phone_number,
              email_notifications_enabled, sms_notifications_enabled,
              department, date_of_joining, rssb_number
       FROM hpms_core.employees
       WHERE employee_id = $1`,
      [employeeId],
    );
    return rows[0];
  },

  async update({ employeeId, fullName, email, role, phoneNumber, bankName, accountHolderName, department, dateOfJoining, rssbNumber, clientId }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.employees
       SET full_name = COALESCE($2, full_name),
           email = COALESCE($3, email),
           role = COALESCE($4, role),
           phone_number = COALESCE($5, phone_number),
           bank_name = COALESCE($6, bank_name),
           account_holder_name = COALESCE($7, account_holder_name),
           department = COALESCE($8, department),
           date_of_joining = COALESCE($9, date_of_joining),
           rssb_number = COALESCE($10, rssb_number),
           client_id = COALESCE($11, client_id),
           updated_at = NOW()
       WHERE employee_id = $1
       RETURNING employee_id, full_name, email, role, phone_number, bank_name, account_holder_name, department, date_of_joining, rssb_number, client_id, updated_at`,
      [employeeId, fullName, email, role, phoneNumber, bankName, accountHolderName, department, dateOfJoining, rssbNumber, clientId],
    );
    return rows[0];
  },

  async delete(employeeId) {
    const { rows } = await db.query(
      `DELETE FROM hpms_core.employees
       WHERE employee_id = $1
       RETURNING employee_id, full_name, email`,
      [employeeId],
    );
    return rows[0];
  },

  /** Delete employee and all dependent records (salaries, contracts, etc.) */
  async deleteWithDependencies(employeeId) {
    await db.query('DELETE FROM hpms_core.salaries WHERE employee_id = $1', [employeeId]);
    await db.query('DELETE FROM hpms_core.contracts WHERE employee_id = $1', [employeeId]);
    await db.query('DELETE FROM hpms_core.notifications WHERE user_type = $1 AND user_id = $2', ['employee', employeeId]);
    const { rows } = await db.query(
      `DELETE FROM hpms_core.employees WHERE employee_id = $1 RETURNING employee_id, full_name, email`,
      [employeeId],
    );
    return rows[0];
  },

  async updateMfaSecret({ employeeId, mfaSecret }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.employees
       SET mfa_secret = $2,
           updated_at = NOW()
       WHERE employee_id = $1
       RETURNING employee_id, full_name, email`,
      [employeeId, mfaSecret],
    );
    return rows[0];
  },

  async count() {
    const { rows } = await db.query(
      `SELECT COUNT(*) as total FROM hpms_core.employees`
    );
    return parseInt(rows[0].total, 10);
  },

  async findByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await db.query(
      `SELECT employee_id, full_name, email, role, rssb_number FROM hpms_core.employees WHERE employee_id IN (${placeholders})`,
      ids
    );
    return rows;
  },
};

export default employeeRepo;

