import pool from '../config/database.js';
import { NOTIFICATION_TYPES } from '../constants/roles.js';

class NotificationRepository {
  // Create a notification
  async create({ userId, type, title, message, batchId = null, actionUrl = null, priority = 'NORMAL' }) {
    const query = `
      INSERT INTO hpms_core.notifications (
        user_id, type, title, message, batch_id, action_url, priority
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      type,
      title,
      message,
      batchId,
      actionUrl,
      priority,
    ]);

    return result.rows[0];
  }

  // Create notifications for multiple users
  async createBulk(notifications) {
    const values = notifications.map((n, index) => {
      const offset = index * 7;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
    }).join(', ');

    const params = notifications.flatMap(n => [
      n.userId,
      n.type,
      n.title,
      n.message,
      n.batchId || null,
      n.actionUrl || null,
      n.priority || 'NORMAL',
    ]);

    const query = `
      INSERT INTO hpms_core.notifications (
        user_id, type, title, message, batch_id, action_url, priority
      )
      VALUES ${values}
      RETURNING *
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get notifications for a user
  // Note: batch_id in notifications stores period_id (payroll_periods); payroll_batches was dropped in migration 007
  async getByUser(userId, limit = 50, offset = 0, unreadOnly = false) {
    let query = `
      SELECT 
        n.*,
        pp.client_id,
        c.name AS batch_name,
        pp.period_month,
        pp.period_year
      FROM hpms_core.notifications n
      LEFT JOIN hpms_core.payroll_periods pp ON n.batch_id = pp.period_id
      LEFT JOIN hpms_core.clients c ON c.client_id = pp.client_id
      WHERE n.user_id = $1
    `;

    const params = [userId];

    if (unreadOnly) {
      query += ' AND n.is_read = false';
    }

    query += `
      ORDER BY n.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get unread count for a user
  async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as unread_count
      FROM hpms_core.notifications
      WHERE user_id = $1 AND is_read = false
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].unread_count);
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const query = `
      UPDATE hpms_core.notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE notification_id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0];
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    const query = `
      UPDATE hpms_core.notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
      RETURNING COUNT(*) as marked_count
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Delete old read notifications (cleanup)
  async deleteOldRead(daysOld = 30) {
    const query = `
      DELETE FROM hpms_core.notifications
      WHERE is_read = true 
        AND read_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
      RETURNING COUNT(*) as deleted_count
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }

  // Get notification by ID
  async getById(notificationId) {
    const query = `
      SELECT 
        n.*,
        c.name AS batch_name,
        pp.period_month,
        pp.period_year
      FROM hpms_core.notifications n
      LEFT JOIN hpms_core.payroll_periods pp ON n.batch_id = pp.period_id
      LEFT JOIN hpms_core.clients c ON c.client_id = pp.client_id
      WHERE n.notification_id = $1
    `;

    const result = await pool.query(query, [notificationId]);
    return result.rows[0];
  }

  // Delete a notification
  async delete(notificationId, userId) {
    const query = `
      DELETE FROM hpms_core.notifications
      WHERE notification_id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0];
  }
}

export default new NotificationRepository();
