// modules/notifications/notificationModel.js
const { getPool, sql } = require('../../config/database');

const NotificationModel = {

    create: async ({ userId, appointmentId = null, title, message, type }) => {
        const pool = getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('appointment_id', sql.Int, appointmentId)
            .input('title', sql.VarChar, title)
            .input('message', sql.Text, message)
            .input('type', sql.VarChar, type)
            .query(`
                INSERT INTO notifications (user_id, appointment_id, title, message, type, is_read, created_at)
                OUTPUT INSERTED.*
                VALUES (@user_id, @appointment_id, @title, @message, @type, 0, GETDATE())
            `);
        return result.recordset[0];
    },

    getForUser: async (userId, unreadOnly = false) => {
        const pool = getPool();
        const request = pool.request().input('user_id', sql.Int, userId);
        let where = 'WHERE user_id = @user_id';
        if (unreadOnly) where += ' AND is_read = 0';

        const result = await request.query(`
            SELECT notification_id, title, message, type, is_read, created_at, appointment_id
            FROM notifications
            ${where}
            ORDER BY created_at DESC
            OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
        `);
        return result.recordset;
    },

    getUnreadCount: async (userId) => {
        const pool = getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT COUNT(*) AS count FROM notifications WHERE user_id = @user_id AND is_read = 0');
        return result.recordset[0].count;
    },

    markAsRead: async (notificationId, userId) => {
        const pool = getPool();
        await pool.request()
            .input('notification_id', sql.Int, notificationId)
            .input('user_id', sql.Int, userId)
            .query(`
                UPDATE notifications 
                SET is_read = 1, read_at = GETDATE()
                WHERE notification_id = @notification_id AND user_id = @user_id
            `);
    },

    markAllAsRead: async (userId) => {
        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, userId)
            .query(`
                UPDATE notifications 
                SET is_read = 1, read_at = GETDATE()
                WHERE user_id = @user_id AND is_read = 0
            `);
    }
};

module.exports = NotificationModel;
