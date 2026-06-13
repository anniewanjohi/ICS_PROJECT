const sql = require('mssql');
require('dotenv').config();

console.log('📋 Loading database configuration...');
console.log(`   DB_HOST: ${process.env.DB_HOST}`);
console.log(`   DB_NAME: ${process.env.DB_NAME}`);
console.log(`   Using Windows Auth: ${process.env.DB_TRUSTED_CONNECTION === 'true'}`);

const config = {
    server: process.env.DB_HOST || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'ICS_PROJECT',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
};

// Use Windows Authentication if specified
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
    config.options.trustedConnection = true;
    console.log('✅ Using Windows Authentication');
} else {
    // Use SQL Server Authentication
    config.user = process.env.DB_USER;
    config.password = process.env.DB_PASSWORD;
    console.log('✅ Using SQL Server Authentication');
    console.log(`   User: ${config.user}`);
}

let pool = null;

async function getConnection() {
    try {
        if (pool && pool.connected) {
            return pool;
        }
        
        console.log('\n🔄 Connecting to SQL Server...');
        console.log(`   Server: ${config.server}`);
        console.log(`   Database: ${config.database}`);
        
        pool = await sql.connect(config);
        console.log('✅ Database connected successfully!\n');
        return pool;
    } catch (error) {
        console.error('\n❌ Database connection failed!');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code || 'N/A'}`);
        
        // Helpful troubleshooting messages
        if (error.message.includes('Login failed')) {
            console.error('\n💡 Troubleshooting:');
            console.error('   - Check your username and password');
            console.error('   - Make sure the user has access to the database');
        } else if (error.message.includes('Cannot find')) {
            console.error('\n💡 Troubleshooting:');
            console.error('   - Check the server name format');
            console.error('   - Try using: localhost\\SQLEXPRESS');
            console.error('   - Try using: .\\SQLEXPRESS');
        } else if (error.message.includes('timeout')) {
            console.error('\n💡 Troubleshooting:');
            console.error('   - Make sure SQL Server is running');
            console.error('   - Check if TCP/IP is enabled in SQL Server Configuration Manager');
            console.error('   - Check if Windows Firewall is blocking port 1433');
        }
        
        throw error;
    }
}

module.exports = { getConnection, sql };