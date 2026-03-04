
import { decryptField } from './src/services/encryptionService.js';
import pool from './src/config/database.js';

async function test() {
    try {
        const { rows } = await pool.query('SELECT salary_id, basic_salary_enc, payroll_snapshot_enc, gross_salary FROM hpms_core.salaries ORDER BY created_at DESC LIMIT 5');

        for (const row of rows) {
            console.log(`\n--- Salary ID: ${row.salary_id} ---`);
            console.log(`Gross Plain: ${row.gross_salary}`);
            console.log(`Basic Enc exists: ${!!row.basic_salary_enc}`);
            console.log(`Snapshot Enc exists: ${!!row.payroll_snapshot_enc}`);

            if (row.basic_salary_enc) {
                try {
                    const decrypted = decryptField('basic_salary_enc', row.basic_salary_enc);
                    console.log(`Decrypted Basic: "${decrypted}"`);
                } catch (e) {
                    console.log(`Decrypted Basic failed: ${e.message}`);
                }
            }

            if (row.payroll_snapshot_enc) {
                try {
                    const decrypted = decryptField('payroll_snapshot_enc', row.payroll_snapshot_enc);
                    console.log(`Decrypted Snapshot: ${decrypted.substring(0, 100)}...`);
                    const snap = JSON.parse(decrypted);
                    console.log(`Snapshot BasicSalary: ${snap.basicSalary}`);
                    console.log(`Snapshot Allowances:`, snap.allowances);
                } catch (e) {
                    console.log(`Decrypted Snapshot failed: ${e.message}`);
                }
            }
        }
    } catch (e) {
        console.error('Test error:', e);
    } finally {
        await pool.end();
    }
}

test();
