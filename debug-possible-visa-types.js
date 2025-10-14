/**
 * DEBUG POSSIBLE VISA TYPES - Check how many visa types are returned for A-1 answers
 */

const axios = require('axios');
const sql = require('mssql');

async function debugPossibleVisaTypes() {
  console.log('🔍 DEBUG POSSIBLE VISA TYPES FOR A-1 ANSWERS');
  console.log('='.repeat(60));

  try {
    const baseURL = 'http://localhost:8765/api/v1';
    const crypto = require('crypto');
    const randomId = crypto.randomBytes(4).toString('hex');
    const email = `debug-visa-types-${randomId}@test.com`;

    // Register user
    const registerResponse = await axios.post(`${baseURL}/auth/signup`, {
      email: email,
      password: 'SecureTest123!',
      firstName: 'Debug',
      lastName: 'Types'
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

    console.log(`📝 Testing visa types with incremental A-1 answers...`);

    // Test 1: Just purpose
    console.log('\n🔹 1. Purpose only...');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'purpose',
      answerValue: 'Diplomatic, IO & NATO'
    }, { headers });

    const q1Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    if (q1Response.data.question) {
      console.log(`   Next question: ${q1Response.data.question.key}`);
      console.log(`   Remaining visa types: ${q1Response.data.question.remainingVisaTypes || 'Not provided'}`);
    }

    // Test 2: Add diplomat
    console.log('\n🔹 2. Purpose + Diplomat...');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'diplomat',
      answerValue: 'Yes'
    }, { headers });

    const q2Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    if (q2Response.data.question) {
      console.log(`   Next question: ${q2Response.data.question.key}`);
      console.log(`   Remaining visa types: ${q2Response.data.question.remainingVisaTypes || 'Not provided'}`);
    }

    // Test 3: Add government official
    console.log('\n🔹 3. Purpose + Diplomat + Government Official...');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'governmentOfficial',
      answerValue: 'Yes'
    }, { headers });

    const q3Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    if (q3Response.data.question) {
      console.log(`   Next question: ${q3Response.data.question.key}`);
      console.log(`   Remaining visa types: ${q3Response.data.question.remainingVisaTypes || 'Not provided'}`);
    }

    // Test 4: Add international org
    console.log('\n🔹 4. All A-1 answers...');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'internationalOrg',
      answerValue: 'No'
    }, { headers });

    const q4Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    if (q4Response.data.isComplete) {
      console.log(`   ✅ COMPLETE! Recommendation: ${q4Response.data.recommendation?.visaType || 'Unknown'}`);
    } else if (q4Response.data.question) {
      console.log(`   ❌ Still asking: ${q4Response.data.question.key}`);
      console.log(`   Remaining visa types: ${q4Response.data.question.remainingVisaTypes || 'Not provided'}`);
    }

    await sql.close();

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugPossibleVisaTypes().catch(console.error);