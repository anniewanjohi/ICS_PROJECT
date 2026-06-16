const { getPool, sql } = require('../../config/database');

const UserModel = {
    // Find user by email
    findByEmail: async (email) => {
        try {
            const pool = getPool();
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT id, email, password, name FROM Users WHERE email = @email');
            
            return result.recordset[0];
        } catch (error) {
            console.error('findByEmail error:', error);
            throw error;
        }
    },

    // Create new user
    create: async (userData) => {
        try {
            const { email, password, name } = userData;
            const pool = getPool();
            
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('password', sql.NVarChar, password)
                .input('name', sql.NVarChar, name || '')
                .query(`
                    INSERT INTO Users (email, password, name, created_at) 
                    OUTPUT INSERTED.id, INSERTED.email, INSERTED.name
                    VALUES (@email, @password, @name, GETDATE())
                `);
            
            return result.recordset[0];
        } catch (error) {
            console.error('create user error:', error);
            throw error;
        }
    },

    // Find user by id
    findById: async (id) => {
        try {
            const pool = getPool();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT id, email, name, created_at FROM Users WHERE id = @id');
            
            return result.recordset[0];
        } catch (error) {
            console.error('findById error:', error);
            throw error;
        }
    }
};

module.exports = UserModel;