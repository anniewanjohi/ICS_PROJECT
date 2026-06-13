// modules/authentication/userModel.js (MSSQL Version)
//const { getConnection, sql } = require('../../config/database');
const { getConnection, sql } = require('../../config/database');

class UserModel {
    static async findByEmail(email) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('email', sql.VarChar, email.toLowerCase())
                .query(`
                    SELECT 
                        user_id, 
                        email, 
                        password_hash, 
                        role, 
                        is_active,
                        created_at,
                        last_login
                    FROM users 
                    WHERE email = @email
                `);
            
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (error) {
            console.error('findByEmail error:', error);
            throw error;
        }
    }

    static async findById(userId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT 
                        user_id, 
                        email, 
                        role, 
                        is_active,
                        created_at
                    FROM users 
                    WHERE user_id = @userId
                `);
            
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (error) {
            console.error('findById error:', error);
            throw error;
        }
    }

    static async create(email, passwordHash, role = 'student') {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('email', sql.VarChar, email.toLowerCase())
                .input('passwordHash', sql.VarChar, passwordHash)
                .input('role', sql.VarChar, role)
                .input('isActive', sql.Bit, true)
                .query(`
                    INSERT INTO users (email, password_hash, role, is_active, created_at)
                    OUTPUT INSERTED.user_id, INSERTED.email, INSERTED.role, INSERTED.is_active, INSERTED.created_at
                    VALUES (@email, @passwordHash, @role, @isActive, GETDATE())
                `);
            
            return result.recordset[0];
        } catch (error) {
            console.error('create error:', error);
            throw error;
        }
    }

    static async updateLastLogin(userId) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    UPDATE users 
                    SET last_login = GETDATE() 
                    WHERE user_id = @userId
                `);
        } catch (error) {
            console.error('updateLastLogin error:', error);
            throw error;
        }
    }

    static async updatePassword(userId, newPasswordHash) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('passwordHash', sql.VarChar, newPasswordHash)
                .query(`
                    UPDATE users 
                    SET password_hash = @passwordHash, updated_at = GETDATE()
                    WHERE user_id = @userId
                `);
        } catch (error) {
            console.error('updatePassword error:', error);
            throw error;
        }
    }

    static async isActive(userId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`SELECT is_active FROM users WHERE user_id = @userId`);
            
            return result.recordset.length > 0 ? result.recordset[0].is_active : false;
        } catch (error) {
            console.error('isActive error:', error);
            throw error;
        }
    }

    static async getUserWithProfile(userId) {
        try {
            const user = await this.findById(userId);
            if (!user) return null;
            
            let profile = null;
            
            if (user.role === 'student') {
                const pool = await getConnection();
                const result = await pool.request()
                    .input('userId', sql.Int, userId)
                    .query(`
                        SELECT student_id, first_name, last_name, student_reg_no, 
                               program, year_of_study, department, phone_number, profile_picture_url
                        FROM students 
                        WHERE user_id = @userId
                    `);
                profile = result.recordset.length > 0 ? result.recordset[0] : null;
            } else if (user.role === 'staff') {
                const pool = await getConnection();
                const result = await pool.request()
                    .input('userId', sql.Int, userId)
                    .query(`
                        SELECT staff_id, staff_type, first_name, last_name, staff_number,
                               title, position, office_location, office_hours, official_email,
                               areas_of_specialization, biography, is_available_for_booking
                        FROM staff_profiles 
                        WHERE user_id = @userId
                    `);
                profile = result.recordset.length > 0 ? result.recordset[0] : null;
            }
            
            return { ...user, profile };
        } catch (error) {
            console.error('getUserWithProfile error:', error);
            throw error;
        }
    }
}

module.exports = UserModel;