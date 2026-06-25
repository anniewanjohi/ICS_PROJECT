// modules/authentication/userModel.js
const { getPool, sql } = require('../../config/database');

const UserModel = {

    findByEmail: async (email) => {
        const pool = getPool();
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM users WHERE email = @email');
        return result.recordset[0] || null;
    },

    findById: async (userId) => {
        const pool = getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT * FROM users WHERE user_id = @user_id');
        return result.recordset[0] || null;
    },

    create: async (email, passwordHash, role = 'student') => {
        const pool = getPool();
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('password_hash', sql.VarChar, passwordHash)
            .input('role', sql.VarChar, role)
            .query(`
                INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (@email, @password_hash, @role, 1, GETDATE(), GETDATE())
            `);
        return result.recordset[0];
    },

    updateLastLogin: async (userId) => {
        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, userId)
            .query('UPDATE users SET last_login = GETDATE() WHERE user_id = @user_id');
    },

    // Returns user + their role-specific profile joined
    getUserWithProfile: async (userId) => {
        const pool = getPool();

        // First get the base user
        const userResult = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT user_id, email, role, is_active, created_at, last_login FROM users WHERE user_id = @user_id');

        const user = userResult.recordset[0];
        if (!user) return null;

        let profile = null;

        if (user.role === 'student') {
            const profileResult = await pool.request()
                .input('user_id', sql.Int, userId)
                .query(`
                    SELECT s.student_id, s.first_name, s.last_name, s.student_reg_no,
                           s.program, s.year_of_study, s.department, s.profile_picture_url
                    FROM students s
                    WHERE s.user_id = @user_id
                `);
            profile = profileResult.recordset[0] || null;

        } else if (user.role === 'staff') {
            const profileResult = await pool.request()
                .input('user_id', sql.Int, userId)
                .query(`
                    SELECT sp.staff_id, sp.first_name, sp.last_name, sp.staff_number,
                           sp.staff_type, sp.title, sp.position, sp.office_location,
                           sp.official_email, sp.areas_of_specialization, sp.biography,
                           sp.profile_picture_url, sp.is_available_for_booking,
                           d.department_name, d.faculty
                    FROM staff_profiles sp
                    LEFT JOIN departments d ON sp.department_id = d.department_id
                    WHERE sp.user_id = @user_id
                `);
            profile = profileResult.recordset[0] || null;
        }

        return { ...user, profile };
    },

    createStudentProfile: async (userId, data) => {
        const pool = getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('first_name', sql.VarChar, data.firstName)
            .input('last_name', sql.VarChar, data.lastName)
            .input('student_reg_no', sql.VarChar, data.studentRegNo)
            .input('program', sql.VarChar, data.program)
            .input('year_of_study', sql.Int, data.yearOfStudy || null)
            .input('department', sql.VarChar, data.department || null)
            .query(`
                INSERT INTO students (user_id, first_name, last_name, student_reg_no, program, year_of_study, department, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (@user_id, @first_name, @last_name, @student_reg_no, @program, @year_of_study, @department, GETDATE(), GETDATE())
            `);
        return result.recordset[0];
    },

    createStaffProfile: async (userId, data) => {
        const pool = getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('first_name', sql.VarChar, data.firstName)
            .input('last_name', sql.VarChar, data.lastName)
            .input('staff_number', sql.VarChar, data.staffNumber)
            .input('staff_type', sql.VarChar, data.staffType || 'lecturer')
            .input('department_id', sql.Int, data.departmentId || null)
            .input('title', sql.VarChar, data.title || null)
            .input('position', sql.VarChar, data.position || null)
            .input('office_location', sql.Text, data.officeLocation || null)
            .input('official_email', sql.VarChar, data.officialEmail || null)
            .query(`
                INSERT INTO staff_profiles 
                    (user_id, first_name, last_name, staff_number, staff_type, department_id, title, position, office_location, official_email, is_available_for_booking, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES 
                    (@user_id, @first_name, @last_name, @staff_number, @staff_type, @department_id, @title, @position, @office_location, @official_email, 1, GETDATE(), GETDATE())
            `);
        return result.recordset[0];
    },

    setActive: async (userId, isActive) => {
        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, userId)
            .input('is_active', sql.Bit, isActive ? 1 : 0)
            .query('UPDATE users SET is_active = @is_active, updated_at = GETDATE() WHERE user_id = @user_id');
    },
};

module.exports = UserModel;
