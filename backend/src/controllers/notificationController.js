import notificationService from '../services/notificationService.js';
import { badRequest } from '../utils/httpError.js';

// Get notifications for current user
export const getMyNotifications = async (req, res, next) => {
    try {
        const limit = Number(req.query.limit) || 50;
        const offset = Number(req.query.offset) || 0;
        const unreadOnly = req.query.unreadOnly === 'true';

        const notifications = await notificationService.getUserNotifications(
            req.user.id,
            limit,
            offset,
            unreadOnly
        );

        res.json({
            success: true,
            data: notifications,
            pagination: { limit, offset },
        });
    } catch (error) {
        next(error);
    }
};

// Get unread notification count
export const getUnreadCount = async (req, res, next) => {
    try {
        const count = await notificationService.getUnreadCount(req.user.id);

        res.json({
            success: true,
            data: { unreadCount: count },
        });
    } catch (error) {
        next(error);
    }
};

// Mark notification as read
export const markAsRead = async (req, res, next) => {
    try {
        const notificationId = Number(req.params.id);

        if (isNaN(notificationId)) {
            throw badRequest('Invalid notification ID');
        }

        const notification = await notificationService.markAsRead(notificationId, req.user.id);

        res.json({
            success: true,
            message: 'Notification marked as read',
            data: notification,
        });
    } catch (error) {
        next(error);
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
    try {
        const result = await notificationService.markAllAsRead(req.user.id);

        res.json({
            success: true,
            message: 'All notifications marked as read',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Delete a notification
export const deleteNotification = async (req, res, next) => {
    try {
        const notificationId = Number(req.params.id);

        if (isNaN(notificationId)) {
            throw badRequest('Invalid notification ID');
        }

        const deleted = await notificationService.delete(notificationId, req.user.id);

        res.json({
            success: true,
            message: 'Notification deleted',
            data: deleted,
        });
    } catch (error) {
        next(error);
    }
};
