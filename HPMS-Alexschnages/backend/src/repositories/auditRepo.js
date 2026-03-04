import db from './db.js';

const auditRepo = {
  async insert({ userId, actionType, details, ipAddress, userAgent, correlationId }) {
    await db.query(
      `INSERT INTO hpms_core.audit_logs
        (user_id, action_type, details, ip_address, user_agent, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, actionType, JSON.stringify(details || {}), ipAddress, userAgent, correlationId],
    );
  },
};

export default auditRepo;

