const bcrypt = require('bcrypt');
const sql = require('mssql');

// Database configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
const dbConfig = {
    user: 'appuser',
    password: 'annie1234',  // Update this
    server: 'localhost\\SQLEXPRESS',
    database: 'ICS_PROJECT',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// User to update
const email = 'student@strathmore.edu';
const plainPassword = 'Student@123';

async function resetPassword() {
    try {
        // Generate hash
        console.log('🔐 Generating password hash...');
        const saltRounds = 10;
        const hash = await bcrypt.hash(plainPassword, saltRounds);
        console.log('✅ Hash generated:', hash);
        
        // Connect to database
        console.log('📡 Connecting to database...');
        await sql.connect(dbConfig);
        console.log('✅ Connected to database');
        
        // Update password
        console.log('📝 Updating user password...');
        const result = await sql.query`
            UPDATE Users 
            SET password_hash = ${hash}
            WHERE email = ${email}
        `;
        
        console.log(`✅ Password updated for ${email}`);
        console.log(`📊 Rows affected: ${result.rowsAffected[0]}`);
        
        // Verify the update
        console.log('🔍 Verifying update...');
        const verifyResult = await sql.query`
            SELECT email, password_hash 
            FROM Users 
            WHERE email = ${email}
        `;
        
        if (verifyResult.recordset.length > 0) {
            console.log('✅ Verification successful!');
            console.log('📧 Email:', verifyResult.recordset[0].email);
            console.log('🔑 Hash:', verifyResult.recordset[0].password_hash);
            console.log('\n🔐 You can now login with:');
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${plainPassword}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('📋 Details:', error);
    } finally {
        // Close database connection
        await sql.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the function
resetPassword();