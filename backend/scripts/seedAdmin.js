// scripts/seedAdmin.js
// Run this once to create the initial admin account:
// node scripts/seedAdmin.js

require('dotenv').config({ path: '../.env' });
const { connectDB, getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    await connectDB();
    const pool = getPool();

    const adminEmail = 'admin@strathmore.edu';
    const adminPassword = 'Admin@2026!'; // Change this immediately after first login

    // Check if admin already exists
    const existing = await pool.request()
        .input('email', sql.VarChar, adminEmail)
        .query('SELECT user_id FROM users WHERE email = @email');

    if (existing.recordset[0]) {
        console.log('✅ Admin account already exists:', adminEmail);
        process.exit(0);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const result = await pool.request()
        .input('email', sql.VarChar, adminEmail)
        .input('password_hash', sql.VarChar, passwordHash)
        .query(`
            INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
            OUTPUT INSERTED.user_id, INSERTED.email, INSERTED.role
            VALUES (@email, @password_hash, 'admin', 1, GETDATE(), GETDATE())
        `);

    console.log('\n✅ Admin account created successfully!');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login.\n');
    process.exit(0);
};

seedAdmin().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
