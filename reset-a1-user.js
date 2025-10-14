/**
 * RESET A-1 USER - Clear interview data to test fresh workflow
 */

const sql = require('mssql');

async function resetA1User() {
  console.log('🔄 RESET A-1 USER FOR FRESH TESTING');
  console.log('='.repeat(50));

  const testEmail = 'A-1@testing.com';

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
    console.log('✅ Connected to database');

    // Get user info
    const userResult = await sql.query`
      SELECT u.Id, u.Email, c.Id as CaseId
      FROM Users u
      LEFT JOIN Cases c ON u.Id = c.UserId
      WHERE u.Email = ${testEmail}
    `;

    if (userResult.recordset.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = userResult.recordset[0];
    console.log(`📄 Found user: ${user.Email} (ID: ${user.Id})`);
    console.log(`📄 Case ID: ${user.CaseId}`);

    // Clear interview sessions and QAs
    console.log('\n🧹 Clearing interview data...');

    await sql.query`
      DELETE FROM InterviewQAs
      WHERE SessionId IN (
        SELECT Id FROM InterviewSessions WHERE UserId = ${user.Id}
      )
    `;
    console.log('✅ Deleted InterviewQAs');

    await sql.query`
      DELETE FROM InterviewSessions
      WHERE UserId = ${user.Id}
    `;
    console.log('✅ Deleted InterviewSessions');

    // Clear visa recommendations
    await sql.query`
      DELETE FROM VisaRecommendations
      WHERE CaseId = ${user.CaseId}
    `;
    console.log('✅ Deleted VisaRecommendations');

    // Reset case visa type to null
    await sql.query`
      UPDATE Cases
      SET VisaTypeId = NULL,
          Status = 'active',
          UpdatedAt = GETDATE()
      WHERE Id = ${user.CaseId}
    `;
    console.log('✅ Reset Case VisaTypeId to NULL');

    // Verify reset
    const verifyResult = await sql.query`
      SELECT
        u.Email,
        c.VisaTypeId,
        vt.Code as VisaCode,
        COUNT(i.Id) as InterviewSessionCount,
        COUNT(vr.Id) as RecommendationCount
      FROM Users u
      LEFT JOIN Cases c ON u.Id = c.UserId
      LEFT JOIN VisaTypes vt ON c.VisaTypeId = vt.Id
      LEFT JOIN InterviewSessions i ON u.Id = i.UserId
      LEFT JOIN VisaRecommendations vr ON c.Id = vr.CaseId
      WHERE u.Email = ${testEmail}
      GROUP BY u.Email, c.VisaTypeId, vt.Code
    `;

    const verify = verifyResult.recordset[0];
    console.log('\n📊 Reset Verification:');
    console.log(`   Email: ${verify.Email}`);
    console.log(`   Visa Code: ${verify.VisaCode || 'NULL ✅'}`);
    console.log(`   Interview Sessions: ${verify.InterviewSessionCount}`);
    console.log(`   Recommendations: ${verify.RecommendationCount}`);

    if (!verify.VisaCode && verify.InterviewSessionCount === 0 && verify.RecommendationCount === 0) {
      console.log('\n🎉 RESET SUCCESSFUL! User ready for fresh interview.');
    } else {
      console.log('\n⚠️  Reset may not be complete - check manually');
    }

    await sql.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetA1User().catch(console.error);