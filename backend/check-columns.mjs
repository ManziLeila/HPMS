import './src/config/database.js';
import pool from './src/config/database.js';

const r = await pool.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_schema='hpms_core' AND table_name='salaries' 
  ORDER BY column_name
`);
console.log('Salary columns:', r.rows.map(x => x.column_name).join(', '));
await pool.end();
