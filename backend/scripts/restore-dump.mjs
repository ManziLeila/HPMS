/**
 * restore-dump.mjs
 * Restores database from hpms_core_backup.sql (from your colleague).
 * Place hpms_core_backup.sql in the backend folder, then run:
 *   node scripts/restore-dump.mjs
 */
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
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

const dumpPath = join(__dirname, '..', 'hpms_core_backup.sql');
if (!existsSync(dumpPath)) {
    console.error('❌ hpms_core_backup.sql not found in backend folder.');
    console.error('   Get it from your colleague and place it in the backend folder.');
    process.exit(1);
}

function splitSQLStatements(sql) {
    const statements = [];
    let i = 0;
    let current = '';
    while (i < sql.length) {
        if (sql[i] === '-' && sql[i + 1] === '-') {
            while (i < sql.length && sql[i] !== '\n') i++;
            i++;
            continue;
        }
        if (sql[i] === '$') {
            let j = i + 1;
            let tag = '';
            while (j < sql.length && /[a-zA-Z0-9_]/.test(sql[j])) { tag += sql[j]; j++; }
            if (j < sql.length && sql[j] === '$') {
                const delim = '$' + tag + '$';
                current += delim;
                i = j + 1;
                while (i < sql.length) {
                    if (sql[i] === '$') {
                        let k = i + 1;
                        let endTag = '';
                        while (k < sql.length && /[a-zA-Z0-9_]/.test(sql[k])) { endTag += sql[k]; k++; }
                        if (k < sql.length && sql[k] === '$' && endTag === tag) {
                            current += sql.substring(i, k + 1);
                            i = k + 1;
                            break;
                        }
                    }
                    current += sql[i];
                    i++;
                }
                continue;
            }
        }
        if (sql[i] === ';') {
            current += ';';
            const t = current.trim();
            if (t.length > 0 && !t.startsWith('--')) statements.push(t);
            current = '';
            i++;
            continue;
        }
        current += sql[i];
        i++;
    }
    const t = current.trim();
    if (t.length > 0 && !t.startsWith('--')) statements.push(t);
    return statements;
}

async function main() {
    const sql = readFileSync(dumpPath, 'utf8');
    const statements = splitSQLStatements(sql);
    console.log(`⏳ Restoring ${statements.length} statements from hpms_core_backup.sql...`);

    const pool = new pg.Pool({ connectionString: DATABASE_URL });
    const client = await pool.connect();

    let done = 0;
    for (const stmt of statements) {
        try {
            await client.query(stmt);
            done++;
            if (done % 50 === 0) process.stdout.write('.');
        } catch (e) {
            if (e.message.includes('does not exist')) continue; // DROP IF EXISTS
            console.error('\n❌', e.message);
            client.release();
            await pool.end();
            process.exit(1);
        }
    }

    client.release();
    await pool.end();
    console.log('\n✅ Database restored successfully!');
    console.log('   Run fix scripts: node run-fix-scripts.mjs');
}

main().catch(e => {
    console.error('❌', e.message);
    process.exit(1);
});
