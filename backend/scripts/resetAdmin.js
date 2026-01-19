import '../src/config/env.js';
import { pool } from '../src/config/database.js';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { encryptField } from '../src/services/encryptionService.js';

const [emailArg, passwordArg] = process.argv.slice(2);

const ADMIN_EMAIL = (emailArg || 'sysadmin@hcsolutions.com').toLowerCase();
const ADMIN_PASSWORD = passwordArg || 'ChangeMeNow!2025';

const run = async () => {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const mfaSecret = authenticator.generateSecret();
  const encryptedBank = encryptField('bank_account_enc', 'PENDING');

  const query = `
    INSERT INTO hpms_core.employees
      (full_name, email, bank_account_enc, role, password_hash, mfa_secret)
    VALUES
      ($1, $2, $3, 'Admin', $4, $5)
    ON CONFLICT (email) DO UPDATE
      SET
        full_name = EXCLUDED.full_name,
        role = 'Admin',
        password_hash = EXCLUDED.password_hash,
        mfa_secret = EXCLUDED.mfa_secret
    RETURNING employee_id, email, role, created_at;
  `;

  const values = ['System Administrator', ADMIN_EMAIL, encryptedBank, passwordHash, mfaSecret];

  const { rows } = await pool.query(query, values);
  const admin = rows[0];

  console.log('\n✅ Admin credentials reset');
  console.log(`  Email:     ${admin.email}`);
  console.log(`  Password:  ${ADMIN_PASSWORD}`);
  console.log(`  MFA Secret: ${mfaSecret}`);
  console.log('\nAdd this secret to your authenticator app to generate the 6-digit MFA codes.\n');
};

run()
  .catch((error) => {
    console.error('Failed to reset admin credentials:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

