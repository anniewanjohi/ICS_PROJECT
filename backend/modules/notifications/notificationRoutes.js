// modules/notifications/notificationRoutes.js
const express = require('express');
const NotificationModel = require('./notificationModel');
const AuthMiddleware = require('../authentication/authMiddleware');

const router = express.Router();
router.use(AuthMiddleware.protect);

// GET /api/v1/notifications
router.get('/', async (req, res) => {
    try {
        const { unreadOnly } = req.query;
        const notifications = await NotificationModel.getForUser(req.user.userId, unreadOnly === 'true');
        const unreadCount = await NotificationModel.getUnreadCount(req.user.userId);
        return res.status(200).json({ success: true, data: { notifications, unreadCount } });
    } catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
    try {
        await NotificationModel.markAsRead(parseInt(req.params.id), req.user.userId);
        return res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating notification' });
    }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', async (req, res) => {
    try {
        await NotificationModel.markAllAsRead(req.user.userId);
        return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating notifications' });
    }
});

module.exports = router;
