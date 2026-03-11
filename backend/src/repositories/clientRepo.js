import db from './db.js';

const clientRepo = {
  async list({ limit = 50, offset = 0 } = {}) {
    const { rows } = await db.query(
      `SELECT client_id, name, email, contact_info, created_at
       FROM hpms_core.clients
       ORDER BY name ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows;
  },

  async findById(clientId) {
    const { rows } = await db.query(
      `SELECT client_id, name, email, contact_info, created_at
       FROM hpms_core.clients
       WHERE client_id = $1`,
      [clientId],
    );
    return rows[0];
  },

  async count() {
    const { rows } = await db.query(
      `SELECT COUNT(*) AS total FROM hpms_core.clients`,
    );
    return parseInt(rows[0].total, 10);
  },

  async create({ name, email, contactInfo }) {
    const { rows } = await db.query(
      `INSERT INTO hpms_core.clients (name, email, contact_info)
       VALUES ($1, $2, $3)
       RETURNING client_id, name, email, contact_info, created_at`,
      [name, email || null, contactInfo || null],
    );
    return rows[0];
  },

  async update({ clientId, name, email, contactInfo }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.clients
       SET name = $2,
           email = $3,
           contact_info = $4
       WHERE client_id = $1
       RETURNING client_id, name, email, contact_info, created_at`,
      [clientId, name, email ?? null, contactInfo ?? null],
    );
    return rows[0];
  },

  async delete(clientId) {
    const { rows } = await db.query(
      `DELETE FROM hpms_core.clients
       WHERE client_id = $1
       RETURNING client_id, name`,
      [clientId],
    );
    return rows[0];
  },
};

export default clientRepo;
