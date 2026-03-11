import db from './db.js';

/**
 * List audit log entries with user display info (from users table; user_id references users after 006).
 */
export async function listActivity({ limit = 50, offset = 0, actionType, userId, fromDate, toDate }) {
  let where = [];
  const params = [];
  let i = 1;

  if (actionType) {
    where.push(`a.action_type = $${i++}`);
    params.push(actionType);
  }
  if (userId) {
    where.push(`a.user_id = $${i++}`);
    params.push(userId);
  }
  if (fromDate) {
    where.push(`a.timestamp >= $${i++}::timestamptz`);
    params.push(fromDate);
  }
  if (toDate) {
    where.push(`a.timestamp <= $${i++}::timestamptz`);
    params.push(toDate);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT a.audit_id, a.timestamp, a.user_id, a.action_type, a.details, a.ip_address, a.user_agent, a.correlation_id,
            u.full_name AS user_name, u.email AS user_email
     FROM hpms_core.audit_logs a
     LEFT JOIN hpms_core.users u ON a.user_id = u.user_id
     ${whereClause}
     ORDER BY a.timestamp DESC
     LIMIT $${i++} OFFSET $${i}`,
    params
  );
  return rows;
}

export async function countActivity({ actionType, userId, fromDate, toDate }) {
  let where = [];
  const params = [];
  let i = 1;
  if (actionType) { where.push(`action_type = $${i++}`); params.push(actionType); }
  if (userId) { where.push(`user_id = $${i++}`); params.push(userId); }
  if (fromDate) { where.push(`timestamp >= $${i++}::timestamptz`); params.push(fromDate); }
  if (toDate) { where.push(`timestamp <= $${i++}::timestamptz`); params.push(toDate); }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total FROM hpms_core.audit_logs ${whereClause}`,
    params
  );
  const n = rows[0];
  return n ? (typeof n.total === 'number' ? n.total : parseInt(n.total, 10) || 0) : 0;
}

const EXPORT_MAX = 10000;

/** List activity for export (same filters as listActivity, up to EXPORT_MAX rows). */
export async function listActivityForExport({ actionType, userId, fromDate, toDate }) {
  let where = [];
  const params = [];
  let i = 1;
  if (actionType) {
    where.push(`a.action_type = $${i++}`);
    params.push(actionType);
  }
  if (userId) {
    where.push(`a.user_id = $${i++}`);
    params.push(userId);
  }
  if (fromDate) {
    where.push(`a.timestamp >= $${i++}::timestamptz`);
    params.push(fromDate);
  }
  if (toDate) {
    where.push(`a.timestamp <= $${i++}::timestamptz`);
    params.push(toDate);
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(EXPORT_MAX);
  const { rows } = await db.query(
    `SELECT a.audit_id, a.timestamp, a.user_id, a.action_type, a.details, a.ip_address, a.user_agent,
            u.full_name AS user_name, u.email AS user_email
     FROM hpms_core.audit_logs a
     LEFT JOIN hpms_core.users u ON a.user_id = u.user_id
     ${whereClause}
     ORDER BY a.timestamp DESC
     LIMIT $${i}`,
    params
  );
  return rows;
}
