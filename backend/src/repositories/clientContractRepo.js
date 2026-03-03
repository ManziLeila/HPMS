import db from './db.js';

const clientContractRepo = {
  async listByClientId(clientId, { limit = 50, offset = 0 } = {}) {
    const { rows } = await db.query(
      `SELECT contract_id, client_id, contract_type, start_date, end_date, status, notes, created_at, updated_at
       FROM hpms_core.client_contracts
       WHERE client_id = $1
       ORDER BY start_date DESC
       LIMIT $2 OFFSET $3`,
      [clientId, limit, offset],
    );
    return rows;
  },

  async findById(contractId, clientId) {
    const { rows } = await db.query(
      `SELECT contract_id, client_id, contract_type, start_date, end_date, status, notes, created_at, updated_at
       FROM hpms_core.client_contracts
       WHERE contract_id = $1 AND client_id = $2`,
      [contractId, clientId],
    );
    return rows[0];
  },

  async create({ clientId, contractType, startDate, endDate, notes }) {
    const { rows } = await db.query(
      `INSERT INTO hpms_core.client_contracts (client_id, contract_type, start_date, end_date, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING contract_id, client_id, contract_type, start_date, end_date, status, notes, created_at, updated_at`,
      [clientId, contractType || 'service-agreement', startDate, endDate || null, notes || null],
    );
    return rows[0];
  },

  async update({ contractId, clientId, contractType, startDate, endDate, notes, status }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.client_contracts
       SET contract_type = COALESCE($2, contract_type),
           start_date    = COALESCE($3, start_date),
           end_date      = $4,
           notes         = COALESCE($5, notes),
           status        = COALESCE($6, status),
           updated_at    = NOW()
       WHERE contract_id = $1 AND client_id = $7
       RETURNING contract_id, client_id, contract_type, start_date, end_date, status, notes, created_at, updated_at`,
      [contractId, contractType, startDate, endDate, notes, status, clientId],
    );
    return rows[0];
  },

  async delete(contractId, clientId) {
    const { rows } = await db.query(
      `DELETE FROM hpms_core.client_contracts
       WHERE contract_id = $1 AND client_id = $2
       RETURNING contract_id, client_id`,
      [contractId, clientId],
    );
    return rows[0];
  },

  /** Latest contract for a client (any status) for summary display */
  async getLatestForClient(clientId) {
    const { rows } = await db.query(
      `SELECT contract_id, client_id, contract_type, start_date, end_date, status, notes
       FROM hpms_core.client_contracts
       WHERE client_id = $1
       ORDER BY start_date DESC
       LIMIT 1`,
      [clientId],
    );
    return rows[0];
  },

  /** All client contracts with client name (for Contracts page) */
  async listAll({ limit = 100, offset = 0 } = {}) {
    const { rows } = await db.query(
      `SELECT c.contract_id, c.client_id, c.contract_type, c.start_date, c.end_date, c.status, c.notes, c.created_at,
              cl.name AS client_name
       FROM hpms_core.client_contracts c
       JOIN hpms_core.clients cl ON cl.client_id = c.client_id
       ORDER BY c.start_date DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows;
  },

  /** Client contracts expiring within N days (for dashboard reminders) */
  async findExpiring(days = 30) {
    const { rows } = await db.query(
      `SELECT c.contract_id,
              c.client_id,
              c.contract_type,
              c.start_date,
              c.end_date,
              c.status,
              c.notes,
              c.created_at,
              cl.name AS client_name,
              GREATEST(0, (c.end_date::date - CURRENT_DATE))::int AS days_remaining
       FROM hpms_core.client_contracts c
       JOIN hpms_core.clients cl ON cl.client_id = c.client_id
       WHERE c.status = 'active'
         AND c.end_date IS NOT NULL
         AND c.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + $1 * INTERVAL '1 day')
       ORDER BY c.end_date ASC`,
      [days],
    );
    return rows;
  },
};

export default clientContractRepo;
