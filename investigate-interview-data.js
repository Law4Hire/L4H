/**
 * INVESTIGATE INTERVIEW DATA - Check interview sessions and answers for the 5 users
 */

const sql = require('mssql');

async function investigateInterviewData() {
  console.log('🔍 INVESTIGATING INTERVIEW DATA FOR 5 USERS');
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

    const emails = ['A-1@testing.com', 'A-2@testing.com', 'A-3@testing.com', 'B-1@testing.com', 'B-2@testing.com'];

    for (const email of emails) {
      console.log(`\n📧 ${email}`);
      console.log('='.repeat(40));

      // Get user and case info
      const userResult = await sql.query`
        SELECT u.Id as UserId, u.Email, c.Id as CaseId, c.VisaTypeId, c.Status as CaseStatus
        FROM Users u
        LEFT JOIN Cases c ON u.Id = c.UserId
        WHERE u.Email = ${email}
      `;

      if (userResult.recordset.length === 0) {
        console.log('❌ User not found');
        continue;
      }

      const user = userResult.recordset[0];
      console.log(`👤 User ID: ${user.UserId}`);
      console.log(`📄 Case ID: ${user.CaseId}`);
      console.log(`📋 Case Status: ${user.CaseStatus}`);
      console.log(`🎫 Visa Type ID: ${user.VisaTypeId || 'None'}`);

      // Check interview sessions
      const sessionsResult = await sql.query`
        SELECT Id, Status, StartedAt, FinishedAt
        FROM InterviewSessions
        WHERE UserId = ${user.UserId}
        ORDER BY StartedAt DESC
      `;

      console.log(`🎯 Interview Sessions: ${sessionsResult.recordset.length}`);
      sessionsResult.recordset.forEach((session, i) => {
        console.log(`   ${i + 1}. ${session.Id} - ${session.Status} (Started: ${session.StartedAt})`);
      });

      // Check interview answers for latest session
      if (sessionsResult.recordset.length > 0) {
        const latestSession = sessionsResult.recordset[0];
        const answersResult = await sql.query`
          SELECT QuestionKey, AnswerValue, AnsweredAt, StepNumber
          FROM InterviewQAs
          WHERE SessionId = ${latestSession.Id}
          ORDER BY StepNumber
        `;

        console.log(`💬 Interview Answers: ${answersResult.recordset.length}`);
        answersResult.recordset.forEach((answer, i) => {
          console.log(`   ${answer.StepNumber}. ${answer.QuestionKey} = "${answer.AnswerValue}"`);
        });
      }

      // Check visa recommendations
      const recommendationsResult = await sql.query`
        SELECT vr.Id, vt.Code as VisaCode, vr.CreatedAt
        FROM VisaRecommendations vr
        LEFT JOIN VisaTypes vt ON vr.VisaTypeId = vt.Id
        WHERE vr.CaseId = ${user.CaseId}
        ORDER BY vr.CreatedAt DESC
      `;

      console.log(`🏆 Visa Recommendations: ${recommendationsResult.recordset.length}`);
      recommendationsResult.recordset.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.VisaCode} (${rec.CreatedAt})`);
      });
    }

    await sql.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

investigateInterviewData().catch(console.error);