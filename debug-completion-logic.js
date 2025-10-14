/**
 * DEBUG COMPLETION LOGIC - Print actual values being used in completion logic
 */

const axios = require('axios');
const sql = require('mssql');

async function debugCompletionLogic() {
  console.log('🔍 DEBUG COMPLETION LOGIC VALUES');
  console.log('='.repeat(50));

  try {
    const baseURL = 'http://localhost:8765/api/v1';
    const crypto = require('crypto');
    const randomId = crypto.randomBytes(4).toString('hex');
    const email = `debug-completion-${randomId}@test.com`;

    // Register user
    const registerResponse = await axios.post(`${baseURL}/auth/signup`, {
      email: email,
      password: 'SecureTest123!',
      firstName: 'Debug',
      lastName: 'Completion'
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

    // Add all A-1 answers
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'purpose',
      answerValue: 'Diplomatic, IO & NATO'
    }, { headers });

    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'diplomat',
      answerValue: 'Yes'
    }, { headers });

    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'governmentOfficial',
      answerValue: 'Yes'
    }, { headers });

    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'internationalOrg',
      answerValue: 'No'
    }, { headers });

    console.log('\n📝 All A-1 answers provided');

    // Test completion debug
    console.log('\n🧪 Testing purpose value interpretation...');
    const purposeValue = 'Diplomatic, IO & NATO';
    console.log(`📋 Purpose value: "${purposeValue}"`);
    console.log(`📋 Lower case: "${purposeValue.toLowerCase()}"`);
    console.log(`📋 Contains "diplomatic": ${purposeValue.toLowerCase().includes('diplomatic')}`);
    console.log(`📋 Contains "official": ${purposeValue.toLowerCase().includes('official')}`);
    console.log(`📋 Contains "nato": ${purposeValue.toLowerCase().includes('nato')}`);

    // Check what IsCompleteAsync returns directly by calling next-question
    const nextResponse = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    console.log('\n🎯 IsCompleteAsync result:');
    if (nextResponse.data.isComplete) {
      console.log('✅ COMPLETE');
      console.log(`   Recommendation: ${nextResponse.data.recommendation?.visaType || 'Unknown'}`);
    } else {
      console.log('❌ NOT COMPLETE');
      console.log(`   Next question: ${nextResponse.data.question?.key || 'Unknown'}`);
      console.log(`   Question text: ${nextResponse.data.question?.question || 'Unknown'}`);
    }

    await sql.close();

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugCompletionLogic().catch(console.error);