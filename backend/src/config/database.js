import pg from 'pg';
import config from './env.js';
import logger from './logger.js';

const { Pool } = pg;

// Parse the DATABASE_URL
const parseConnectionString = (url) => {
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port, 10) || 5432,
      database: urlObj.pathname.slice(1),
      user: urlObj.username,
      password: urlObj.password,
    };
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error);
    throw new Error('Invalid DATABASE_URL format');
  }
};

const connectionConfig = parseConnectionString(config.database.url);

// CRITICAL FIX: Ensure all values are proper strings
const poolConfig = {
  host: String(connectionConfig.host || 'localhost'),
  port: Number(connectionConfig.port) || 5432,
  database: String(connectionConfig.database || ''),
  user: String(connectionConfig.user || ''),
  password: String(connectionConfig.password || ''), // THIS IS THE KEY FIX
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Log sanitized config in development
if (config.isDevelopment) {
  logger.info(
    {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
      passwordMask: '*'.repeat(poolConfig.password.length),
      passwordType: typeof poolConfig.password,
      ssl: Boolean(poolConfig.ssl),
    },
    'Database pool configuration',
  );
}

const pool = new Pool(poolConfig);

// Connection event handlers
pool.on('connect', () => {
  if (config.isDevelopment) {
    logger.debug('New database connection established');
  }
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

// Test connection function
export const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version()');
    logger.info(
      {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version.split(',')[0],
      },
      'Database connection test successful',
    );
    return true;
  } catch (error) {
    logger.error(
      {
        message: error.message,
        code: error.code,
      },
      'Database connection test failed',
    );
    if (error.code === 'ECONNREFUSED') {
      logger.warn('Is PostgreSQL running?');
    } else if (error.code === '28P01') {
      logger.warn('Check your database credentials');
    }
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

export { pool };
export default pool;