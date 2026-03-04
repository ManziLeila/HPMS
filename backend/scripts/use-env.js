#!/usr/bin/env node
/**
 * Switch backend/.env to use shared or local database.
 * Usage: node scripts/use-env.js shared | node scripts/use-env.js local
 * Run from backend/ directory.
 */

import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const mode = process.argv[2];
if (!mode || !['shared', 'local'].includes(mode)) {
  console.error('Usage: node scripts/use-env.js <shared|local>');
  process.exit(1);
}

const source = join(root, `.env.${mode}`);
const target = join(root, '.env');

if (!existsSync(source)) {
  console.error(`Missing ${source}. Create it with DATABASE_URL for ${mode} DB.`);
  process.exit(1);
}

copyFileSync(source, target);
console.log(`Switched to ${mode} DB (.env updated from .env.${mode}).`);
