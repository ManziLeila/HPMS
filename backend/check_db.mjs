
import pg from 'pg';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

async function run() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='hpms_core' AND table_name='salaries'");
        console.log('Columns:', r.rows.map(x => x.column_name).sort().join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
