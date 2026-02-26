import db from './db.js';

const contractRepo = {
    /* ── Create ────────────────────────────────────────────────── */
    async create({ employeeId, contractType, jobTitle, department, startDate, endDate, salaryGrade, grossSalary, notes, createdBy }) {
        const { rows } = await db.query(
            `INSERT INTO hpms_core.contracts
         (employee_id, contract_type, job_title, department, start_date, end_date,
          salary_grade, gross_salary, notes, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active')
       RETURNING *`,
            [employeeId, contractType, jobTitle, department, startDate, endDate || null,
                salaryGrade, grossSalary || 0, notes, createdBy]
        );
        return rows[0];
    },

    /* ── List all (with employee name) ─────────────────────────── */
    async list({ limit = 50, offset = 0, status }) {
        const conditions = status ? `WHERE c.status = $3` : '';
        const params = status ? [limit, offset, status] : [limit, offset];
        const { rows } = await db.query(
            `SELECT c.*, e.full_name, e.email, e.department AS emp_department
       FROM hpms_core.contracts c
       JOIN hpms_core.employees e ON e.employee_id = c.employee_id
       ${conditions}
       ORDER BY c.end_date ASC NULLS LAST, c.created_at DESC
       LIMIT $1 OFFSET $2`,
            params
        );
        return rows;
    },

    /* ── Find by ID ─────────────────────────────────────────────── */
    async findById(contractId) {
        const { rows } = await db.query(
            `SELECT c.*, e.full_name, e.email
       FROM hpms_core.contracts c
       JOIN hpms_core.employees e ON e.employee_id = c.employee_id
       WHERE c.contract_id = $1`,
            [contractId]
        );
        return rows[0];
    },

    /* ── Contracts for one employee ─────────────────────────────── */
    async findByEmployee(employeeId) {
        const { rows } = await db.query(
            `SELECT * FROM hpms_core.contracts
       WHERE employee_id = $1
       ORDER BY start_date DESC`,
            [employeeId]
        );
        return rows;
    },

    /* ── Expiring within N days ─────────────────────────────────── */
    async findExpiring(days = 30) {
        const { rows } = await db.query(
            `SELECT c.*, e.full_name, e.email, e.department AS emp_department
       FROM hpms_core.contracts c
       JOIN hpms_core.employees e ON e.employee_id = c.employee_id
       WHERE c.status = 'active'
         AND c.end_date IS NOT NULL
         AND c.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + $1 * INTERVAL '1 day')
       ORDER BY c.end_date ASC`,
            [days]
        );
        return rows;
    },

    /* ── Contracts that need notification (not yet notified) ────── */
    async findPendingNotification(days) {
        const col = days === 30 ? 'notified_30days' :
            days === 14 ? 'notified_14days' : 'notified_7days';
        const { rows } = await db.query(
            `SELECT c.*, e.full_name, e.email
       FROM hpms_core.contracts c
       JOIN hpms_core.employees e ON e.employee_id = c.employee_id
       WHERE c.status = 'active'
         AND c.end_date IS NOT NULL
         AND c.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + $1 * INTERVAL '1 day')
         AND c.${col} = false`,
            [days]
        );
        return rows;
    },

    /* ── Mark notification sent ─────────────────────────────────── */
    async markNotified(contractId, days) {
        const col = days === 30 ? 'notified_30days' :
            days === 14 ? 'notified_14days' : 'notified_7days';
        await db.query(
            `UPDATE hpms_core.contracts SET ${col} = true WHERE contract_id = $1`,
            [contractId]
        );
    },

    /* ── Update ─────────────────────────────────────────────────── */
    async update({ contractId, contractType, jobTitle, department, startDate, endDate, salaryGrade, grossSalary, notes, status }) {
        const { rows } = await db.query(
            `UPDATE hpms_core.contracts SET
         contract_type = COALESCE($2, contract_type),
         job_title     = COALESCE($3, job_title),
         department    = COALESCE($4, department),
         start_date    = COALESCE($5, start_date),
         end_date      = $6,
         salary_grade  = COALESCE($7, salary_grade),
         gross_salary  = COALESCE($8, gross_salary),
         notes         = COALESCE($9, notes),
         status        = COALESCE($10, status)
       WHERE contract_id = $1
       RETURNING *`,
            [contractId, contractType, jobTitle, department, startDate, endDate, salaryGrade, grossSalary, notes, status]
        );
        return rows[0];
    },

    /* ── Expire old contracts ───────────────────────────────────── */
    async expireOld() {
        const { rowCount } = await db.query(
            `UPDATE hpms_core.contracts SET status='expired'
       WHERE status='active' AND end_date < CURRENT_DATE`
        );
        return rowCount;
    },

    /* ── Stats for dashboard ────────────────────────────────────── */
    async stats() {
        const { rows } = await db.query(
            `SELECT
         COUNT(*) FILTER (WHERE status='active')                                                AS active,
         COUNT(*) FILTER (WHERE status='expired')                                               AS expired,
         COUNT(*) FILTER (WHERE status='active' AND end_date < CURRENT_DATE + INTERVAL '30 days'
                                              AND end_date >= CURRENT_DATE)                     AS expiring_30,
         COUNT(*) FILTER (WHERE status='active' AND end_date < CURRENT_DATE + INTERVAL '14 days'
                                              AND end_date >= CURRENT_DATE)                     AS expiring_14,
         COUNT(*) FILTER (WHERE contract_type = 'permanent')                                    AS permanent
       FROM hpms_core.contracts`
        );
        return rows[0];
    },
};

export default contractRepo;
