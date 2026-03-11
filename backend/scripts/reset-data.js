#!/usr/bin/env node
/**
 * Reset all employee and payroll data for a fresh start.
 * Keeps: users (login), clients
 * Deletes: employees, salaries, payroll periods, contracts, etc.
 *
 * Usage: node scripts/reset-data.js
 * Or:    npm run reset-data
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pool from '../src/config/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, 'reset-all-data.sql');

async function main() {
  const sql = readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✓ All data reset successfully. Stats start from zero.');
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
