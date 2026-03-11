import pool from './src/config/database.js';

async function check() {
  try {
    const r = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema='hpms_core' AND table_name='notifications' 
      ORDER BY ordinal_position
    `);
    console.log('notifications columns:', r.rows.map(x => x.column_name).join(', '));
    
    const r2 = await pool.query(`
      SELECT n.* FROM hpms_core.notifications n LIMIT 1
    `);
    console.log('sample row:', r2.rows[0] ? Object.keys(r2.rows[0]) : 'empty');
    
    const r3 = await pool.query(`
      SELECT n.*, pp.period_month, c.name as batch_name
      FROM hpms_core.notifications n
      LEFT JOIN hpms_core.payroll_periods pp ON n.batch_id = pp.period_id
      LEFT JOIN hpms_core.clients c ON c.client_id = pp.client_id
      LIMIT 1
    `);
    console.log('join query ok:', r3.rows[0] ? 'yes' : 'no rows');
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Full:', e);
  } finally {
    await pool.end();
  }
}
check();
