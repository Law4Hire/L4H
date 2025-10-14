/**
 * DEBUG A-3 SPECIFIC LOGIC - Check what happens with A-3 answers specifically
 */

const axios = require('axios');
const sql = require('mssql');

async function debugA3Specific() {
  console.log('🔍 DEBUG A-3 SPECIFIC LOGIC');
  console.log('='.repeat(60));

  try {
    const baseURL = 'http://localhost:8765/api/v1';
    const crypto = require('crypto');
    const randomId = crypto.randomBytes(4).toString('hex');
    const email = `debug-a3-${randomId}@test.com`;

    // Register user
    const registerResponse = await axios.post(`${baseURL}/auth/signup`, {
      email: email,
      password: 'SecureTest123!',
      firstName: 'Debug',
      lastName: 'A3'
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

    // Check initial possible visa types
    const initialResponse = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    console.log('\\n📋 Initial possible visa types (before any answers):');
    console.log(`   Count: ${initialResponse.data.question?.remainingVisaTypes || 'Not provided'}`);

    // Add A-3 answers step by step and check possible visa types
    console.log('\\n🔹 1. Adding purpose: Diplomatic, IO & NATO...');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'purpose',
      answerValue: 'Diplomatic, IO & NATO'
    }, { headers });

    const q1Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    console.log(`   Remaining visa types: ${q1Response.data.question?.remainingVisaTypes || 'Not provided'}`);
    console.log(`   Next question: ${q1Response.data.question?.key || 'None'}`);

    console.log('\\n🔹 2. Adding diplomat: No...');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'diplomat',
      answerValue: 'No'
    }, { headers });

    const q2Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    console.log(`   Remaining visa types: ${q2Response.data.question?.remainingVisaTypes || 'Not provided'}`);
    console.log(`   Next question: ${q2Response.data.question?.key || 'None'}`);

    console.log('\\n🔹 3. Adding governmentOfficial: No...');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'governmentOfficial',
      answerValue: 'No'
    }, { headers });

    const q3Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    console.log(`   Remaining visa types: ${q3Response.data.question?.remainingVisaTypes || 'Not provided'}`);
    console.log(`   Next question: ${q3Response.data.question?.key || 'None'}`);

    console.log('\\n🔹 4. Adding workingForDiplomat: Yes...');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'workingForDiplomat',
      answerValue: 'Yes'
    }, { headers });

    const q4Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    console.log(`   Remaining visa types: ${q4Response.data.question?.remainingVisaTypes || 'Not provided'}`);
    console.log(`   Next question: ${q4Response.data.question?.key || 'None'}`);

    console.log('\\n🔹 5. Adding internationalOrg: No...');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'internationalOrg',
      answerValue: 'No'
    }, { headers });

    const q5Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    console.log(`   Remaining visa types: ${q5Response.data.question?.remainingVisaTypes || 'Not provided'}`);
    console.log(`   Next question: ${q5Response.data.question?.key || 'None'}`);

    console.log('\\n🔹 6. Adding workingForInternationalOrg: No...');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'workingForInternationalOrg',
      answerValue: 'No'
    }, { headers });

    const finalResponse = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    if (finalResponse.data.isComplete) {
      console.log(`\\n🎯 COMPLETION RESULT:`);
      console.log(`   Complete: YES`);
      console.log(`   Recommendation: ${finalResponse.data.recommendation?.visaType || 'Unknown'}`);
      console.log(`   Expected: A-3`);
      console.log(`   Status: ${finalResponse.data.recommendation?.visaType === 'A-3' ? '✅ CORRECT' : '❌ INCORRECT'}`);

      // Check what visa types were in the final possible list
      console.log(`\\n🔍 Final possible visa types before recommendation:`);
      console.log(`   Count: ${finalResponse.data.question?.remainingVisaTypes || 'N/A (completed)'}`);

      // Query database for all A-series visa types to see what's available
      const aSeriesResult = await sql.query`
        SELECT Code, Name, IsActive
        FROM VisaTypes
        WHERE Code LIKE 'A-%'
        ORDER BY Code
      `;

      console.log(`\\n📊 Available A-series visa types in database:`);
      aSeriesResult.recordset.forEach(visa => {
        console.log(`   • ${visa.Code}: ${visa.Name} (Active: ${visa.IsActive})`);
      });

    } else {
      console.log(`\\n❌ Still not complete. Next question: ${finalResponse.data.question?.key}`);
      console.log(`   Remaining visa types: ${finalResponse.data.question?.remainingVisaTypes || 'Not provided'}`);
    }

    await sql.close();

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugA3Specific().catch(console.error);