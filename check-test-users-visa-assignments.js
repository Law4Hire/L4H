/**
 * CHECK TEST USERS VISA ASSIGNMENTS - Display grid of users and their assigned visa types
 */

const sql = require('mssql');

async function checkTestUsersVisaAssignments() {
  console.log('📊 TEST USERS VISA ASSIGNMENTS');
  console.log('='.repeat(60));

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

    // Get all users created during testing with their visa assignments
    const result = await sql.query`
      SELECT
        u.Email,
        u.CreatedAt,
        vt.Code as VisaCode,
        vt.Name as VisaName
      FROM Users u
      LEFT JOIN Cases c ON u.Id = c.UserId
      LEFT JOIN VisaTypes vt ON c.VisaTypeId = vt.Id
      WHERE u.Email LIKE '%test%'
         OR u.Email LIKE '%fresh%'
         OR u.Email LIKE '%caseid%'
         OR u.Email LIKE '%diplomat%'
         OR u.Email LIKE '%embassy%'
      ORDER BY u.CreatedAt DESC
    `;

    console.log(`Found ${result.recordset.length} test users:\n`);

    // Display grid header
    console.log('EMAIL ADDRESS'.padEnd(40) + ' | ' + 'VISA TYPE');
    console.log('='.repeat(40) + ' | ' + '='.repeat(20));

    // Display each user
    result.recordset.forEach(user => {
      const email = user.Email.padEnd(40);
      const visaType = user.VisaCode || 'None';
      console.log(`${email} | ${visaType}`);
    });

    // Summary statistics
    const totalUsers = result.recordset.length;
    const usersWithVisa = result.recordset.filter(u => u.VisaCode).length;
    const usersWithoutVisa = totalUsers - usersWithVisa;

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log(`Total Test Users: ${totalUsers}`);
    console.log(`Users with Visa Types: ${usersWithVisa}`);
    console.log(`Users without Visa Types: ${usersWithoutVisa}`);

    // Breakdown by visa type
    const visaBreakdown = {};
    result.recordset.forEach(user => {
      const visa = user.VisaCode || 'None';
      visaBreakdown[visa] = (visaBreakdown[visa] || 0) + 1;
    });

    console.log('\nVISA TYPE BREAKDOWN:');
    Object.entries(visaBreakdown).forEach(([visa, count]) => {
      console.log(`  ${visa}: ${count} user(s)`);
    });

    await sql.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTestUsersVisaAssignments().catch(console.error);