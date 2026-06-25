// modules/admin/adminRoutes.js
const express = require('express');
const AuthMiddleware = require('../authentication/authMiddleware');
const { getPool, sql } = require('../../config/database');
const PasswordUtils = require('../authentication/passwordUtils');
const { logAction } = require('../../utils/logger');

const router = express.Router();

// All admin routes require login + admin role
router.use(AuthMiddleware.protect);
router.use(AuthMiddleware.restrictTo('admin'));

// GET /api/v1/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM users WHERE is_active = 1) AS total_users,
                (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = 1) AS total_students,
                (SELECT COUNT(*) FROM users WHERE role = 'staff' AND is_active = 1) AS total_staff,
                (SELECT COUNT(*) FROM staff_profiles) AS total_staff_profiles,
                (SELECT COUNT(*) FROM appointments) AS total_appointments,
                (SELECT COUNT(*) FROM appointments WHERE status = 'pending') AS pending_appointments,
                (SELECT COUNT(*) FROM appointments WHERE status = 'confirmed') AS confirmed_appointments,
                (SELECT COUNT(*) FROM appointments WHERE CAST(appointment_date AS DATE) = CAST(GETDATE() AS DATE)) AS todays_appointments,
                (SELECT COUNT(*) FROM departments) AS total_departments
        `);
        return res.status(200).json({ success: true, data: result.recordset[0] });
    } catch (error) {
        console.error('Admin stats error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
});

// GET /api/v1/admin/users?role=&page=&limit=&search=
router.get('/users', async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const pool = getPool();
        const request = pool.request()
            .input('limit', sql.Int, parseInt(limit))
            .input('offset', sql.Int, offset);

        let where = 'WHERE 1=1';
        if (role) {
            where += ' AND u.role = @role';
            request.input('role', sql.VarChar, role);
        }
        if (search) {
            where += ' AND (u.email LIKE @search)';
            request.input('search', sql.VarChar, `%${search}%`);
        }

        const result = await request.query(`
            SELECT 
                u.user_id, u.email, u.role, u.is_active, u.created_at, u.last_login,
                COALESCE(s.first_name + ' ' + s.last_name, sp.first_name + ' ' + sp.last_name) AS full_name,
                s.student_reg_no,
                sp.staff_number, sp.staff_type, sp.title
            FROM users u
            LEFT JOIN students s ON u.user_id = s.user_id
            LEFT JOIN staff_profiles sp ON u.user_id = sp.user_id
            ${where}
            ORDER BY u.created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        const countResult = await pool.request().query(`SELECT COUNT(*) AS total FROM users u ${where.replace('@role', `'${role || ''}'`).replace('@search', `'%${search || ''}%'`)}`);

        return res.status(200).json({
            success: true,
            data: {
                users: result.recordset,
                total: countResult.recordset[0].total,
                page: parseInt(page),
                totalPages: Math.ceil(countResult.recordset[0].total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching users' });
    }
});

// PATCH /api/v1/admin/users/:id/status  — activate or suspend
router.patch('/users/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;
        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, parseInt(req.params.id))
            .input('is_active', sql.Bit, isActive ? 1 : 0)
            .query('UPDATE users SET is_active = @is_active, updated_at = GETDATE() WHERE user_id = @user_id');

        await logAction(req.user.userId, isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED', 'users', parseInt(req.params.id), req);
        return res.status(200).json({ success: true, message: `User ${isActive ? 'activated' : 'suspended'}` });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating user status' });
    }
});

// PATCH /api/v1/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['student', 'staff', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, parseInt(req.params.id))
            .input('role', sql.VarChar, role)
            .query('UPDATE users SET role = @role, updated_at = GETDATE() WHERE user_id = @user_id');

        await logAction(req.user.userId, 'USER_ROLE_CHANGED', 'users', parseInt(req.params.id), req);
        return res.status(200).json({ success: true, message: 'Role updated' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating role' });
    }
});

// POST /api/v1/admin/users  — create admin or seed account
router.post('/users', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'email, password, and role are required' });
        }
        if (!email.endsWith('@strathmore.edu')) {
            return res.status(400).json({ success: false, message: 'Must use a @strathmore.edu email' });
        }

        const pool = getPool();
        const existing = await pool.request()
            .input('email', sql.VarChar, email.toLowerCase())
            .query('SELECT user_id FROM users WHERE email = @email');

        if (existing.recordset[0]) {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }

        const passwordHash = await PasswordUtils.hashPassword(password);
        const result = await pool.request()
            .input('email', sql.VarChar, email.toLowerCase())
            .input('password_hash', sql.VarChar, passwordHash)
            .input('role', sql.VarChar, role)
            .query(`
                INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
                OUTPUT INSERTED.user_id, INSERTED.email, INSERTED.role
                VALUES (@email, @password_hash, @role, 1, GETDATE(), GETDATE())
            `);

        await logAction(req.user.userId, 'USER_CREATED_BY_ADMIN', 'users', result.recordset[0].user_id, req);
        return res.status(201).json({ success: true, message: 'User created', data: result.recordset[0] });
    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ success: false, message: 'Error creating user' });
    }
});

// GET /api/v1/admin/logs?page=&limit=
router.get('/logs', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const pool = getPool();

        const result = await pool.request()
            .input('limit', sql.Int, parseInt(limit))
            .input('offset', sql.Int, offset)
            .query(`
                SELECT l.*, u.email
                FROM system_logs l
                LEFT JOIN users u ON l.user_id = u.user_id
                ORDER BY l.created_at DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `);

        return res.status(200).json({ success: true, data: { logs: result.recordset } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching logs' });
    }
});

// GET /api/v1/admin/departments
router.get('/departments', async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query('SELECT * FROM departments ORDER BY faculty, department_name');
        return res.status(200).json({ success: true, data: { departments: result.recordset } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching departments' });
    }
});

// POST /api/v1/admin/departments
router.post('/departments', async (req, res) => {
    try {
        const { departmentName, departmentCode, faculty, officeLocation, description } = req.body;
        if (!departmentName || !departmentCode || !faculty) {
            return res.status(400).json({ success: false, message: 'departmentName, departmentCode, and faculty are required' });
        }
        const pool = getPool();
        const result = await pool.request()
            .input('department_name', sql.VarChar, departmentName)
            .input('department_code', sql.VarChar, departmentCode)
            .input('faculty', sql.VarChar, faculty)
            .input('office_location', sql.Text, officeLocation || null)
            .input('description', sql.Text, description || null)
            .query(`
                INSERT INTO departments (department_name, department_code, faculty, office_location, description, created_at)
                OUTPUT INSERTED.*
                VALUES (@department_name, @department_code, @faculty, @office_location, @description, GETDATE())
            `);
        return res.status(201).json({ success: true, message: 'Department created', data: result.recordset[0] });
    } catch (error) {
        console.error('Create department error:', error);
        return res.status(500).json({ success: false, message: 'Error creating department' });
    }
});

module.exports = router;
