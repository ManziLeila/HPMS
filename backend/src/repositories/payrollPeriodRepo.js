import pool from '../config/database.js';

class PayrollPeriodRepository {
  // ── Queries ──────────────────────────────────────────────────────────────

  #baseSelect = `
    SELECT pp.*,
           COALESCE(c.name, 'Deleted Client') AS client_name,
           COUNT(s.salary_id)      AS salary_count,
           COALESCE(SUM(s.gross_salary), 0) AS total_gross,
           COALESCE(SUM(s.paye), 0)         AS total_paye,
           sub.full_name           AS submitted_by_name,
           hru.full_name           AS hr_reviewed_by_name,
           mdu.full_name           AS md_reviewed_by_name
    FROM hpms_core.payroll_periods pp
    LEFT JOIN hpms_core.clients c   ON c.client_id  = pp.client_id
    LEFT JOIN hpms_core.salaries s ON s.period_id = pp.period_id
    LEFT JOIN hpms_core.users sub ON sub.user_id  = pp.submitted_by
    LEFT JOIN hpms_core.users hru ON hru.user_id  = pp.hr_reviewed_by
    LEFT JOIN hpms_core.users mdu ON mdu.user_id  = pp.md_reviewed_by
  `;

  #groupBy = `
    GROUP BY pp.period_id, c.name, sub.full_name, hru.full_name, mdu.full_name
    ORDER BY pp.period_year DESC, pp.period_month DESC, pp.submitted_at DESC
  `;

  // ── Read ─────────────────────────────────────────────────────────────────

  async findByKey(clientId, month, year) {
    const q = `${this.#baseSelect}
               WHERE pp.client_id = $1 AND pp.period_month = $2 AND pp.period_year = $3
               ${this.#groupBy}`;
    const { rows } = await pool.query(q, [clientId, month, year]);
    return rows[0] || null;
  }

  async getById(periodId) {
    const q = `${this.#baseSelect}
               WHERE pp.period_id = $1
               ${this.#groupBy}`;
    const { rows } = await pool.query(q, [periodId]);
    return rows[0] || null;
  }

  async list({ status, statuses, clientId } = {}) {
    const conds = [];
    const params = [];
    if (status) {
      params.push(status);
      conds.push(`pp.status = $${params.length}`);
    } else if (statuses && statuses.length) {
      params.push(statuses);
      conds.push(`pp.status = ANY($${params.length})`);
    }
    if (clientId) { params.push(clientId); conds.push(`pp.client_id = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const q = `${this.#baseSelect} ${where} ${this.#groupBy}`;
    const { rows } = await pool.query(q, params);
    return rows;
  }

  async listBySubmitter(userId) {
    const q = `${this.#baseSelect}
               WHERE pp.submitted_by = $1
               ${this.#groupBy}`;
    const { rows } = await pool.query(q, [userId]);
    return rows;
  }

  // Returns salary rows with employee details for a period
  async getSalaries(periodId) {
    const { rows } = await pool.query(
      `SELECT s.*,
              e.full_name, e.email, e.department,
              e.bank_name, e.account_holder_name
       FROM hpms_core.salaries s
       JOIN hpms_core.employees e ON e.employee_id = s.employee_id
       WHERE s.period_id = $1
       ORDER BY e.full_name`,
      [periodId],
    );
    return rows;
  }

  // Returns salary rows for unsubmitted client+month (for FO preview before submit)
  async getReadySalaries(clientId, periodMonth, periodYear) {
    const { rows } = await pool.query(
      `SELECT s.*,
              e.full_name, e.email, e.department,
              e.bank_name, e.account_holder_name
       FROM hpms_core.salaries s
       JOIN hpms_core.employees e ON e.employee_id = s.employee_id
       WHERE s.period_id IS NULL
         AND EXTRACT(MONTH FROM s.pay_period) = $2
         AND EXTRACT(YEAR FROM s.pay_period) = $3
         AND (
           (e.client_id = $1)
           OR ($1 IN (SELECT client_id FROM hpms_core.clients WHERE name = 'Unassigned') AND e.client_id IS NULL)
         )
       ORDER BY e.full_name`,
      [clientId, periodMonth, periodYear],
    );
    return rows;
  }

  // Ensure "Unassigned" client exists for employees with no client
  async ensureUnassignedClient() {
    await pool.query(
      `INSERT INTO hpms_core.clients (name)
       SELECT 'Unassigned'
       WHERE NOT EXISTS (SELECT 1 FROM hpms_core.clients WHERE name = 'Unassigned')`,
    );
  }

  // Client+month groups with salary records but not yet submitted
  // Returns ALL unsubmitted groups (any FO can submit)
  // Employees with client_id NULL are grouped under "Unassigned" client
  async getReadyToSubmit() {
    await this.ensureUnassignedClient();
    const { rows } = await pool.query(
      `WITH ua AS (SELECT client_id FROM hpms_core.clients WHERE name = 'Unassigned' LIMIT 1)
       SELECT COALESCE(e.client_id, ua.client_id)::INTEGER     AS client_id,
              COALESCE(c.name, 'Unassigned')                   AS client_name,
              EXTRACT(MONTH FROM s.pay_period)::INTEGER        AS period_month,
              EXTRACT(YEAR  FROM s.pay_period)::INTEGER        AS period_year,
              COUNT(s.salary_id)                               AS salary_count,
              COALESCE(SUM(s.gross_salary), 0)                 AS total_gross
       FROM hpms_core.salaries s
       JOIN hpms_core.employees e ON e.employee_id = s.employee_id
       LEFT JOIN hpms_core.clients c ON c.client_id = e.client_id
       LEFT JOIN ua ON e.client_id IS NULL
       WHERE s.period_id IS NULL
         AND (e.client_id IS NOT NULL OR ua.client_id IS NOT NULL)
       GROUP BY COALESCE(e.client_id, ua.client_id), COALESCE(c.name, 'Unassigned'),
                EXTRACT(MONTH FROM s.pay_period), EXTRACT(YEAR FROM s.pay_period)
       ORDER BY period_year DESC, period_month DESC, client_name`,
    );
    return rows;
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  async create({ clientId, periodMonth, periodYear, submittedBy }) {
    const { rows } = await pool.query(
      `INSERT INTO hpms_core.payroll_periods
         (client_id, period_month, period_year, status, submitted_by, submitted_at)
       VALUES ($1, $2, $3, 'SUBMITTED', $4, NOW())
       RETURNING *`,
      [clientId, periodMonth, periodYear, submittedBy],
    );
    return rows[0];
  }

  // Link salary records to the newly created period
  // When clientId is "Unassigned", match employees with client_id IS NULL
  async linkSalaries(periodId, clientId, month, year) {
    const { rowCount } = await pool.query(
      `UPDATE hpms_core.salaries s
       SET period_id = $1
       FROM hpms_core.employees e
       WHERE s.employee_id = e.employee_id
         AND (e.client_id = $2 OR (
           e.client_id IS NULL AND $2 IN (SELECT client_id FROM hpms_core.clients WHERE name = 'Unassigned')
         ))
         AND EXTRACT(MONTH FROM s.pay_period) = $3
         AND EXTRACT(YEAR  FROM s.pay_period) = $4
         AND s.period_id IS NULL`,
      [periodId, clientId, month, year],
    );
    return rowCount;
  }

  async updateHRReview({ periodId, reviewedBy, status, comments }) {
    const { rows } = await pool.query(
      `UPDATE hpms_core.payroll_periods
       SET status          = $2,
           hr_reviewed_by  = $3,
           hr_reviewed_at  = NOW(),
           hr_comments     = $4,
           updated_at      = NOW()
       WHERE period_id = $1
       RETURNING *`,
      [periodId, status, reviewedBy, comments],
    );
    return rows[0];
  }

  async updateMDReview({ periodId, reviewedBy, status, comments }) {
    const { rows } = await pool.query(
      `UPDATE hpms_core.payroll_periods
       SET status          = $2,
           md_reviewed_by  = $3,
           md_reviewed_at  = NOW(),
           md_comments     = $4,
           updated_at      = NOW()
       WHERE period_id = $1
       RETURNING *`,
      [periodId, status, reviewedBy, comments],
    );
    return rows[0];
  }

  /** Unsubmit a period: delete period (FKs auto-unlink salaries, cascade delete approval_history) */
  async unsubmitPeriod(periodId) {
    const { rows } = await pool.query('DELETE FROM hpms_core.payroll_periods WHERE period_id = $1 RETURNING *', [periodId]);
    return rows[0];
  }

  // Finance Officers for notification lookups
  async getFinanceOfficers() {
    const { rows } = await pool.query(
      `SELECT user_id, full_name, email
       FROM hpms_core.users
       WHERE role = 'FinanceOfficer' AND status = 'ACTIVE'`,
    );
    return rows;
  }

  async getHRManagers() {
    const { rows } = await pool.query(
      `SELECT user_id, full_name, email
       FROM hpms_core.users
       WHERE role = 'HR' AND status = 'ACTIVE'`,
    );
    return rows;
  }

  async getMDManagers() {
    const { rows } = await pool.query(
      `SELECT user_id, full_name, email
       FROM hpms_core.users
       WHERE role = 'ManagingDirector' AND status = 'ACTIVE'`,
    );
    return rows;
  }
}

export default new PayrollPeriodRepository();
