import db from './db.js';

const userRepo = {
  async create({ fullName, email, passwordHash, mfaSecret, role, department }) {
    const { rows } = await db.query(
      `INSERT INTO hpms_core.users
         (full_name, email, password_hash, mfa_secret, role, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, full_name, email, role, department, status, mfa_enabled, created_at`,
      [fullName, email || null, passwordHash || null, mfaSecret || null, role, department || null],
    );
    return rows[0];
  },

  async findByEmail(email) {
    if (!email) return undefined;
    const { rows } = await db.query(
      `SELECT user_id, full_name, email, role, password_hash, mfa_secret,
              department, status, mfa_enabled, created_at
       FROM hpms_core.users
       WHERE email = $1`,
      [email],
    );
    return rows[0];
  },

  async findById(userId) {
    const { rows } = await db.query(
      `SELECT user_id, full_name, email, role, department, status, mfa_enabled, created_at, updated_at
       FROM hpms_core.users
       WHERE user_id = $1`,
      [userId],
    );
    return rows[0];
  },

  async list({ limit = 50, offset = 0 } = {}) {
    const { rows } = await db.query(
      `SELECT user_id, full_name, email, role, department, status, mfa_enabled, created_at
       FROM hpms_core.users
       ORDER BY role, full_name
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows;
  },

  async update({ userId, fullName, email, role, department, status }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.users
       SET full_name  = COALESCE($2, full_name),
           email      = COALESCE($3, email),
           role       = COALESCE($4::hpms_core.user_role, role),
           department = COALESCE($5, department),
           status     = COALESCE($6, status),
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING user_id, full_name, email, role, department, status, mfa_enabled, updated_at`,
      [userId, fullName, email, role, department, status],
    );
    return rows[0];
  },

  async updatePassword({ userId, passwordHash }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.users
       SET password_hash = $2, updated_at = NOW()
       WHERE user_id = $1
       RETURNING user_id`,
      [userId, passwordHash],
    );
    return rows[0];
  },

  async delete(userId) {
    const { rows } = await db.query(
      `DELETE FROM hpms_core.users
       WHERE user_id = $1
       RETURNING user_id, full_name, email`,
      [userId],
    );
    return rows[0];
  },

  async findByRole(role) {
    const { rows } = await db.query(
      `SELECT user_id, full_name, email, role, department
       FROM hpms_core.users
       WHERE role = $1 AND status = 'ACTIVE'`,
      [role],
    );
    return rows;
  },
};

export default userRepo;
