/**
 * run-migration.mjs
 * ─────────────────
 * Runs the HR salary review migration using the same DB connection
 * as the main backend. Safe to run multiple times (ADD COLUMN IF NOT EXISTS).
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌  DATABASE_URL not found in backend/.env');
    process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

const sql = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'scripts', 'migration-hr-salary-review.sql'),
    'utf8'
);

try {
    console.log('⏳  Running migration: migration-hr-salary-review.sql …');
    const client = await pool.connect();
    await client.query(sql);
    client.release();
    console.log('✅  Migration completed successfully!');
    console.log('    Columns added (or already existed):');
    console.log('      • hr_status       VARCHAR(20) DEFAULT \'PENDING\'');
    console.log('      • hr_comment      TEXT');
    console.log('      • hr_reviewed_at  TIMESTAMPTZ');
    console.log('      • hr_reviewed_by  UUID');
} catch (err) {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
} finally {
    await pool.end();
}
