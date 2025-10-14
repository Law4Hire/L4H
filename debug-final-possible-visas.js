/**
 * DEBUG FINAL POSSIBLE VISAS - Check what visa types are actually in the final possible list
 */

const axios = require('axios');
const sql = require('mssql');

async function debugFinalPossibleVisas() {
  console.log('🔍 DEBUG FINAL POSSIBLE VISAS FOR A-3');
  console.log('='.repeat(60));

  try {
    const baseURL = 'http://localhost:8765/api/v1';
    const crypto = require('crypto');
    const randomId = crypto.randomBytes(4).toString('hex');
    const email = `debug-final-${randomId}@test.com`;

    // Register user
    const registerResponse = await axios.post(`${baseURL}/auth/signup`, {
      email: email,
      password: 'SecureTest123!',
      firstName: 'Debug',
      lastName: 'Final'
    });

    const token = registerResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Get case ID
    const config = {
      server: 'localhost',
      port: 14333,
      database: 'L4H',
      user: 'sa',
      password: 'SecureTest123!',
      options: { encrypt: false, trustServerCertificate: true }
    };

    await sql.connect(config);
    const caseResult = await sql.query`
      SELECT c.Id as CaseId FROM Cases c
      INNER JOIN Users u ON c.UserId = u.Id
      WHERE u.Email = ${email}
    `;

    const caseId = caseResult.recordset[0].CaseId;

    // Start interview
    const startResponse = await axios.post(`${baseURL}/interview/start`, {
      CaseId: caseId
    }, { headers });
    const sessionId = startResponse.data.sessionId;

    console.log(`🎯 Interview started: ${sessionId}`);

    // Add A-3 answers step by step - same as the test case
    const answers = {
      purpose: 'Diplomatic, IO & NATO',
      diplomat: 'No',
      governmentOfficial: 'No',
      workingForDiplomat: 'Yes',
      internationalOrg: 'No',
      workingForInternationalOrg: 'No'
    };

    console.log('\\n🔹 Adding A-3 answers step by step...');

    for (const [key, value] of Object.entries(answers)) {
      console.log(`   Adding ${key}: ${value}`);
      await axios.post(`${baseURL}/interview/answer`, {
        sessionId: sessionId,
        questionKey: key,
        answerValue: value
      }, { headers });

      const nextResponse = await axios.post(`${baseURL}/interview/next-question`, {
        sessionId: sessionId
      }, { headers });

      console.log(`   -> Remaining: ${nextResponse.data.question?.remainingVisaTypes || 'Complete'}, Next: ${nextResponse.data.question?.key || 'None'}`);

      if (nextResponse.data.isComplete) {
        console.log(`\\n🎯 INTERVIEW COMPLETED!`);
        console.log(`   Recommendation: ${nextResponse.data.recommendation?.visaType || 'Unknown'}`);
        console.log(`   Expected: A-3`);
        console.log(`   Status: ${nextResponse.data.recommendation?.visaType === 'A-3' ? '✅ CORRECT' : '❌ INCORRECT'}`);

        // Try to get the possible visa types from the database right before completion
        const sessionDataResult = await sql.query`
          SELECT qa.QuestionKey, qa.AnswerValue
          FROM InterviewQAs qa
          INNER JOIN InterviewSessions ins ON qa.SessionId = ins.Id
          WHERE ins.Id = ${sessionId}
          ORDER BY qa.CreatedAt
        `;

        console.log(`\\n📊 All stored answers:`);
        sessionDataResult.recordset.forEach(row => {
          console.log(`   ${row.QuestionKey}: ${row.AnswerValue}`);
        });

        break;
      }
    }

    await sql.close();

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
  }
}

debugFinalPossibleVisas().catch(console.error);