import notificationRepo from '../repositories/notificationRepo.js';
import pool from '../config/database.js';
import { NOTIFICATION_TYPES, ROLES } from '../constants/roles.js';

class NotificationService {
    // Create a single notification
    async create({ userId, type, title, message, batchId = null, actionUrl = null, priority = 'NORMAL' }) {
        return await notificationRepo.create({
            userId,
            type,
            title,
            message,
            batchId,
            actionUrl,
            priority,
        });
    }

    // Create multiple notifications at once
    async createBulk(notifications) {
        if (!notifications || notifications.length === 0) {
            return [];
        }
        return await notificationRepo.createBulk(notifications);
    }

    // Notify a specific user
    async notifyUser({ userId, type, title, message, batchId = null, actionUrl = null, priority = 'NORMAL' }) {
        return await this.create({
            userId,
            type,
            title,
            message,
            batchId,
            actionUrl,
            priority,
        });
    }

    // Notify all HR Managers
    async notifyHRManagers({ type, batchId, batchName, periodMonth, periodYear }) {
        const query = `
            SELECT user_id, full_name, email
            FROM hpms_core.users
            WHERE role = $1 AND status = 'ACTIVE'
        `;

        const result = await pool.query(query, [ROLES.HR]);
        const hrManagers = result.rows;

        if (hrManagers.length === 0) {
            console.warn('No HR managers found to notify');
            return [];
        }

        const notifications = hrManagers.map(hr => ({
            userId: hr.user_id,
            type: NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
            title: 'New Payroll Submitted for Review',
            message: `A new payroll batch "${batchName}" for ${this.getMonthName(periodMonth)} ${periodYear} has been submitted and requires your review.`,
            batchId,
            actionUrl: `/hr-review`,
            priority: 'HIGH',
        }));

        return await this.createBulk(notifications);
    }

    // Notify Managing Director
    async notifyManagingDirector({ type, batchId, batchName, periodMonth, periodYear, reviewerName }) {
        const query = `
            SELECT user_id, full_name, email
            FROM hpms_core.users
            WHERE role = $1 AND status = 'ACTIVE'
        `;

        const result = await pool.query(query, [ROLES.MANAGING_DIRECTOR]);
        const mds = result.rows;

        if (mds.length === 0) {
            console.warn('No Managing Directors found to notify');
            return [];
        }

        const notifications = mds.map(md => ({
            userId: md.user_id,
            type: NOTIFICATION_TYPES.PAYROLL_HR_APPROVED,
            title: 'Payroll Awaiting Final Approval',
            message: `Payroll batch "${batchName}" for ${this.getMonthName(periodMonth)} ${periodYear} has been approved by HR (${reviewerName}) and requires your final approval.`,
            batchId,
            actionUrl: `/md-approval`,
            priority: 'HIGH',
        }));

        return await this.createBulk(notifications);
    }

    // Get notifications for a user
    async getUserNotifications(userId, limit = 50, offset = 0, unreadOnly = false) {
        return await notificationRepo.getByUser(userId, limit, offset, unreadOnly);
    }

    // Get unread count
    async getUnreadCount(userId) {
        return await notificationRepo.getUnreadCount(userId);
    }

    // Mark as read
    async markAsRead(notificationId, userId) {
        return await notificationRepo.markAsRead(notificationId, userId);
    }

    // Mark all as read
    async markAllAsRead(userId) {
        return await notificationRepo.markAllAsRead(userId);
    }

    // Delete notification
    async delete(notificationId, userId) {
        return await notificationRepo.delete(notificationId, userId);
    }

    /**
     * Broadcast a notification to ALL users of the given roles.
     */
    async notifyByRole({ roles, type, title, message, actionUrl = null, priority = 'NORMAL' }) {
        const placeholders = roles.map((_, i) => `$${i + 1}`).join(',');
        const { rows: targets } = await pool.query(
            `SELECT user_id FROM hpms_core.users WHERE role IN (${placeholders}) AND status = 'ACTIVE'`,
            roles
        );
        if (!targets.length) return [];
        const notifications = targets.map(t => ({
            userId: t.user_id, type, title, message, actionUrl, priority,
        }));
        return await this.createBulk(notifications);
    }

