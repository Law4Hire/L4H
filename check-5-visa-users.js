/**
 * CHECK 5 VISA TYPE USERS - Display grid for A-1, A-2, A-3, B-1, B-2 @testing.com users
 */

const sql = require('mssql');

async function check5VisaUsers() {
  console.log('📊 5 VISA TYPE USERS STATUS');
  console.log('='.repeat(50));

  try {
    const config = {
      server: 'localhost',
      port: 14333,
      database: 'L4H',
      user: 'sa',
      password: 'SecureTest123!',
      options: { encrypt: false, trustServerCertificate: true }
    };

    await sql.connect(config);

    // Get the specific 5 users with their visa assignments
    const result = await sql.query`
      SELECT
        u.Email,
        vt.Code as VisaCode
      FROM Users u
      LEFT JOIN Cases c ON u.Id = c.UserId
      LEFT JOIN VisaTypes vt ON c.VisaTypeId = vt.Id
      WHERE u.Email IN ('A-1@testing.com', 'A-2@testing.com', 'A-3@testing.com', 'B-1@testing.com', 'B-2@testing.com')
      ORDER BY u.Email
    `;

    console.log('EMAIL ADDRESS             | VISA TYPE');
    console.log('========================= | ===========');

    const expectedUsers = ['A-1@testing.com', 'A-2@testing.com', 'A-3@testing.com', 'B-1@testing.com', 'B-2@testing.com'];

    expectedUsers.forEach(email => {
      const user = result.recordset.find(u => u.Email === email);
      const visaType = user?.VisaCode || 'None';
      console.log(`${email.padEnd(25)} | ${visaType}`);
    });

    console.log('\n' + '='.repeat(50));

    // Summary
    const foundUsers = result.recordset.length;
    const usersWithVisa = result.recordset.filter(u => u.VisaCode).length;

    console.log(`Users Found: ${foundUsers}/5`);
    console.log(`Users with Visa: ${usersWithVisa}`);
    console.log(`Users without Visa: ${foundUsers - usersWithVisa}`);

    await sql.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

check5VisaUsers().catch(console.error);