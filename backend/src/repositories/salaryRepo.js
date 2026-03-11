import db from './db.js';
import { encryptField } from '../services/encryptionService.js';

const salaryRepo = {
  async create({ employeeId, payPeriod, encryptedFields, payrollSnapshot, createdBy }) {
    const {
      basicSalaryEnc,
      transportAllowEnc,
      housingAllowEnc,
      variableAllowEnc,
      performanceAllowEnc,
      netPaidEnc,
    } = encryptedFields;

    const {
      grossSalary,
      rssbEePension,
      rssbEeMaternity,
      ramaInsuranceEmployee,
      medicalInsuranceEmployee,
      paye,
      totalEmployerContributions,
      frequency,
      advanceAmount,
    } = payrollSnapshot;

    // Encrypt the entire payroll snapshot for PDF generation
    const payrollSnapshotEnc = encryptField('payroll_snapshot_enc', JSON.stringify(payrollSnapshot));

    const { rows } = await db.query(
      `INSERT INTO hpms_core.salaries
        (employee_id, pay_period, basic_salary_enc, transport_allow_enc,
         housing_allow_enc, variable_allow_enc, performance_allow_enc,
         gross_salary, rssb_pension, rssb_maternity, rama_insurance,
         paye, net_paid_enc, total_employer_contrib, pay_frequency, advance_amount, 
         payroll_snapshot_enc, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING salary_id, pay_period, gross_salary, paye`,
      [
        employeeId,
        payPeriod,
        basicSalaryEnc,
        transportAllowEnc,
        housingAllowEnc,
        variableAllowEnc,
        performanceAllowEnc,
        grossSalary,
        rssbEePension,
        rssbEeMaternity,
        ramaInsuranceEmployee || medicalInsuranceEmployee,
        paye,
        netPaidEnc,
        totalEmployerContributions,
        frequency,
        advanceAmount || 0,
        payrollSnapshotEnc, // Add the encrypted payroll snapshot
        createdBy,
      ],
    );

    return rows[0];
  },

  async listByEmployee(employeeId) {
    const { rows } = await db.query(
      `SELECT salary_id, pay_period, pay_frequency, gross_salary, rssb_pension, paye, total_employer_contrib, hr_status, hr_comment
       FROM hpms_core.salaries
       WHERE employee_id = $1
       ORDER BY pay_period DESC`,
      [employeeId],
    );
    return rows;
  },

  async monthlyReport({ year, month, frequency }) {
    let query = `
      SELECT
          s.salary_id,
          s.pay_period,
          s.pay_frequency,
          s.gross_salary,
          s.paye,
          s.net_paid_enc,
          s.total_employer_contrib,
          e.employee_id,
          e.full_name,
          e.email,
          e.client_id,
          c.name AS client_name,
          s.hr_status,
          s.hr_comment,
          s.payroll_snapshot_enc
       FROM hpms_core.salaries s
       INNER JOIN hpms_core.employees e ON e.employee_id = s.employee_id
       LEFT JOIN hpms_core.clients c ON c.client_id = e.client_id
       WHERE EXTRACT(YEAR FROM s.pay_period) = $1
         AND EXTRACT(MONTH FROM s.pay_period) = $2
    `;
    const params = [year, month];

    if (frequency && frequency !== 'all') {
      query += ` AND s.pay_frequency = $3`;
      params.push(frequency);
    }

    query += ` ORDER BY COALESCE(c.name, 'zzz'), e.full_name`;

    const { rows } = await db.query(query, params);
    return rows;
  },

  async listRecent(limit = 10) {
    const { rows } = await db.query(
      `SELECT
          s.salary_id,
          s.pay_period,
          s.pay_frequency,
          s.gross_salary,
          s.paye,
          e.full_name,
          e.email,
          s.hr_status,
          s.hr_comment,
          s.payroll_snapshot_enc
       FROM hpms_core.salaries s
       INNER JOIN hpms_core.employees e ON e.employee_id = s.employee_id
       ORDER BY s.created_at DESC
       LIMIT $1`,
      [limit],
    );
    return rows;
  },

  async findByIdWithEmployee(salaryId) {
    const { rows } = await db.query(
      `SELECT s.*, 
              e.full_name, 
              e.email, 
              e.email_notifications_enabled,
              e.bank_name,
              e.account_holder_name,
              e.account_number_enc,
              e.role,
              e.department,
              e.date_of_joining,
              e.created_at AS employee_created_at
       FROM hpms_core.salaries s
       INNER JOIN hpms_core.employees e ON e.employee_id = s.employee_id
       WHERE s.salary_id = $1`,
      [salaryId],
    );
    return rows[0];
  },

  async findByPeriodWithEmployee({ year, month }) {
    const { rows } = await db.query(
      `SELECT s.*, 
              e.full_name, 
              e.email, 
              e.bank_name,
              e.account_holder_name,
              e.account_number_enc,
              e.role,
              e.department,
              e.date_of_joining
       FROM hpms_core.salaries s
       INNER JOIN hpms_core.employees e ON e.employee_id = s.employee_id
       WHERE EXTRACT(YEAR FROM s.pay_period) = $1
         AND EXTRACT(MONTH FROM s.pay_period) = $2
       ORDER BY e.full_name`,
      [year, month],
    );
    return rows;
  },

  async update({ salaryId, encryptedFields, payrollSnapshot }) {
    const {
      basicSalaryEnc,
      transportAllowEnc,
      housingAllowEnc,
      variableAllowEnc,
      performanceAllowEnc,
      netPaidEnc,
    } = encryptedFields;

    const {
      grossSalary,
      rssbEePension,
      rssbEeMaternity,
      ramaInsuranceEmployee,
      medicalInsuranceEmployee,
      paye,
      totalEmployerContributions,
      frequency,
      advanceAmount,
    } = payrollSnapshot;

    // Encrypt the entire payroll snapshot for PDF generation
    const payrollSnapshotEnc = encryptField('payroll_snapshot_enc', JSON.stringify(payrollSnapshot));

    const { rows } = await db.query(
      `UPDATE hpms_core.salaries
       SET basic_salary_enc = $2,
           transport_allow_enc = $3,
           housing_allow_enc = $4,
           variable_allow_enc = $5,
           performance_allow_enc = $6,
           gross_salary = $7,
           rssb_pension = $8,
           rssb_maternity = $9,
           rama_insurance = $10,
           paye = $11,
           net_paid_enc = $12,
           total_employer_contrib = $13,
           pay_frequency = $14,
           advance_amount = $15,
           payroll_snapshot_enc = $16,
           hr_status = 'PENDING',
           hr_comment = NULL,
           updated_at = NOW()
       WHERE salary_id = $1
       RETURNING *`,
      [
        salaryId,
        basicSalaryEnc,
        transportAllowEnc,
        housingAllowEnc,
        variableAllowEnc,
        performanceAllowEnc,
        grossSalary,
        rssbEePension,
        rssbEeMaternity,
        ramaInsuranceEmployee || medicalInsuranceEmployee,
        paye,
        netPaidEnc,
        totalEmployerContributions,
        frequency,
        advanceAmount || 0,
        payrollSnapshotEnc, // Add the encrypted payroll snapshot
      ],
    );
    return rows[0];
  },

  async delete(salaryId) {
    const { rows } = await db.query(
      `DELETE FROM hpms_core.salaries
       WHERE salary_id = $1
       RETURNING salary_id, employee_id, pay_period, gross_salary`,
      [salaryId],
    );
    return rows[0];
  },

  async deletePeriod({ year, month, frequency }) {
    let query = `
      DELETE FROM hpms_core.salaries
      WHERE EXTRACT(YEAR FROM pay_period) = $1
        AND EXTRACT(MONTH FROM pay_period) = $2
    `;
    const params = [year, month];

    if (frequency && frequency !== 'all') {
      query += ` AND pay_frequency = $3`;
      params.push(frequency);
    }

    query += ` RETURNING salary_id, employee_id, pay_period, gross_salary`;

    const { rows } = await db.query(query, params);
    return rows;
  },
  /**
   * Set HR review status on a single salary record.
   * Returns the updated row joined with employee info.
   */
  async hrReview({ salaryId, status, comment, reviewedBy }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.salaries
       SET hr_status      = $2,
           hr_comment     = $3,
           hr_reviewed_at = NOW(),
           hr_reviewed_by = $4,
           updated_at     = NOW()
       WHERE salary_id = $1
       RETURNING salary_id, employee_id, pay_period, gross_salary, hr_status, hr_comment`,
      [salaryId, status, comment || null, reviewedBy],
    );
    return rows[0];
  },

  /**
   * Set MD review status on a single salary record.
   * Applies when salary is HR_APPROVED, or when it belongs to an HR_APPROVED period
   * (period-level HR approval may not have set individual hr_status before bulk update).
   */
  async mdReview({ salaryId, status, comment, reviewedBy }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.salaries s
       SET md_status      = $2,
           md_comment     = $3,
           md_reviewed_at = NOW(),
           md_reviewed_by = $4,
           updated_at     = NOW()
       FROM hpms_core.payroll_periods pp
       WHERE s.salary_id = $1
         AND s.period_id = pp.period_id
         AND pp.status = 'HR_APPROVED'
         AND (s.hr_status = 'HR_APPROVED' OR s.hr_status = 'PENDING')
       RETURNING s.salary_id, s.employee_id, s.pay_period, s.gross_salary, s.hr_status, s.md_status, s.md_comment`,
      [salaryId, status, comment || null, reviewedBy],
    );
    return rows[0];
  },

  /**
   * Bulk set hr_status = 'HR_APPROVED' for all PENDING salaries in a payroll period.
   * Called when HR approves the period at the period level (not per-employee).
   */
  async bulkHrApproveByPeriod(periodId, reviewedBy) {
    const { rowCount } = await db.query(
      `UPDATE hpms_core.salaries
       SET hr_status      = 'HR_APPROVED',
           hr_reviewed_at = NOW(),
           hr_reviewed_by = $2,
           updated_at     = NOW()
       WHERE period_id = $1
         AND hr_status = 'PENDING'`,
      [periodId, reviewedBy],
    );
    return rowCount;
  },

  /**
   * Set all salaries in a period to SENT_TO_BANK when Finance marks the period as sent to bank.
   * Payslip emails are only allowed after this (so email confirms payment was sent).
   */
  async bulkSetSentToBankByPeriod(periodId) {
    const { rowCount } = await db.query(
      `UPDATE hpms_core.salaries
       SET hr_status = 'SENT_TO_BANK', updated_at = NOW()
       WHERE period_id = $1`,
      [periodId],
    );
    return rowCount;
  },

  /**
   * Bulk-approve all PENDING salary records for a period.
   * Returns the updated rows joined with employee info for notifications.
   */
  async bulkHrReview({ year, month, status, comment, reviewedBy }) {
    const { rows } = await db.query(
      `UPDATE hpms_core.salaries s
       SET hr_status      = $3,
           hr_comment     = $4,
           hr_reviewed_at = NOW(),
           hr_reviewed_by = $5,
           updated_at     = NOW()
       FROM hpms_core.employees e
       WHERE s.employee_id = e.employee_id
         AND EXTRACT(YEAR  FROM s.pay_period) = $1
         AND EXTRACT(MONTH FROM s.pay_period) = $2
         AND s.hr_status = 'PENDING'
       RETURNING s.salary_id, s.employee_id, s.pay_period, s.gross_salary,
                 s.hr_status, e.full_name, e.email, e.created_by`,
      [year, month, status, comment || null, reviewedBy],
    );
    return rows;
  },

  /**
   * Who created a given salary (the Finance Officer's employee_id).
   */
  async getCreatedBy(salaryId) {
    const { rows } = await db.query(
      `SELECT s.created_by, e.full_name, e.employee_id
       FROM hpms_core.salaries s
       LEFT JOIN hpms_core.employees e ON e.employee_id = s.created_by
       WHERE s.salary_id = $1`,
      [salaryId],
    );
    return rows[0];
  },
};

export default salaryRepo;

