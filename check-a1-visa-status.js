const sql = require('mssql');

async function checkA1VisaStatus() {
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

    // Get A-1 user ID
    const userResult = await sql.query`
      SELECT Id, Email FROM Users WHERE Email = 'A-1@testing.com'
    `;

    if (userResult.recordset.length === 0) {
      console.log('❌ A-1 user not found');
      return;
    }

    const userId = userResult.recordset[0].Id;
    console.log(`📊 A-1 User ID: ${userId}`);

    // Check Cases table for visa assignment
    const casesResult = await sql.query`
      SELECT c.Id, c.Status, c.VisaTypeId, c.CreatedAt, c.UpdatedAt,
             vt.Code as VisaCode, vt.Name as VisaName
      FROM Cases c
      LEFT JOIN VisaTypes vt ON c.VisaTypeId = vt.Id
      WHERE c.UserId = ${userId}
      ORDER BY c.CreatedAt DESC
    `;

    console.log(`\n📋 Cases for A-1 user (${casesResult.recordset.length} found):`);

    if (casesResult.recordset.length === 0) {
      console.log('❌ No cases found for A-1 user');
      console.log('   This means the interview workflow hasn\'t created a case yet.');
    } else {
      casesResult.recordset.forEach((case_, i) => {
        console.log(`\n   Case ${i + 1}:`);
        console.log(`     ID: ${case_.Id}`);
        console.log(`     Status: ${case_.Status}`);
        console.log(`     VisaTypeId: ${case_.VisaTypeId || 'NULL'}`);
        console.log(`     Visa Code: ${case_.VisaCode || 'NONE'}`);
        console.log(`     Visa Name: ${case_.VisaName || 'NONE'}`);
        console.log(`     Created: ${case_.CreatedAt}`);
        console.log(`     Updated: ${case_.UpdatedAt}`);

        if (case_.VisaCode === 'A-1') {
          console.log(`     ✅ SUCCESS: A-1 visa correctly assigned!`);
        } else if (case_.VisaTypeId) {
          console.log(`     ⚠️ WRONG VISA: Expected A-1, got ${case_.VisaCode}`);
        } else {
          console.log(`     ❌ NO VISA: Case exists but no visa assigned`);
        }
      });
    }

    // Check interview sessions
    const sessionResult = await sql.query`
      SELECT Id, Status, StartedAt, FinishedAt
      FROM InterviewSessions
      WHERE UserId = ${userId}
      ORDER BY StartedAt DESC
    `;

    console.log(`\n📋 Interview Sessions for A-1 user (${sessionResult.recordset.length} found):`);
    sessionResult.recordset.forEach((session, i) => {
      console.log(`   Session ${i + 1}: ${session.Status} (Started: ${session.StartedAt}, Finished: ${session.FinishedAt || 'None'})`);
    });

    await sql.close();

    // Summary
    console.log(`\n📄 SUMMARY FOR A-1 USER:`);
    if (casesResult.recordset.length === 0) {
      console.log('❌ NO VISA ASSIGNMENT: No cases found. Interview workflow needs to be completed.');
    } else {
      const latestCase = casesResult.recordset[0];
      if (latestCase.VisaCode === 'A-1') {
        console.log('✅ SUCCESS: A-1 user correctly assigned A-1 visa!');
      } else if (latestCase.VisaTypeId) {
        console.log(`⚠️ INCORRECT: A-1 user assigned ${latestCase.VisaCode} instead of A-1`);
      } else {
        console.log('❌ INCOMPLETE: Case exists but interview workflow incomplete');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkA1VisaStatus();