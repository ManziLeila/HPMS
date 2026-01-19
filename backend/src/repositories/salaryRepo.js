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
      `SELECT salary_id, pay_period, pay_frequency, gross_salary, rssb_pension, paye, total_employer_contrib
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
          s.total_employer_contrib,
          e.employee_id,
          e.full_name,
          e.email
       FROM hpms_core.salaries s
       INNER JOIN hpms_core.employees e ON e.employee_id = s.employee_id
       WHERE EXTRACT(YEAR FROM s.pay_period) = $1
         AND EXTRACT(MONTH FROM s.pay_period) = $2
    `;
    const params = [year, month];

    if (frequency && frequency !== 'all') {
      query += ` AND s.pay_frequency = $3`;
      params.push(frequency);
    }

    query += ` ORDER BY s.pay_period DESC, e.full_name`;

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
          e.email
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
              e.account_number_enc
       FROM hpms_core.salaries s
       INNER JOIN hpms_core.employees e ON e.employee_id = s.employee_id
       WHERE s.salary_id = $1`,
      [salaryId],
    );
    return rows[0];
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
           updated_at = NOW()
       WHERE salary_id = $1
       RETURNING salary_id, pay_period, gross_salary, paye, updated_at`,
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
};

export default salaryRepo;

