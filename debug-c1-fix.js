/**
 * DEBUG C-1 FIX - Test if C-1 completion issue is resolved
 */

const axios = require('axios');
const sql = require('mssql');

async function testC1Fix() {
  console.log('🔧 TESTING C-1 COMPLETION FIX');
  console.log('='.repeat(60));

  try {
    const baseURL = 'http://localhost:8765/api/v1';
    const crypto = require('crypto');
    const randomId = crypto.randomBytes(4).toString('hex');
    const email = `c1-fix-test-${randomId}@test.com`;

    // Register user
    const registerResponse = await axios.post(`${baseURL}/auth/signup`, {
      email: email,
      password: 'SecureTest123!',
      firstName: 'C1Fix',
      lastName: 'Test'
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

    console.log(`🎯 Session started: ${sessionId}`);

    // Test C-1 answers step by step
    const answers = {
      purpose: 'Transit',
      governmentOfficial: 'No',
      internationalOrg: 'No',
      isUNRelated: 'No',
      crewMember: 'No'
    };

    console.log('\n🔹 Testing C-1 answers step by step...');

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

      console.log(`   -> Complete: ${nextResponse.data.isComplete}, Next: ${nextResponse.data.question?.key || 'None'}`);

      if (nextResponse.data.isComplete) {
        console.log(`\n🎯 INTERVIEW COMPLETED!`);
        console.log(`   Recommendation: ${nextResponse.data.recommendation?.visaType || 'Unknown'}`);
        console.log(`   Expected: C-1`);
        console.log(`   Status: ${nextResponse.data.recommendation?.visaType === 'C-1' ? '✅ FIXED!' : '❌ STILL BROKEN'}`);
        break;
      }
    }

    await sql.close();

    if (answers.crewMember && !nextResponse.data.isComplete) {
      console.log(`\n❌ C-1 fix failed - still asking for: ${nextResponse.data.question?.key}`);
      console.log(`   This means the completion logic is still not working properly.`);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testC1Fix().catch(console.error);