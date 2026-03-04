
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        await pool.query('ALTER TABLE hpms_core.salaries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log('Column updated_at added to salaries table');
    } catch (e) {
        console.error('Migration failed:', e.message);
    } finally {
        await pool.end();
    }
}

run();
