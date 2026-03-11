/**
 * Seed one user of each staff role (FinanceOfficer, HR, ManagingDirector) into hpms_core.users.
 * Use these to log in after migrations. Run once after 006.
 *
 * Usage: node scripts/seed-users.js
 * Password for all: Admin123!
 */
import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const PASSWORD = 'Admin123!';
const SALT_ROUNDS = 12;

const STAFF = [
  { full_name: 'Finance Officer', email: 'finance@hcsolutions.com', role: 'FinanceOfficer', department: 'Finance' },
  { full_name: 'HR Manager', email: 'hr@hcsolutions.com', role: 'HR', department: 'Human Resources' },
  { full_name: 'Managing Director', email: 'md@hcsolutions.com', role: 'ManagingDirector', department: 'Executive' },
  { full_name: 'System Admin', email: 'admin@hcsolutions.com', role: 'Admin', department: 'Management Console' },
];

async function seed() {
  const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  const client = await pool.connect();
  try {
    for (const u of STAFF) {
      await client.query(
        `INSERT INTO hpms_core.users (full_name, email, password_hash, mfa_secret, role, department, status, mfa_enabled)
         VALUES ($1, $2, $3, NULL, $4::hpms_core.user_role, $5, 'ACTIVE', true)
         ON CONFLICT (email) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           department = EXCLUDED.department,
           status = 'ACTIVE',
           updated_at = NOW()`,
        [u.full_name, u.email, hash, u.role, u.department]
      );
      console.log(`  ✓ ${u.role.padEnd(18)} ${u.email}`);
    }
    console.log('\n✅ Staff users ready. Password for all: ' + PASSWORD);
    console.log('   Log in at the frontend with any of the emails above.\n');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
