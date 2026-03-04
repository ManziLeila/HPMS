import pg from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get Database URL from environment or .env
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:keza123@localhost:5432/hpms_core';

const migrations = [
    'migrations/001_multi_level_approval_system.sql',
    'migrations/002_contracts.sql',
    'migrations/003_contract_templates.sql',
    'migrations/004_clients.sql',
    'migrations/005_client_contracts.sql',
];

const pool = new pg.Pool({ connectionString: DATABASE_URL });

function splitSQLStatements(sql) {
    const statements = [];
    let i = 0;
    let currentStatement = '';
    
    while (i < sql.length) {
        // Skip comments
        if (sql[i] === '-' && sql[i + 1] === '-') {
            // Line comment
            while (i < sql.length && sql[i] !== '\n') {
                i++;
            }
            currentStatement += '\n';
            i++;
            continue;
        }
        
        // Handle dollar quotes
        if (sql[i] === '$') {
            let j = i + 1;
            let tag = '';
            
            // Read tag (alphanumeric and underscore)
            while (j < sql.length && /[a-zA-Z0-9_]/.test(sql[j])) {
                tag += sql[j];
                j++;
            }
            
            // Check for closing $
            if (j < sql.length && sql[j] === '$') {
                const delimiter = '$' + tag + '$';
                currentStatement += delimiter;
                i = j + 1;
                
                // Find the closing delimiter
                while (i < sql.length) {
                    if (sql[i] === '$') {
                        // Check if this is our closing delimiter
                        let k = i + 1;
                        let endTag = '';
                        while (k < sql.length && /[a-zA-Z0-9_]/.test(sql[k])) {
                            endTag += sql[k];
                            k++;
                        }
                        if (k < sql.length && sql[k] === '$' && endTag === tag) {
                            currentStatement += sql.substring(i, k + 1);
                            i = k + 1;
                            break;
                        }
                    }
                    currentStatement += sql[i];
                    i++;
                }
                continue;
            }
        }
        
        // Handle semicolon as statement terminator
        if (sql[i] === ';') {
            currentStatement += ';';
            const trimmed = currentStatement.trim();
            if (trimmed.length > 0) {
                statements.push(trimmed);
            }
            currentStatement = '';
            i++;
            continue;
        }
        
        currentStatement += sql[i];
        i++;
    }
    
    // Add remaining statement if any
    const trimmed = currentStatement.trim();
    if (trimmed.length > 0) {
        statements.push(trimmed);
    }
    
    return statements;
}

async function runMigrations() {
    console.log('🚀 Starting database migrations...\n');
    
    for (const migrationFile of migrations) {
        try {
            const filePath = join(__dirname, migrationFile);
            const sql = readFileSync(filePath, 'utf8');
            
            console.log(`⏳ Running: ${migrationFile}`);
            const client = await pool.connect();
            
            const statements = splitSQLStatements(sql);
            console.log(`   Found ${statements.length} statements to execute`);
            
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement.trim().length > 0) {
                    await client.query(statement);
                }
            }
            
            client.release();
            console.log(`✅ ${migrationFile} completed\n`);
        } catch (err) {
            console.error(`❌ Error in ${migrationFile}`);
            console.error(`   ${err.message}`);
        }
    }
    
    console.log('✅ All migrations completed!');
    await pool.end();
}

runMigrations().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
