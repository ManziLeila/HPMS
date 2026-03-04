import pool from '../config/database.js';

class ApprovalHistoryRepository {
  async create({ periodId, actionBy, actionType, comments, previousStatus, newStatus, ipAddress, userAgent, metadata = {} }) {
    const query = `
      INSERT INTO hpms_core.approval_history (
        period_id, action_by, action_type, comments,
        previous_status, new_status, ip_address, user_agent, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      periodId,
      actionBy,
      actionType,
      comments,
      previousStatus,
      newStatus,
      ipAddress,
      userAgent,
      JSON.stringify(metadata),
    ]);

    return result.rows[0];
  }

  async getByPeriod(periodId) {
    const query = `
      SELECT
        ah.*,
        u.full_name  AS action_by_name,
        u.email      AS action_by_email,
        u.role       AS action_by_role
      FROM hpms_core.approval_history ah
      LEFT JOIN hpms_core.users u ON u.user_id = ah.action_by
      WHERE ah.period_id = $1
      ORDER BY ah.created_at DESC
    `;
    const result = await pool.query(query, [periodId]);
    return result.rows;
  }

  async getByUser(userId, limit = 20) {
    const query = `
      SELECT
        ah.*,
        c.name         AS client_name,
        pp.period_month,
        pp.period_year
      FROM hpms_core.approval_history ah
      LEFT JOIN hpms_core.payroll_periods pp ON pp.period_id = ah.period_id
      LEFT JOIN hpms_core.clients c         ON c.client_id  = pp.client_id
      WHERE ah.action_by = $1
      ORDER BY ah.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  async getAll(limit = 50, offset = 0) {
    const query = `
      SELECT
        ah.*,
        u.full_name    AS action_by_name,
        u.email        AS action_by_email,
        c.name         AS client_name,
        pp.period_month,
        pp.period_year
      FROM hpms_core.approval_history ah
      LEFT JOIN hpms_core.users           u  ON u.user_id   = ah.action_by
      LEFT JOIN hpms_core.payroll_periods pp ON pp.period_id = ah.period_id
      LEFT JOIN hpms_core.clients         c  ON c.client_id  = pp.client_id
      ORDER BY ah.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  async getStats(startDate, endDate) {
    const query = `
      SELECT
        action_type,
        COUNT(*)                  AS count,
        COUNT(DISTINCT action_by) AS unique_approvers,
        COUNT(DISTINCT period_id) AS unique_periods
      FROM hpms_core.approval_history
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY action_type
      ORDER BY count DESC
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }
}

export default new ApprovalHistoryRepository();
