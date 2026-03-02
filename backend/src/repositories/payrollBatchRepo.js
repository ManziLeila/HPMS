import pool from '../config/database.js';
import { BATCH_STATUS, APPROVAL_ACTIONS } from '../constants/roles.js';

class PayrollBatchRepository {
  // Create a new payroll batch
  async create({ batchName, periodMonth, periodYear, createdBy }) {
    const query = `
      INSERT INTO hpms_core.payroll_batches (
        batch_name, period_month, period_year, created_by, status, hr_status, md_status
      )
      VALUES ($1, $2, $3, $4, $5, 'PENDING', 'PENDING')
      RETURNING *
    `;

    const result = await pool.query(query, [
      batchName,
      periodMonth,
      periodYear,
      createdBy,
      BATCH_STATUS.PENDING,
    ]);

    return result.rows[0];
  }

  // Get batch by ID with full details
  async getById(batchId) {
    const query = `
      SELECT * FROM hpms_core.v_batch_details
      WHERE batch_id = $1
    `;

    const result = await pool.query(query, [batchId]);
    return result.rows[0];
  }

  // Get batches by status
  async getByStatus(status, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM hpms_core.v_batch_details
      WHERE status = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [status, limit, offset]);
    return result.rows;
  }

  // Get batches created by a specific user
  async getByCreator(createdBy, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM hpms_core.v_batch_details
      WHERE created_by = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [createdBy, limit, offset]);
    return result.rows;
  }

  // Get pending batches for HR review
  async getPendingForHR() {
    return this.getByStatus(BATCH_STATUS.PENDING);
  }

  // Get pending batches for MD review
  async getPendingForMD() {
    return this.getByStatus(BATCH_STATUS.HR_APPROVED);
  }

  // Update batch status and HR review
  async updateHRReview({ batchId, reviewedBy, status, comments }) {
    const query = `
      UPDATE hpms_core.payroll_batches
      SET 
        hr_reviewed_by = $1,
        hr_reviewed_at = CURRENT_TIMESTAMP,
        hr_status = $2,
        hr_comments = $3,
        status = $4
      WHERE batch_id = $5
      RETURNING *
    `;

    const newStatus = status === 'APPROVED' ? BATCH_STATUS.HR_APPROVED : BATCH_STATUS.REJECTED;

    const result = await pool.query(query, [
      reviewedBy,
      status,
      comments,
      newStatus,
      batchId,
    ]);

    return result.rows[0];
  }

  // Update batch status and MD review
  async updateMDReview({ batchId, reviewedBy, status, comments }) {
    const query = `
      UPDATE hpms_core.payroll_batches
      SET 
        md_reviewed_by = $1,
        md_reviewed_at = CURRENT_TIMESTAMP,
        md_status = $2,
        md_comments = $3,
        status = $4
      WHERE batch_id = $5
      RETURNING *
    `;

    const newStatus = status === 'APPROVED' ? BATCH_STATUS.MD_APPROVED : BATCH_STATUS.REJECTED;

    const result = await pool.query(query, [
      reviewedBy,
      status,
      comments,
      newStatus,
      batchId,
    ]);

    return result.rows[0];
  }

  // Mark batch as sent to bank
  async markAsSent({ batchId, sentBy }) {
    const query = `
      UPDATE hpms_core.payroll_batches
      SET 
        sent_to_bank_at = CURRENT_TIMESTAMP,
        sent_to_bank_by = $1,
        status = $2
      WHERE batch_id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [
      sentBy,
      BATCH_STATUS.SENT_TO_BANK,
      batchId,
    ]);

    return result.rows[0];
  }

  // Add salaries to a batch
  async addSalariesToBatch(batchId, salaryIds) {
    const query = `
      UPDATE hpms_core.salaries
      SET batch_id = $1
      WHERE salary_id = ANY($2)
      RETURNING salary_id
    `;

    const result = await pool.query(query, [batchId, salaryIds]);
    return result.rows;
  }

  // Get salaries in a batch
  async getSalariesInBatch(batchId) {
    const query = `
      SELECT 
        s.*,
        e.full_name,
        e.email,
        e.department,
        e.bank_name,
        e.account_holder_name,
        e.account_number_enc
      FROM hpms_core.salaries s
      JOIN hpms_core.employees e ON s.employee_id = e.employee_id
      WHERE s.batch_id = $1
      ORDER BY e.full_name
    `;

    const result = await pool.query(query, [batchId]);
    return result.rows;
  }

  // Get batch statistics for dashboard
  async getBatchStats(userId, userRole) {
    let query;
    let params;

    if (userRole === 'FinanceOfficer' || userRole === 'Admin') {
      query = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_hr_review,
          COUNT(*) FILTER (WHERE status = 'HR_APPROVED') as hr_approved,
          COUNT(*) FILTER (WHERE status = 'MD_APPROVED') as md_approved,
          COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
          COUNT(*) FILTER (WHERE status = 'SENT_TO_BANK') as sent_to_bank
        FROM hpms_core.payroll_batches
        WHERE created_by = $1
      `;
      params = [userId];
    } else if (userRole === 'HR') {
      query = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_review,
          COUNT(*) FILTER (WHERE status = 'HR_APPROVED') as approved,
          COUNT(*) FILTER (WHERE status = 'REJECTED' AND hr_status = 'REJECTED') as rejected_by_me
        FROM hpms_core.payroll_batches
      `;
      params = [];
    } else if (userRole === 'ManagingDirector') {
      query = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'HR_APPROVED') as pending_final_approval,
          COUNT(*) FILTER (WHERE status = 'MD_APPROVED') as approved,
          COUNT(*) FILTER (WHERE status = 'REJECTED' AND md_status = 'REJECTED') as rejected_by_me,
          COUNT(*) FILTER (WHERE status = 'SENT_TO_BANK') as sent_to_bank
        FROM hpms_core.payroll_batches
      `;
      params = [];
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Delete a batch (only if not approved)
  async delete(batchId) {
    const query = `
      DELETE FROM hpms_core.payroll_batches
      WHERE batch_id = $1 AND status = 'PENDING'
      RETURNING *
    `;

    const result = await pool.query(query, [batchId]);
    return result.rows[0];
  }
}

export default new PayrollBatchRepository();
