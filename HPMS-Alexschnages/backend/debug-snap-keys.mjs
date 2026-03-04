
import { decryptField } from './src/services/encryptionService.js';
import pool from './src/config/database.js';

async function test() {
    try {
        const { rows } = await pool.query('SELECT salary_id, payroll_snapshot_enc FROM hpms_core.salaries WHERE payroll_snapshot_enc IS NOT NULL ORDER BY created_at DESC LIMIT 1');
        if (rows.length === 0) { console.log('No records with snapshot found'); return; }

        const row = rows[0];
        const decrypted = decryptField('payroll_snapshot_enc', row.payroll_snapshot_enc);
        const snap = JSON.parse(decrypted);
        console.log('SNAPSHOT_KEYS:', Object.keys(snap).join(', '));
        if (snap.allowances) console.log('ALLOWANCE_KEYS:', Object.keys(snap.allowances).join(', '));
        console.log('VALUES:', {
            basicSalary: snap.basicSalary,
            baseSalary: snap.baseSalary,
            transport: snap.allowances?.transport,
            transportAllowance: snap.allowances?.transportAllowance
        });

    } catch (e) {
        console.error('Test error:', e.message);
    } finally {
        await pool.end();
    }
}
test();
