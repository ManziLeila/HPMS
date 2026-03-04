/**
 * seed-role-users.js
 * Run with: node seed-role-users.js
 * Creates / resets the 5 role-based login accounts
 */
import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SCHEMA = 'hpms_core';
const PASSWORD = 'Admin123!';
const SALT_ROUNDS = 12;

const USERS = [
    {
        full_name: 'Finance Officer',
        email: 'finance@hcsolutions.com',
        role: 'FinanceOfficer',
        department: 'Finance Department',
    },
    {
        full_name: 'HR Manager',
        email: 'hr@hcsolutions.com',
        role: 'HR',
        department: 'Human Resources',
    },
    {
        full_name: 'Managing Director',
        email: 'md@hcsolutions.com',
        role: 'ManagingDirector',
        department: 'Executive Office',
    },
    {
        full_name: 'System Administrator',
        email: 'admin@hcsolutions.com',
        role: 'Admin',
        department: 'IT',
    },
    {
        full_name: 'Employee Demo',
        email: 'employee@hcsolutions.com',
        role: 'Employee',
        department: 'Operations',
    },
];

async function seed() {
    const client = await pool.connect();
    try {
        console.log('🔑  Hashing password…');
        const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

        console.log('✨  Upserting role accounts (update if exists, insert if new)…');
        for (const u of USERS) {
            await client.query(
                `INSERT INTO ${SCHEMA}.employees
           (full_name, email, role, department, password_hash, mfa_secret)
         VALUES ($1, $2, $3, $4, $5, NULL)
         ON CONFLICT (email) DO UPDATE SET
           full_name     = EXCLUDED.full_name,
           role          = EXCLUDED.role,
           department    = EXCLUDED.department,
           password_hash = EXCLUDED.password_hash`,
                [u.full_name, u.email, u.role, u.department, hash]
            );
            console.log(`   ✓ ${u.role.padEnd(20)} → ${u.email}`);
        }

        console.log('\n✅  Done! All role accounts are ready.');
        console.log(`    Password for every account: ${PASSWORD}`);
        console.log('\n    Role → Landing page:\n');
        console.log('    FinanceOfficer  → /dashboard');
        console.log('    HR              → /hr-review');
        console.log('    ManagingDirector→ /md-approval');
        console.log('    Admin           → /dashboard');
        console.log('    Employee        → /dashboard');
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch((err) => {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
});
