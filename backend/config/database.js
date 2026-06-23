const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'ICS_PROJECT',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

const connectDB = async () => {
    try {
        console.log('🔄 Connecting to SQL Server...');
        console.log(`   Server: ${dbConfig.server}`);
        console.log(`   Database: ${dbConfig.database}`);
        console.log(`   User: ${dbConfig.user}`);
        
        pool = await sql.connect(dbConfig);
        console.log('✅ Connected to SQL Server Database');
        
        const result = await pool.request().query('SELECT GETDATE() as currentTime, DB_NAME() as databaseName');
        console.log(`   Database: ${result.recordset[0].databaseName}`);
        console.log(`   Server Time: ${result.recordset[0].currentTime}`);
        
        return pool;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        throw err;
    }
};

const getConnection = () => {
    if (!pool) {
        throw new Error('Database not connected. Call connectDB first.');
    }
    return pool;
};

module.exports = { connectDB, getConnection, sql };