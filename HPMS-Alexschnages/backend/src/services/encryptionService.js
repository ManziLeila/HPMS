import crypto from 'node:crypto';
import config from '../config/env.js';

const MASTER_KEY = crypto.createHash('sha256').update(config.encryption.masterKey).digest();

const columnSalts = {
  account_number_enc: 'account-number',
  bank_account_enc: 'bank-account',
  basic_salary_enc: 'basic-salary',
  transport_allow_enc: 'transport-allowance',
  housing_allow_enc: 'housing-allowance',
  variable_allow_enc: 'variable-allowance',
  performance_allow_enc: 'performance-allowance',
  net_paid_enc: 'net-paid',
};

const deriveKey = (column) => {
  const label = columnSalts[column] || column;
  return crypto.createHash('sha256').update(`${label}-${MASTER_KEY.toString('hex')}`).digest();
};

export const encryptField = (column, plaintext) => {
  if (plaintext === undefined || plaintext === null) return null;
  const cipherKey = deriveKey(column);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', cipherKey, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
};

export const decryptField = (column, payload) => {
  if (!payload) return null;
  const buffer = Buffer.from(payload, 'base64');
  const iv = buffer.subarray(0, 16);
  const authTag = buffer.subarray(16, 32);
  const ciphertext = buffer.subarray(32);
  const cipherKey = deriveKey(column);
  const decipher = crypto.createDecipheriv('aes-256-gcm', cipherKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
};