    /**
     * Fire when a new employee is created:
     *  • In-app notification → all HR + Admin users
     *  • In-app welcome notification → the new employee themselves
     */
    async notifyNewEmployee({ newEmployee, createdByName }) {
        const promises = [];

        // ── notify HR ─────────────────────────────────────────
        promises.push(
            this.notifyByRole({
                roles: ['HR'],
                type: NOTIFICATION_TYPES.EMPLOYEE_ADDED,
                title: '👤 New Employee Added',
                message: `${createdByName} has added a new employee: ${newEmployee.full_name} (${newEmployee.email}) as ${newEmployee.role}.`,
                actionUrl: '/employees',
                priority: 'HIGH',
            })
        );

        // ── welcome notification for the employee ──────────────
        promises.push(
            this.create({
                userId: newEmployee.employee_id,
                type: NOTIFICATION_TYPES.EMPLOYEE_WELCOME,
                title: '🎉 Welcome to HC Solutions!',
                message: `Your employee account has been created. Log in with your email and the temporary password provided by HR. Please change it after your first login.`,
                actionUrl: '/dashboard',
                priority: 'HIGH',
            })
        );

        return Promise.allSettled(promises);
    }

    /**
     * Fire when Finance Officer computes / saves a single employee salary.
     * This is an FYI notification — HR reviews batches, not individual salaries.
     * The Finance Officer will group salaries into a batch and submit for HR review.
     */
    async notifySalaryComputed({ employeeName, payPeriod, salaryId, computedByName }) {
        const query = `
            SELECT user_id FROM hpms_core.users
            WHERE role = $1 AND status = 'ACTIVE'
        `;
        const { rows: hrManagers } = await pool.query(query, [ROLES.HR]);

        if (!hrManagers.length) {
            console.warn('[notifySalaryComputed] No HR managers found to notify');
            return [];
        }

        const notifications = hrManagers.map(hr => ({
            userId: hr.user_id,
            type: NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
            title: '📊 Salary Computed — Available for Review',
            message: `${computedByName} has computed the salary for ${employeeName} (${payPeriod}). You can view it in the Review Queue under Individual Salary Records.`,
            actionUrl: `/hr-review`,
            priority: 'NORMAL',
        }));

        return await this.createBulk(notifications);
    }

    /**
     * Fire when a bulk salary upload is completed.
     * Notifies all HR managers with a summary of the processed records.
     */
    async notifyBulkUploadComplete({ totalProcessed, successful, failed, payPeriod, uploadedByName }) {
        const query = `
            SELECT user_id FROM hpms_core.users
            WHERE role = $1 AND status = 'ACTIVE'
        `;
        const { rows: hrManagers } = await pool.query(query, [ROLES.HR]);

        if (!hrManagers.length) {
            console.warn('[notifyBulkUploadComplete] No HR managers found to notify');
            return [];
        }

        const statusPart = failed > 0
            ? `${successful} succeeded, ${failed} had errors.`
            : `All ${successful} records processed successfully.`;

        const notifications = hrManagers.map(hr => ({
            userId: hr.user_id,
            type: NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
            title: '📋 Bulk Payroll Upload – Ready for Review',
            message: `${uploadedByName} completed a bulk salary upload for ${payPeriod}: ${statusPart} Please review the calculations before approving.`,
            actionUrl: '/hr-review',
            priority: 'HIGH',
        }));

        return await this.createBulk(notifications);
    }

