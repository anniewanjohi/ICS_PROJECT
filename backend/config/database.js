const sql = require('mssql');
require('dotenv').config();

// Parse server and instance from DB_SERVER
let serverName = process.env.DB_SERVER || 'localhost';
let instanceName = null;

if (serverName.includes('\\')) {
    const parts = serverName.split('\\');
    serverName = parts[0];
    instanceName = parts[1];
}

const dbConfig = {
    server: serverName,
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

if (instanceName) {
    dbConfig.options.instanceName = instanceName;
}

let pool = null;

const connectDB = async () => {
    try {
        console.log('🔄 Connecting to SQL Server...');
        pool = await sql.connect(dbConfig);
        console.log('✅ Connected to SQL Server Database');
        
        // Test connection
        const result = await pool.request().query('SELECT GETDATE() as currentTime, DB_NAME() as databaseName');
        console.log(`   Database: ${result.recordset[0].databaseName}`);
        console.log(`   Server Time: ${result.recordset[0].currentTime}`);
        
        return pool;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        throw err;
    }
};

// Add getConnection function for your UserModel
const getConnection = () => {
    if (!pool) {
        throw new Error('Database not connected. Call connectDB first.');
    }
    return pool;
};

const getPool = () => {
    if (!pool) {
        throw new Error('Database not connected. Call connectDB first.');
    }
    return pool;
};

const closeConnection = async () => {
    if (pool) {
        await pool.close();
        console.log('Database connection closed');
    }
};

module.exports = { connectDB, getConnection, getPool, closeConnection, sql };