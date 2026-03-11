/**
 * run-fix-scripts.mjs
 * Runs fix-notifications-sequence.sql and fix-approved-salaries-status.sql
 * Uses DATABASE_URL from .env
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in backend/.env');
    process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        // 1. Fix notifications sequence
        console.log('⏳ Running fix-notifications-sequence.sql…');
        const seqSql = readFileSync(join(__dirname, 'scripts', 'fix-notifications-sequence.sql'), 'utf8');
        const seqStmt = seqSql.replace(/--.*$/gm, '').replace(/\n/g, ' ').trim();
        if (seqStmt) await client.query(seqStmt);
        console.log('✅ Notifications sequence fixed');

        // 2. Fix approved salaries status
        console.log('⏳ Running fix-approved-salaries-status.sql…');
        await client.query('BEGIN');
        await client.query(`
            UPDATE hpms_core.salaries s
            SET hr_status = 'HR_APPROVED', updated_at = NOW()
            FROM hpms_core.payroll_periods pp
            WHERE s.period_id = pp.period_id
              AND pp.status IN ('HR_APPROVED', 'MD_APPROVED', 'SENT_TO_BANK')
              AND s.hr_status = 'PENDING'
        `);
        await client.query(`
            UPDATE hpms_core.salaries s
            SET md_status = 'MD_APPROVED', updated_at = NOW()
            FROM hpms_core.payroll_periods pp
            WHERE s.period_id = pp.period_id
              AND pp.status IN ('MD_APPROVED', 'SENT_TO_BANK')
              AND (s.md_status IS NULL OR s.md_status = 'PENDING')
        `);
        await client.query('COMMIT');
        console.log('✅ Approved salaries status fixed');

        console.log('\n✅ All fix scripts completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('❌ Failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
