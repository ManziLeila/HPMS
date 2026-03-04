/**
 * run-migration.js  — run any .sql file against the DB
 * Usage: node scripts/run-migration.js migrations/002_contracts.sql
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sqlFile = process.argv[2];
if (!sqlFile) { console.error('Usage: node scripts/run-migration.js <file.sql>'); process.exit(1); }

const sql = fs.readFileSync(path.resolve(__dirname, '..', sqlFile), 'utf8');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    const client = await pool.connect();
    try {
        console.log(`Running: ${sqlFile}`);
        await client.query(sql);
        console.log('✅  Migration complete');
    } catch (e) {
        console.error('❌  Migration failed:', e.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
})();
