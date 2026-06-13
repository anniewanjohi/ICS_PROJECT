const sql = require('mssql');
require('dotenv').config();

async function testConnection() {
    console.log('\n🔍 Testing database connection...\n');
    console.log('Configuration from .env:');
    console.log(`   DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME}`);
    console.log(`   DB_USER: ${process.env.DB_USER || 'Using Windows Auth'}`);
    console.log(`   DB_TRUSTED_CONNECTION: ${process.env.DB_TRUSTED_CONNECTION || 'false'}\n`);
    
    const config = {
        server: process.env.DB_HOST || 'localhost\\SQLEXPRESS',
        database: process.env.DB_NAME || 'ICS_PROJECT',
        port: parseInt(process.env.DB_PORT) || 1433,
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        connectionTimeout: 15000
    };
    
    if (process.env.DB_TRUSTED_CONNECTION === 'true') {
        config.options.trustedConnection = true;
    } else {
        config.user = process.env.DB_USER;
        config.password = process.env.DB_PASSWORD;
    }
    
    try {
        console.log('🔄 Attempting to connect...');
        const pool = await sql.connect(config);
        console.log('✅ Connected successfully!\n');
        
        // Test query
        const result = await pool.request().query(`
            SELECT 
                @@VERSION as version,
                DB_NAME() as databaseName,
                GETDATE() as serverTime,
                USER_NAME() as currentUser
        `);
        
        console.log('📊 Database Info:');
        console.log(`   Database: ${result.recordset[0].databaseName}`);
        console.log(`   Server Time: ${result.recordset[0].serverTime}`);
        console.log(`   Current User: ${result.recordset[0].currentUser}`);
        console.log(`   SQL Version: ${result.recordset[0].version.substring(0, 60)}...\n`);
        
        // Check if users table exists
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'users'
        `);
        
        console.log('📋 Tables:');
        console.log(`   Users table exists: ${tableCheck.recordset[0].count > 0 ? '✅ Yes' : '❌ No'}`);
        
        if (tableCheck.recordset[0].count > 0) {
            const userCount = await pool.request().query('SELECT COUNT(*) as count FROM users');
            console.log(`   Total users: ${userCount.recordset[0].count}`);
        }
        
        await sql.close();
        console.log('\n✅ All tests passed! Your database is ready.\n');
        
    } catch (error) {
        console.error('\n❌ Connection failed!\n');
        console.error('Error details:', error.message);
        
        if (error.code) {
            console.error(`Error code: ${error.code}`);
        }
        
        console.log('\n💡 Troubleshooting steps:');
        console.log('1. Make sure SQL Server is running');
        console.log('   - Open Services (services.msc)');
        console.log('   - Look for "SQL Server (SQLEXPRESS)"');
        console.log('   - Status should be "Running"\n');
        
        console.log('2. Check your connection string:');
        console.log(`   Server: ${config.server}`);
        console.log(`   Database: ${config.database}\n`);
        
        console.log('3. Try these alternative server names in .env:');
        console.log('   - DB_HOST=localhost\\SQLEXPRESS');
        console.log('   - DB_HOST=.\\SQLEXPRESS');
        console.log('   - DB_HOST=Annie-w\\SQLEXPRESS');
        console.log('   - DB_HOST=(local)\\SQLEXPRESS\n');
        
        console.log('4. If using SQL Authentication:');
        console.log('   - Make sure SQL Server Authentication is enabled');
        console.log('   - Check the sa password is correct\n');
        
        console.log('5. If using Windows Authentication:');
        console.log('   - Add DB_TRUSTED_CONNECTION=true to .env');
        console.log('   - Remove DB_USER and DB_PASSWORD\n');
    }
}

testConnection();