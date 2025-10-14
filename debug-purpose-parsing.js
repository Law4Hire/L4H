/**
 * DEBUG PURPOSE PARSING - Check how purpose is being parsed and stored
 */

const axios = require('axios');
const sql = require('mssql');

async function debugPurposeParsing() {
  console.log('🔍 DEBUG PURPOSE PARSING');
  console.log('='.repeat(60));

  try {
    const baseURL = 'http://localhost:8765/api/v1';
    const crypto = require('crypto');
    const randomId = crypto.randomBytes(4).toString('hex');
    const email = `debug-purpose-${randomId}@test.com`;

    // Register user
    const registerResponse = await axios.post(`${baseURL}/auth/signup`, {
      email: email,
      password: 'SecureTest123!',
      firstName: 'Debug',
      lastName: 'Purpose'
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

    // Test the purpose value that A-3 test uses
    const purposeValue = 'Diplomatic, IO & NATO';
    console.log(`\\n🔹 Adding purpose: "${purposeValue}"`);

    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: 'purpose',
      answerValue: purposeValue
    }, { headers });

    // Check what's stored in the database
    const dbResult = await sql.query`
      SELECT qa.QuestionKey, qa.AnswerValue
      FROM InterviewQAs qa
      INNER JOIN InterviewSessions ins ON qa.SessionId = ins.Id
      WHERE ins.Id = ${sessionId} AND qa.QuestionKey = 'purpose'
    `;

    console.log(`\\n📊 Database stored value:`);
    if (dbResult.recordset.length > 0) {
      const stored = dbResult.recordset[0];
      console.log(`   Raw stored: "${stored.AnswerValue}"`);
      console.log(`   Lowercase: "${stored.AnswerValue.toLowerCase()}"`);
      console.log(`   Contains 'diplomatic': ${stored.AnswerValue.toLowerCase().includes('diplomatic')}`);
      console.log(`   Contains 'nato': ${stored.AnswerValue.toLowerCase().includes('nato')}`);

      // Test the diplomatic purpose detection logic
      const purpose = stored.AnswerValue.toLowerCase();
      const isDiplomaticPurpose = purpose === "diplomatic" || purpose === "official" ||
                                 purpose.includes("diplomatic") ||
                                 purpose.includes("nato");
      console.log(`   isDiplomaticPurpose: ${isDiplomaticPurpose}`);
    } else {
      console.log(`   ❌ No stored value found!`);
    }

    // Get next question to see if B-2 is filtered out
    const nextResponse = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    console.log(`\\n🔹 After adding purpose:`);
    console.log(`   Remaining visa types: ${nextResponse.data.question?.remainingVisaTypes || 'Not provided'}`);
    console.log(`   Next question: ${nextResponse.data.question?.key || 'None'}`);

    await sql.close();

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugPurposeParsing().catch(console.error);