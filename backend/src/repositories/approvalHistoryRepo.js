import pool from '../config/database.js';

class ApprovalHistoryRepository {
  // Log an approval action
  async create({ batchId, actionBy, actionType, comments, previousStatus, newStatus, ipAddress, userAgent, metadata = {} }) {
    const query = `
      INSERT INTO hpms_core.approval_history (
        batch_id, action_by, action_type, comments, 
        previous_status, new_status, ip_address, user_agent, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      batchId,
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

  // Get history for a specific batch
  async getByBatch(batchId) {
    const query = `
      SELECT 
        ah.*,
        e.full_name as action_by_name,
        e.email as action_by_email,
        e.role as action_by_role
      FROM hpms_core.approval_history ah
      JOIN hpms_core.employees e ON ah.action_by = e.employee_id
      WHERE ah.batch_id = $1
      ORDER BY ah.created_at DESC
    `;

    const result = await pool.query(query, [batchId]);
    return result.rows;
  }

  // Get recent actions by a user
  async getByUser(userId, limit = 20) {
    const query = `
      SELECT 
        ah.*,
        pb.batch_name,
        pb.period_month,
        pb.period_year
      FROM hpms_core.approval_history ah
      JOIN hpms_core.payroll_batches pb ON ah.batch_id = pb.batch_id
      WHERE ah.action_by = $1
      ORDER BY ah.created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  // Get all approval history with pagination
  async getAll(limit = 50, offset = 0) {
    const query = `
      SELECT 
        ah.*,
        e.full_name as action_by_name,
        e.email as action_by_email,
        pb.batch_name,
        pb.period_month,
        pb.period_year
      FROM hpms_core.approval_history ah
      JOIN hpms_core.employees e ON ah.action_by = e.employee_id
      JOIN hpms_core.payroll_batches pb ON ah.batch_id = pb.batch_id
      ORDER BY ah.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  // Get approval statistics
  async getStats(startDate, endDate) {
    const query = `
      SELECT 
        action_type,
        COUNT(*) as count,
        COUNT(DISTINCT action_by) as unique_approvers,
        COUNT(DISTINCT batch_id) as unique_batches
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
