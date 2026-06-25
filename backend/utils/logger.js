// utils/logger.js
const { getPool, sql } = require('../config/database');

const logAction = async (userId, action, entityType, entityId, req) => {
    try {
        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, userId || null)
            .input('action', sql.VarChar, action)
            .input('entity_type', sql.VarChar, entityType || null)
            .input('entity_id', sql.Int, entityId || null)
            .input('ip_address', sql.VarChar, req?.ip || null)
            .input('user_agent', sql.VarChar, req?.headers?.['user-agent']?.substring(0, 500) || null)
            .query(`
                INSERT INTO system_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, created_at)
                VALUES (@user_id, @action, @entity_type, @entity_id, @ip_address, @user_agent, GETDATE())
            `);
    } catch (err) {
        // Never crash the app over a log failure
        console.error('Logging error:', err.message);
    }
};

module.exports = { logAction };
