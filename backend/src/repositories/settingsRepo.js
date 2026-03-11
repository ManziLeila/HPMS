import pool from '../config/database.js';

const TABLE = 'hpms_core.system_settings';

const settingsRepo = {
  async ensureTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        key   VARCHAR(120) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  },

  async get(key) {
    const { rows } = await pool.query(`SELECT value FROM ${TABLE} WHERE key = $1`, [key]);
    return rows[0]?.value ?? null;
  },

  async getMany(keys) {
    const { rows } = await pool.query(
      `SELECT key, value FROM ${TABLE} WHERE key = ANY($1)`,
      [keys],
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },

  async set(key, value) {
    await pool.query(
      `INSERT INTO ${TABLE} (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value],
    );
  },

  async setMany(entries) {
    for (const [key, value] of Object.entries(entries)) {
      await this.set(key, value);
    }
  },
};

// Create table on first import
settingsRepo.ensureTable().catch(() => {});

export default settingsRepo;
