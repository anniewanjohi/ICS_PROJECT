const sql = require('mssql');

const configs = [
    {
        name: "SQLEXPRESS (your main instance)",
        config: {
            server: 'localhost\\SQLEXPRESS',
            database: 'ICS_PROJECT',
            user: 'appuser',
            password: 'annie1234',
            options: {
                trustServerCertificate: true,
                encrypt: false,
                enableArithAbort: true
            }
        }
    },
    {
        name: "SQLEXPRESS01 (second instance)",
        config: {
            server: 'localhost\\SQLEXPRESS01',
            database: 'ICS_PROJECT',
            user: 'appuser',
            password: 'annie1234',
            options: {
                trustServerCertificate: true,
                encrypt: false,
                enableArithAbort: true
            }
        }
    }
];

async function testConnections() {
    console.log("Testing connections to SQL Server instances...\n");
    
    let connected = false;
    
    for (const test of configs) {
        try {
            console.log(`🔄 Trying ${test.name}...`);
            await sql.connect(test.config);
            
            // Fixed query - removed 'current_time' reserved word
            const result = await sql.query`SELECT @@SERVERNAME as server_name, GETDATE() as server_time, DB_NAME() as database_name`;
            
            console.log(`✅ SUCCESS! Connected to ${test.name}`);
            console.log(`   Server: ${result.recordset[0].server_name}`);
            console.log(`   Database: ${result.recordset[0].database_name}`);
            console.log(`   Server Time: ${result.recordset[0].server_time}`);
            
            await sql.close();
            connected = true;
            
            console.log(`\n💡 Use this in your .env file:`);
            console.log(`DB_SERVER=localhost\\${test.name.split(' ')[0]}`);
            console.log(`DB_NAME=ICS_PROJECT`);
            console.log(`DB_USER=appuser`);
            console.log(`DB_PASSWORD=annie1234`);
            
            break;
        } catch (err) {
            console.log(`❌ Failed: ${err.message}\n`);
        }
    }
    
    if (!connected) {
        console.log("\n❌ Could not connect to any instance.");
        console.log("\nLet's check the user credentials...");
        await testWithWindowsAuth();
    }
}

async function testWithWindowsAuth() {
    console.log("\n🔄 Trying with Windows Authentication...");
    
    const config = {
        server: 'localhost\\SQLEXPRESS',
        database: 'ICS_PROJECT',
        options: {
            trustServerCertificate: true,
            encrypt: false,
            enableArithAbort: true
        },
        authentication: {
            type: 'default',
            options: {
                userName: '',  // Empty for Windows auth
                password: ''
            }
        }
    };
    
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT @@SERVERNAME as server_name, GETDATE() as server_time`;
        console.log(`✅ Connected with Windows Authentication!`);
        console.log(`   Server: ${result.recordset[0].server_name}`);
        console.log(`   Server Time: ${result.recordset[0].server_time}`);
        await sql.close();
        
        console.log("\n💡 Your SQL Server uses Windows Authentication.");
        console.log("You need to create the 'appuser' login or use Windows Auth.");
        
    } catch (err) {
        console.log(`❌ Windows Auth failed: ${err.message}`);
        console.log("\n📝 You need to create the 'appuser' login in SQL Server.");
        console.log("\nRun this in SSMS:");
        console.log("-- Create login");
        console.log("CREATE LOGIN appuser WITH PASSWORD = 'annie1234';");
        console.log("USE ICS_PROJECT;");
        console.log("CREATE USER appuser FOR LOGIN appuser;");
        console.log("ALTER ROLE db_owner ADD MEMBER appuser;");
    }
}

testConnections();