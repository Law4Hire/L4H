
const sql = require('mssql');

async function countUsers() {
  try {
    const config = {
      server: 'localhost',
      port: 14333,
      database: 'L4H',
      user: 'sa',
      password: 'SecureTest123!',
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    };

    await sql.connect(config);

    const result = await sql.query`SELECT COUNT(*) as userCount FROM Users`;
    console.log(`Total users in the system: ${result.recordset[0].userCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error counting users:', error.message);
    process.exit(1);
  }
}

countUsers();
