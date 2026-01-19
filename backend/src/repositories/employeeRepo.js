import db from './db.js';

const employeeRepo = {
  async create({ fullName, email, bankAccountEnc, role, passwordHash, mfaSecret, bankName, accountNumberEnc, accountHolderName, phoneNumber, department, dateOfJoining }) {
    const { rows } = await db.query(
      `INSERT INTO hpms_core.employees
        (full_name, email, bank_account_enc, role, password_hash, mfa_secret, 
         bank_name, account_number_enc, account_holder_name, phone_number, department, date_of_joining)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING employee_id, full_name, email, role, department, date_of_joining, created_at`,
      [fullName, email, bankAccountEnc, role, passwordHash, mfaSecret, bankName, accountNumberEnc, accountHolderName, phoneNumber, department, dateOfJoining],
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await db.query(
      `SELECT employee_id, full_name, email, role, password_hash, mfa_secret,
              bank_name, account_number_enc, account_holder_name, phone_number,
              email_notifications_enabled, sms_notifications_enabled,
              department, date_of_joining
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
              department, date_of_joining
       FROM hpms_core.employees
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
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
              department, date_of_joining
       FROM hpms_core.employees
       WHERE employee_id = $1`,
      [employeeId],
    );
    return rows[0];
  },

  async update({ employeeId, fullName, email, role, phoneNumber, bankName, accountHolderName, department, dateOfJoining }) {
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
           updated_at = NOW()
       WHERE employee_id = $1
       RETURNING employee_id, full_name, email, role, phone_number, bank_name, account_holder_name, department, date_of_joining, updated_at`,
      [employeeId, fullName, email, role, phoneNumber, bankName, accountHolderName, department, dateOfJoining],
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
};

export default employeeRepo;

