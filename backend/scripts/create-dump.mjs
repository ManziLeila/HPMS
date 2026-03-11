/**
 * create-dump.mjs
 * Creates a full database dump (schema + data) for sharing with colleagues.
 * Uses pg_dump. Output: hpms_core_backup.sql in backend folder
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in backend/.env');
    process.exit(1);
}

let host = 'localhost', port = 5432, user = 'postgres', password = '', database = 'hpms_core';
try {
    const u = new URL(DATABASE_URL);
    host = u.hostname || host;
    port = parseInt(u.port || '5432', 10);
    user = u.username || user;
    password = u.password || '';
    database = u.pathname?.replace(/^\//, '') || database;
} catch (_) {}

const outputPath = join(__dirname, '..', 'hpms_core_backup.sql');

function findPgDump() {
    const paths = [
        'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
        'pg_dump',
    ];
    for (const p of paths) {
        try {
            if (p === 'pg_dump') {
                execSync('pg_dump --version', { stdio: 'ignore' });
                return 'pg_dump';
            }
            if (existsSync(p)) return p;
        } catch (_) {}
    }
    return null;
}

const pgDump = findPgDump();
if (!pgDump) {
    console.error('❌ pg_dump not found. Install PostgreSQL or add it to PATH.');
    console.error('\nManual command (run in terminal):');
    console.error(`  set PGPASSWORD=your_password`);
    console.error(`  "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe" -h ${host} -p ${port} -U ${user} -d ${database} --clean --if-exists -f hpms_core_backup.sql`);
    process.exit(1);
}

const env = { ...process.env };
if (password) env.PGPASSWORD = password;

console.log('⏳ Creating database dump...');
execSync(`"${pgDump}" -h ${host} -p ${port} -U ${user} -d ${database} --clean --if-exists -f "${outputPath}"`, {
    stdio: 'inherit',
    env,
    cwd: join(__dirname, '..'),
});
console.log('✅ Dump saved to:', outputPath);
console.log('\n📤 Share hpms_core_backup.sql with your colleague.');
console.log('   They run: node scripts/restore-dump.mjs');