    /**
     * Notify the Finance Officer when HR approves or rejects a salary record.
     * foUserId  — employee_id of the FO who computed the salary
     * status    — 'HR_APPROVED' | 'HR_REJECTED'
     */
    async notifyFOSalaryReviewed({ foUserId, employeeName, payPeriod, status, comment, reviewedByName }) {
        if (!foUserId) return;
        const approved = status === 'HR_APPROVED';
        await this.create({
            userId: foUserId,
            type: approved ? NOTIFICATION_TYPES.PAYROLL_HR_APPROVED : NOTIFICATION_TYPES.PAYROLL_REJECTED,
            title: approved
                ? `✅ Salary Approved — ${employeeName}`
                : `❌ Salary Rejected — ${employeeName}`,
            message: approved
                ? `${reviewedByName} has approved the salary for ${employeeName} (${payPeriod}).${comment ? ` Note: "${comment}"` : ''}`
                : `${reviewedByName} has rejected the salary for ${employeeName} (${payPeriod}). Reason: "${comment || 'No reason provided'}"`,
            actionUrl: '/hr-review',
            priority: approved ? 'NORMAL' : 'HIGH',
        });
    }

    /**
     * Notify all Finance Officers when HR bulk-approves a whole period.
     */
    async notifyFOBulkReviewed({ foUserIds, period, count, reviewedByName }) {
        if (!foUserIds?.length) return;
        const notifications = foUserIds.map(id => ({
            userId: id,
            type: NOTIFICATION_TYPES.PAYROLL_HR_APPROVED,
            title: `✅ ${count} Salaries Approved for ${period}`,
            message: `${reviewedByName} has approved all ${count} pending salary record(s) for ${period}. You can now proceed with payslip emails.`,
            actionUrl: '/hr-review',
            priority: 'NORMAL',
        }));
        return await this.createBulk(notifications);
    }

    // Helper: Get month name
    getMonthName(month) {

        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1] || 'Unknown';
    }

    // Cleanup old notifications (can be run as a cron job)
    async cleanupOldNotifications(daysOld = 30) {
        return await notificationRepo.deleteOldRead(daysOld);
    }

    // Send reminder notifications for pending approvals
    async sendApprovalReminders() {
        // Get batches pending for more than 24 hours
        const query = `
      SELECT 
        pb.*,
        creator.full_name as created_by_name
      FROM payroll_batches pb
      JOIN employees creator ON pb.created_by = creator.employee_id
      WHERE 
        (pb.status = 'PENDING' AND pb.created_at < NOW() - INTERVAL '24 hours')
        OR 
        (pb.status = 'HR_APPROVED' AND pb.hr_reviewed_at < NOW() - INTERVAL '24 hours')
    `;

        const result = await pool.query(query);
        const pendingBatches = result.rows;

        const notifications = [];

        for (const batch of pendingBatches) {
            if (batch.status === 'PENDING') {
                // Remind HR managers
                const hrQuery = `SELECT employee_id FROM employees WHERE role = $1`;
                const hrResult = await pool.query(hrQuery, [ROLES.HR]);

                hrResult.rows.forEach(hr => {
                    notifications.push({
                        userId: hr.employee_id,
                        type: NOTIFICATION_TYPES.APPROVAL_REMINDER,
                        title: 'Reminder: Pending Payroll Approval',
                        message: `Payroll batch "${batch.batch_name}" has been pending for over 24 hours. Please review.`,
                        batchId: batch.batch_id,
                        actionUrl: `/hr-review`,
                        priority: 'HIGH',
                    });
                });
            } else if (batch.status === 'HR_APPROVED') {
                // Remind Managing Director
                const mdQuery = `SELECT employee_id FROM employees WHERE role = $1`;
                const mdResult = await pool.query(mdQuery, [ROLES.MANAGING_DIRECTOR]);

                mdResult.rows.forEach(md => {
                    notifications.push({
                        userId: md.employee_id,
                        type: NOTIFICATION_TYPES.APPROVAL_REMINDER,
                        title: 'Reminder: Pending Final Approval',
                        message: `Payroll batch "${batch.batch_name}" has been awaiting your final approval for over 24 hours.`,
                        batchId: batch.batch_id,
                        actionUrl: `/md-approval`,
                        priority: 'URGENT',
                    });
                });
            }
        }

        if (notifications.length > 0) {
            return await this.createBulk(notifications);
        }

        return [];
    }
}

export default new NotificationService();
