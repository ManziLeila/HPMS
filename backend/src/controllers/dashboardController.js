import db from '../repositories/db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    // Count active payroll employees (role=Employee); system users are in hpms_core.users
    const employeeCount = await db.query(
      `SELECT COUNT(*) as count FROM hpms_core.employees
       WHERE role = 'Employee'
         AND (status = 'ACTIVE' OR status IS NULL)`,
    );

    // Get current month payroll stats
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    const payrollStats = await db.query(
      `SELECT
          COUNT(*) as payroll_runs,
          COALESCE(SUM(gross_salary), 0) as total_gross,
          COALESCE(SUM(total_employer_contrib), 0) as total_employer_cost,
          COALESCE(SUM(paye), 0) as total_paye
       FROM hpms_core.salaries
       WHERE EXTRACT(YEAR FROM pay_period) = $1
         AND EXTRACT(MONTH FROM pay_period) = $2`,
      [currentYear, currentMonth],
    );

    // Get all-time data for chart
    const chartData = await db.query(
      `SELECT
          DATE_TRUNC('month', pay_period) as month,
          COALESCE(SUM(gross_salary), 0) as payroll,
          COALESCE(SUM(gross_salary - paye), 0) as net
       FROM hpms_core.salaries
       GROUP BY DATE_TRUNC('month', pay_period)
       ORDER BY month ASC`,
    );

    const stats = payrollStats.rows[0] || {
      payroll_runs: 0,
      total_gross: 0,
      total_employer_cost: 0,
      total_paye: 0,
    };

    res.json({
      totalEmployees: Number(employeeCount.rows[0]?.count || 0),
      monthlyPayrollCost: Number(stats.total_employer_cost || 0),
      monthlyGross: Number(stats.total_gross || 0),
      monthlyPaye: Number(stats.total_paye || 0),
      payrollRuns: Number(stats.payroll_runs || 0),
      chartData: chartData.rows.map((row) => ({
        month: new Date(row.month).toLocaleDateString('en-US', { month: 'short' }),
        payroll: Number(row.payroll || 0),
        net: Number(row.net || 0),
      })),
    });
  } catch (error) {
    next(error);
  }
};

