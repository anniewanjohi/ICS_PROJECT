// modules/admin/adminRoutes.js
const express = require('express');
const AuthMiddleware = require('../authentication/authMiddleware');
const { getPool, sql } = require('../../config/database');
const PasswordUtils = require('../authentication/passwordUtils');
const { logAction } = require('../../utils/logger');

const router = express.Router();

router.use(AuthMiddleware.protect);
router.use(AuthMiddleware.restrictTo('admin'));

// GET /api/v1/admin/my-profile
router.get('/my-profile', async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .query('SELECT user_id, email, role, created_at, last_login FROM dbo.users WHERE user_id = @user_id');

        if (!result.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Admin account not found' });
        }
        return res.status(200).json({ success: true, data: { profile: result.recordset[0] } });
    } catch (error) {
        console.error('Get admin profile error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching admin profile' });
    }
});

// POST /api/v1/admin/change-password
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        const pool = getPool();
        const userResult = await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .query('SELECT password_hash FROM dbo.users WHERE user_id = @user_id');

        if (!userResult.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Admin account not found' });
        }

        const isValid = await PasswordUtils.comparePassword(currentPassword, userResult.recordset[0].password_hash);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        const passwordCheck = PasswordUtils.validatePasswordStrength(newPassword);
        if (!passwordCheck.isValid) {
            return res.status(400).json({ success: false, message: 'New password does not meet requirements', errors: passwordCheck.errors });
        }

        const newHash = await PasswordUtils.hashPassword(newPassword);
        await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .input('password_hash', sql.VarChar, newHash)
            .query('UPDATE dbo.users SET password_hash = @password_hash, updated_at = GETDATE() WHERE user_id = @user_id');

        await logAction(req.user.userId, 'ADMIN_PASSWORD_CHANGED', 'users', req.user.userId, req);
        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update admin password error:', error);
        return res.status(500).json({ success: false, message: 'Error updating password' });
    }
});

// GET /api/v1/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM dbo.users WHERE is_active = 1) AS total_users,
                (SELECT COUNT(*) FROM dbo.users WHERE role = 'student' AND is_active = 1) AS total_students,
                (SELECT COUNT(*) FROM dbo.users WHERE role = 'staff' AND is_active = 1) AS total_staff,
                (SELECT COUNT(*) FROM dbo.staff_profiles) AS total_staff_profiles,
                (SELECT COUNT(*) FROM dbo.appointments) AS total_appointments,
                (SELECT COUNT(*) FROM dbo.appointments WHERE status = 'pending') AS pending_appointments,
                (SELECT COUNT(*) FROM dbo.appointments WHERE status = 'confirmed') AS confirmed_appointments,
                (SELECT COUNT(*) FROM dbo.appointments WHERE CAST(appointment_date AS DATE) = CAST(GETDATE() AS DATE)) AS todays_appointments,
                (SELECT COUNT(*) FROM dbo.departments) AS total_departments
        `);
        return res.status(200).json({ success: true, data: result.recordset[0] });
    } catch (error) {
        console.error('Admin stats error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
});

// GET /api/v1/admin/users
router.get('/users', async (req, res) => {
    try {
        const { role, search, faculty, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const pool = getPool();
        
        let whereConditions = [];
        
        if (role) {
            whereConditions.push("u.role = @role");
        }
        if (search) {
            whereConditions.push("(u.email LIKE @search OR s.first_name LIKE @search OR s.last_name LIKE @search OR sp.first_name LIKE @search OR sp.last_name LIKE @search)");
        }
        if (faculty) {
            whereConditions.push("(s.faculty = @faculty OR sp.faculty = @faculty)");
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const request = pool.request();
        if (role) request.input('role', sql.VarChar, role);
        if (search) request.input('search', sql.VarChar, `%${search}%`);
        if (faculty) request.input('faculty', sql.VarChar, faculty);
        request.input('limit', sql.Int, parseInt(limit));
        request.input('offset', sql.Int, offset);

        const result = await request.query(`
            SELECT 
                u.user_id, u.email, u.role, u.is_active, u.created_at, u.last_login,
                COALESCE(s.first_name + ' ' + s.last_name, sp.first_name + ' ' + sp.last_name) AS full_name,
                s.student_reg_no, s.is_student_rep, s.rep_role,
                sp.staff_number, sp.staff_type, sp.title, sp.is_mentor,
                COALESCE(s.faculty, sp.faculty) AS faculty
            FROM dbo.users u
            LEFT JOIN dbo.students s ON u.user_id = s.user_id
            LEFT JOIN dbo.staff_profiles sp ON u.user_id = sp.user_id
            ${whereClause}
            ORDER BY u.created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        const countRequest = pool.request();
        if (role) countRequest.input('role', sql.VarChar, role);
        if (search) countRequest.input('search', sql.VarChar, `%${search}%`);
        if (faculty) countRequest.input('faculty', sql.VarChar, faculty);
        
        const countResult = await countRequest.query(`
            SELECT COUNT(*) AS total 
            FROM dbo.users u
            LEFT JOIN dbo.students s ON u.user_id = s.user_id
            LEFT JOIN dbo.staff_profiles sp ON u.user_id = sp.user_id
            ${whereClause}
        `);

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

