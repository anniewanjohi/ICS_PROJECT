// modules/authentication/userModel.js
const { getPool, sql } = require('../../config/database');

const UserModel = {

    findByEmail: async (email) => {
        const pool = getPool();
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM dbo.users WHERE email = @email');
        return result.recordset[0] || null;
    },

    findById: async (userId) => {
        const pool = getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT * FROM dbo.users WHERE user_id = @user_id');
        return result.recordset[0] || null;
    },

    create: async (email, passwordHash, role = 'student') => {
        const pool = getPool();
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('password_hash', sql.VarChar, passwordHash)
            .input('role', sql.VarChar, role)
            .query(`
                INSERT INTO dbo.users (email, password_hash, role, is_active, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (@email, @password_hash, @role, 1, GETDATE(), GETDATE())
            `);
        return result.recordset[0];
    },

    updateLastLogin: async (userId) => {
        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, userId)
            .query('UPDATE dbo.users SET last_login = GETDATE() WHERE user_id = @user_id');
    },

    getUserWithProfile: async (userId) => {
        const pool = getPool();
        const userResult = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT user_id, email, role, is_active, created_at, last_login FROM dbo.users WHERE user_id = @user_id');

        const user = userResult.recordset[0];
        if (!user) return null;

        let profile = null;

        if (user.role === 'student') {
            const profileResult = await pool.request()
                .input('user_id', sql.Int, userId)
                .query(`
                    SELECT student_id, first_name, last_name, student_reg_no,
                           program, year_of_study, department, profile_picture_url,
                           is_student_rep, rep_role, phone_number
                    FROM dbo.students WHERE user_id = @user_id
                `);
            profile = profileResult.recordset[0] || null;

        } else if (user.role === 'staff') {
            const profileResult = await pool.request()
                .input('user_id', sql.Int, userId)
                .query(`
                    SELECT sp.staff_id, sp.first_name, sp.last_name, sp.staff_number,
                           sp.staff_type, sp.is_mentor, sp.title, sp.position,
                           sp.office_location, sp.office_hours, sp.official_email,
                           sp.areas_of_specialization, sp.biography,
                           sp.profile_picture_url, sp.is_available_for_booking,
                           sp.phone_extension,
                           d.department_name, d.faculty
                    FROM dbo.staff_profiles sp
                    LEFT JOIN dbo.departments d ON sp.department_id = d.department_id
                    WHERE sp.user_id = @user_id
                `);
            profile = profileResult.recordset[0] || null;
        }

        return { ...user, profile };
    },

    createStudentProfile: async (userId, data) => {
        const pool = getPool();
        const studentRegNo = data.studentRegNo || `STU-${userId}-${Date.now().toString().slice(-5)}`;
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('first_name', sql.VarChar, data.firstName || '')
            .input('last_name', sql.VarChar, data.lastName || '')
            .input('student_reg_no', sql.VarChar, studentRegNo)
            .input('program', sql.VarChar, data.program || 'Not specified')
            .input('year_of_study', sql.Int, data.yearOfStudy || null)
            .input('department', sql.VarChar, data.department || null)
            .input('is_student_rep', sql.Bit, data.isStudentRep ? 1 : 0)
            .input('rep_role', sql.VarChar, data.repRole || null)
            .query(`
                INSERT INTO dbo.students 
                    (user_id, first_name, last_name, student_reg_no, program, year_of_study, department, is_student_rep, rep_role, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (@user_id, @first_name, @last_name, @student_reg_no, @program, @year_of_study, @department, @is_student_rep, @rep_role, GETDATE(), GETDATE())
            `);
        return result.recordset[0];
    },

    createStaffProfile: async (userId, data) => {
        const pool = getPool();
        const staffNumber = data.staffNumber || `STAFF-${userId}-${Date.now().toString().slice(-5)}`;
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('first_name', sql.VarChar, data.firstName || '')
            .input('last_name', sql.VarChar, data.lastName || '')
            .input('staff_number', sql.VarChar, staffNumber)
            .input('staff_type', sql.VarChar, data.staffType || 'lecturer')
            .input('is_mentor', sql.Bit, data.isMentor ? 1 : 0)
            .input('department_id', sql.Int, data.departmentId || null)
            .input('title', sql.VarChar, data.title || null)
            .input('position', sql.VarChar, data.position || null)
            .input('office_location', sql.Text, data.officeLocation || null)
            .input('official_email', sql.VarChar, data.officialEmail || null)
            .query(`
                INSERT INTO dbo.staff_profiles 
                    (user_id, first_name, last_name, staff_number, staff_type, is_mentor, department_id, title, position, office_location, official_email, is_available_for_booking, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES 
                    (@user_id, @first_name, @last_name, @staff_number, @staff_type, @is_mentor, @department_id, @title, @position, @office_location, @official_email, 1, GETDATE(), GETDATE())
            `);
        return result.recordset[0];
    },

    updateStudentProfile: async (userId, data) => {
        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, userId)
            .input('first_name', sql.VarChar, data.firstName || null)
            .input('last_name', sql.VarChar, data.lastName || null)
            .input('program', sql.VarChar, data.program || null)
            .input('year_of_study', sql.Int, data.yearOfStudy || null)
            .input('department', sql.VarChar, data.department || null)
            .input('phone_number', sql.VarChar, data.phoneNumber || null)
            .input('is_student_rep', sql.Bit, data.isStudentRep ? 1 : 0)
            .input('rep_role', sql.VarChar, data.repRole || null)
            .query(`
                UPDATE dbo.students SET
                    first_name = COALESCE(@first_name, first_name),
                    last_name = COALESCE(@last_name, last_name),
                    program = COALESCE(@program, program),
                    year_of_study = COALESCE(@year_of_study, year_of_study),
                    department = COALESCE(@department, department),
                    phone_number = COALESCE(@phone_number, phone_number),
                    is_student_rep = @is_student_rep,
                    rep_role = @rep_role,
                    updated_at = GETDATE()
                WHERE user_id = @user_id
            `);
    },

    setActive: async (userId, isActive) => {
        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, userId)
            .input('is_active', sql.Bit, isActive ? 1 : 0)
            .query('UPDATE dbo.users SET is_active = @is_active, updated_at = GETDATE() WHERE user_id = @user_id');
    },
};

module.exports = UserModel;
