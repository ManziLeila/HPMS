/**
 * Create a Tech Admin user (Management Console only).
 * Run from backend folder: node scripts/create-tech-admin.mjs
 * Uses backend/.env for DATABASE_URL.
 *
 * If the user already exists (same email), the script updates password and MFA secret.
 */
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL. Create backend/.env or set DATABASE_URL.');
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL });

const TECH_EMAIL = 'tech@hcsolutions.com';
const TECH_FULL_NAME = 'Tech Admin';
const TECH_DEPARTMENT = 'IT';
const ROLE = 'TechAdmin';

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = randomBytes(length);
  let s = '';
  for (let i = 0; i < length; i++) s += chars[bytes[i] % chars.length];
  return s;
}

async function ensureTechAdminRole(client) {
  const { rows } = await client.query(
    `SELECT 1 FROM pg_enum e
     JOIN pg_type t ON e.enumtypid = t.oid
     JOIN pg_namespace n ON t.typnamespace = n.oid
     WHERE n.nspname = 'hpms_core' AND t.typname = 'user_role' AND e.enumlabel = 'TechAdmin'`
  );
  if (rows.length === 0) {
    await client.query(`ALTER TYPE hpms_core.user_role ADD VALUE 'TechAdmin'`);
  }
}

async function run() {
  const client = await pool.connect();
  try {
    await ensureTechAdminRole(client);

    const existing = await client.query(
      'SELECT user_id, full_name, email, role FROM hpms_core.users WHERE email = $1',
      [TECH_EMAIL]
    );

    const password = generatePassword(12);
    const passwordHash = await bcrypt.hash(password, 12);
    const mfaSecret = authenticator.generateSecret();

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE hpms_core.users
         SET full_name = $1, role = $2, department = $3, password_hash = $4, mfa_secret = $5, updated_at = NOW()
         WHERE email = $6`,
        [TECH_FULL_NAME, ROLE, TECH_DEPARTMENT, passwordHash, mfaSecret, TECH_EMAIL]
      );
      console.log('Tech Admin user already existed; password and MFA secret have been reset.\n');
    } else {
      await client.query(
        `INSERT INTO hpms_core.users (full_name, email, password_hash, mfa_secret, role, department)
         VALUES ($1, $2, $3, $4, $5::hpms_core.user_role, $6)`,
        [TECH_FULL_NAME, TECH_EMAIL, passwordHash, mfaSecret, ROLE, TECH_DEPARTMENT]
      );
      console.log('Tech Admin user created.\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TECH ADMIN LOGIN CREDENTIALS — save these securely');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Email:    ', TECH_EMAIL);
    console.log('  Password: ', password);
    console.log('  MFA secret (for authenticator app):', mfaSecret);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\nLog in at your app URL, then add the MFA secret to Google Authenticator or Authy.');
    console.log('This user only sees the Management Console in the sidebar.\n');
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code === '22P02') {
      console.error('\nIf you see "invalid input value for enum", run the migration first:');
      console.error('  psql $DATABASE_URL -f migrations/014_add_tech_admin_role.sql');
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