// PATCH /api/v1/admin/users/:id/status
router.patch('/users/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;
        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, parseInt(req.params.id))
            .input('is_active', sql.Bit, isActive ? 1 : 0)
            .query('UPDATE dbo.users SET is_active = @is_active, updated_at = GETDATE() WHERE user_id = @user_id');
        await logAction(req.user.userId, isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED', 'users', parseInt(req.params.id), req);
        return res.status(200).json({ success: true, message: `User ${isActive ? 'activated' : 'suspended'}` });
    } catch (error) {
        console.error('Update user status error:', error);
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
            .query('UPDATE dbo.users SET role = @role, updated_at = GETDATE() WHERE user_id = @user_id');
        await logAction(req.user.userId, 'USER_ROLE_CHANGED', 'users', parseInt(req.params.id), req);
        return res.status(200).json({ success: true, message: 'Role updated' });
    } catch (error) {
        console.error('Update role error:', error);
        return res.status(500).json({ success: false, message: 'Error updating role' });
    }
});

// DELETE /api/v1/admin/users/:id
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (userId === req.user.userId) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
        }

        const pool = getPool();
        const check = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT user_id, email, role FROM dbo.users WHERE user_id = @user_id');

        if (!check.recordset[0]) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await pool.request()
            .input('user_id', sql.Int, userId)
            .query('DELETE FROM dbo.users WHERE user_id = @user_id');

        await logAction(req.user.userId, 'USER_DELETED', 'users', userId, req);
        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ success: false, message: 'Error deleting user' });
    }
});

// POST /api/v1/admin/users
router.post('/users', async (req, res) => {
    try {
        const { email, password, role, faculty } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'email, password, and role are required' });
        }
        if (!email.endsWith('@strathmore.edu')) {
            return res.status(400).json({ success: false, message: 'Must use a @strathmore.edu email' });
        }
        
        const pool = getPool();
        const existing = await pool.request()
            .input('email', sql.VarChar, email.toLowerCase())
            .query('SELECT user_id FROM dbo.users WHERE email = @email');
            
        if (existing.recordset[0]) {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }
        
        const passwordHash = await PasswordUtils.hashPassword(password);
        
        const result = await pool.request()
            .input('email', sql.VarChar, email.toLowerCase())
            .input('password_hash', sql.VarChar, passwordHash)
            .input('role', sql.VarChar, role)
            .query(`
                INSERT INTO dbo.users (email, password_hash, role, is_active, created_at, updated_at)
                OUTPUT INSERTED.user_id, INSERTED.email, INSERTED.role
                VALUES (@email, @password_hash, @role, 1, GETDATE(), GETDATE())
            `);
        
        const userId = result.recordset[0].user_id;
        
        if (role === 'student') {
            await pool.request()
                .input('user_id', sql.Int, userId)
                .input('first_name', sql.VarChar, email.split('@')[0].split('.')[0] || 'User')
                .input('last_name', sql.VarChar, email.split('@')[0].split('.')[1] || '')
                .input('student_reg_no', sql.VarChar, `STU-${userId}`)
                .input('program', sql.VarChar, 'Not specified')
                .input('faculty', sql.VarChar, faculty || null)
                .query(`
                    INSERT INTO dbo.students (user_id, first_name, last_name, student_reg_no, program, faculty, created_at, updated_at)
                    VALUES (@user_id, @first_name, @last_name, @student_reg_no, @program, @faculty, GETDATE(), GETDATE())
                `);
        } else if (role === 'staff') {
            await pool.request()
                .input('user_id', sql.Int, userId)
                .input('first_name', sql.VarChar, email.split('@')[0].split('.')[0] || 'User')
                .input('last_name', sql.VarChar, email.split('@')[0].split('.')[1] || '')
                .input('staff_number', sql.VarChar, `STAFF-${userId}`)
                .input('staff_type', sql.VarChar, 'lecturer')
                .input('faculty', sql.VarChar, faculty || null)
                .query(`
                    INSERT INTO dbo.staff_profiles (user_id, first_name, last_name, staff_number, staff_type, faculty, is_available_for_booking, created_at, updated_at)
                    VALUES (@user_id, @first_name, @last_name, @staff_number, @staff_type, @faculty, 1, GETDATE(), GETDATE())
                `);
        }

        await logAction(req.user.userId, 'USER_CREATED_BY_ADMIN', 'users', result.recordset[0].user_id, req);
        return res.status(201).json({ success: true, message: 'User created', data: result.recordset[0] });
    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ success: false, message: 'Error creating user' });
    }
});

