/**
 * Delete payroll employees (role='Employee') that may not appear in the UI.
 * Run: node scripts/delete-orphan-employees.mjs
 * Uses DATABASE_URL from backend/.env
 */
import pg from 'pg';
import { config as loadEnv } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT employee_id, full_name, email, role, status
       FROM hpms_core.employees
       WHERE role = 'Employee' AND (status = 'ACTIVE' OR status IS NULL)
       ORDER BY employee_id`
    );

    if (rows.length === 0) {
      console.log('No payroll employees (role=Employee) found. Dashboard count should be 0.');
      return;
    }

    console.log(`Found ${rows.length} payroll employee(s):`);
    rows.forEach((r) => console.log(`  - ${r.employee_id}: ${r.full_name} (${r.email || 'no email'})`));

    for (const emp of rows) {
      await client.query('DELETE FROM hpms_core.salaries WHERE employee_id = $1', [emp.employee_id]);
      await client.query('DELETE FROM hpms_core.contracts WHERE employee_id = $1', [emp.employee_id]);
      await client.query(
        "DELETE FROM hpms_core.notifications WHERE user_type = 'employee' AND user_id = $1",
        [emp.employee_id]
      );
      await client.query('DELETE FROM hpms_core.employees WHERE employee_id = $1', [emp.employee_id]);
      console.log(`  Deleted: ${emp.full_name}`);
    }

    console.log(`\nDone. Removed ${rows.length} employee(s). Refresh the dashboard.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
