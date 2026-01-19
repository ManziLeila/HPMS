import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  loadEnv({ path: envPath });
  console.warn('✓ Loaded environment variables from .env');
} else {
  console.warn('⚠ No .env file found, falling back to process env');
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .default('4000')
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),
  DATABASE_URL: z
    .string()
    .trim()
    .min(1, 'DATABASE_URL is required')
    .default('postgres://postgres:postgres@localhost:5432/hpms_core'),
  DATABASE_SSL: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  JWT_SECRET: z
    .string()
    .trim()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .optional(),
  JWT_PUBLIC_KEY_PATH: z.string().trim().optional(),
  JWT_PRIVATE_KEY_PATH: z.string().trim().optional(),
  MFA_ISSUER: z.string().trim().default('HC Solutions Payroll'),
  MFA_REQUIRED: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  ENCRYPTION_MASTER_KEY: z
    .string()
    .trim()
    .min(32, 'ENCRYPTION_MASTER_KEY must be at least 32 characters'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGINS: z.string().trim().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('\n❌ Invalid environment variables:\n');
  const errors = parsed.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([field, messages]) => {
    console.error(`  ${field}:`);
    messages?.forEach((message) => console.error(`    - ${message}`));
  });
  console.error('\n💡 Tips:');
  console.error('  - Ensure JWT_SECRET and ENCRYPTION_MASTER_KEY are at least 32 characters.');
  console.error('  - Check for stray spaces or quotes in .env.');
  console.error('');
  throw new Error('Failed to parse environment variables');
}

const env = parsed.data;

const readKey = (filePath) => {
  if (!filePath) return undefined;
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Key file not found at ${absolute}`);
  }
  return fs.readFileSync(absolute, 'utf8').trim();
};

const jwtConfig = {
  publicKey: readKey(env.JWT_PUBLIC_KEY_PATH),
  privateKey: readKey(env.JWT_PRIVATE_KEY_PATH),
  secret: env.JWT_SECRET,
};

if (!jwtConfig.publicKey && !jwtConfig.secret) {
  console.error('\n❌ JWT configuration error: provide JWT_SECRET or key files.\n');
  throw new Error('Invalid JWT configuration');
}

const corsOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);

const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  databaseSsl: env.DATABASE_SSL,
  database: {
    url: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
  },
  jwt: jwtConfig,
  mfa: { issuer: env.MFA_ISSUER },
  auth: {
    mfaRequired: env.MFA_REQUIRED,
    mfaIssuer: env.MFA_ISSUER,
  },
  encryption: { masterKey: env.ENCRYPTION_MASTER_KEY },
  cors: { origins: corsOrigins },
  logging: { level: env.LOG_LEVEL },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
};

if (config.isDevelopment) {
  console.warn('\n📋 Configuration loaded:');
  console.warn(`  Environment: ${config.nodeEnv}`);
  console.warn(`  Port: ${config.port}`);
  console.warn(`  Database: ${config.database.url.replace(/:[^:@]+@/, ':***@')}`);
  console.warn(`  JWT: ${jwtConfig.secret ? 'Secret-based' : 'Key-based'}`);
  console.warn(`  CORS Origins: ${corsOrigins.join(', ')}`);
  console.warn(`  Log Level: ${config.logging.level}\n`);
}

export default config;