// GET /api/v1/admin/logs
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
                FROM dbo.system_logs l
                LEFT JOIN dbo.users u ON l.user_id = u.user_id
                ORDER BY l.created_at DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `);
        return res.status(200).json({ success: true, data: { logs: result.recordset } });
    } catch (error) {
        console.error('Get logs error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching logs' });
    }
});

// GET /api/v1/admin/faculties
router.get('/faculties', async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request()
            .query('SELECT DISTINCT faculty_code, faculty FROM dbo.departments WHERE faculty_code IS NOT NULL ORDER BY faculty ASC');
        return res.status(200).json({ success: true, data: { faculties: result.recordset } });
    } catch (error) {
        console.error('Get faculties error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching faculties' });
    }
});

// POST /api/v1/admin/faculties
router.post('/faculties', async (req, res) => {
    try {
        const { facultyCode, facultyName, description } = req.body;
        if (!facultyCode || !facultyName) {
            return res.status(400).json({ success: false, message: 'facultyCode and facultyName are required' });
        }
        
        const pool = getPool();
        const existing = await pool.request()
            .input('faculty_code', sql.VarChar, facultyCode.toUpperCase())
            .query('SELECT faculty_code FROM dbo.departments WHERE faculty_code = @faculty_code');
        
        if (existing.recordset[0]) {
            return res.status(409).json({ success: false, message: 'Faculty code already exists' });
        }
        
        const result = await pool.request()
            .input('faculty_code', sql.VarChar, facultyCode.toUpperCase())
            .input('faculty_name', sql.VarChar, facultyName)
            .input('department_name', sql.VarChar, facultyName)
            .input('department_code', sql.VarChar, facultyCode.toUpperCase())
            .input('description', sql.Text, description || null)
            .query(`
                INSERT INTO dbo.departments (department_name, department_code, faculty, faculty_code, description, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (@department_name, @department_code, @faculty_name, @faculty_code, @description, GETDATE(), GETDATE())
            `);
        
        await logAction(req.user.userId, 'FACULTY_CREATED', 'departments', result.recordset[0].department_id, req);
        return res.status(201).json({ success: true, message: 'Faculty created', data: result.recordset[0] });
    } catch (error) {
        console.error('Create faculty error:', error);
        return res.status(500).json({ success: false, message: 'Error creating faculty' });
    }
});

// PUT /api/v1/admin/faculties/:code
router.put('/faculties/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { facultyName, description } = req.body;
        
        const pool = getPool();
        const result = await pool.request()
            .input('faculty_code', sql.VarChar, code.toUpperCase())
            .input('faculty_name', sql.VarChar, facultyName)
            .input('description', sql.Text, description || null)
            .query(`
                UPDATE dbo.departments 
                SET 
                    faculty = @faculty_name,
                    department_name = @faculty_name,
                    description = @description,
                    updated_at = GETDATE()
                OUTPUT INSERTED.*
                WHERE faculty_code = @faculty_code
            `);
        
        if (!result.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }
        
        await logAction(req.user.userId, 'FACULTY_UPDATED', 'departments', result.recordset[0].department_id, req);
        return res.status(200).json({ success: true, message: 'Faculty updated', data: result.recordset[0] });
    } catch (error) {
        console.error('Update faculty error:', error);
        return res.status(500).json({ success: false, message: 'Error updating faculty' });
    }
});

// DELETE /api/v1/admin/faculties/:code
router.delete('/faculties/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const pool = getPool();
        
        const check = await pool.request()
            .input('faculty_code', sql.VarChar, code.toUpperCase())
            .query(`
                SELECT 
                    (SELECT COUNT(*) FROM dbo.staff_profiles WHERE faculty = @faculty_code) AS staff_count,
                    (SELECT COUNT(*) FROM dbo.students WHERE faculty = @faculty_code) AS student_count
            `);
        
        if (check.recordset[0].staff_count > 0 || check.recordset[0].student_count > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete faculty with assigned staff or students' });
        }
        
        await pool.request()
            .input('faculty_code', sql.VarChar, code.toUpperCase())
            .query('DELETE FROM dbo.departments WHERE faculty_code = @faculty_code');
        
        await logAction(req.user.userId, 'FACULTY_DELETED', 'departments', null, req);
        return res.status(200).json({ success: true, message: 'Faculty deleted' });
    } catch (error) {
        console.error('Delete faculty error:', error);
        return res.status(500).json({ success: false, message: 'Error deleting faculty' });
    }
});

module.exports = router;