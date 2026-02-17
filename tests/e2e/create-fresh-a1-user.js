/**
 * CREATE FRESH A-1 USER - Start completely fresh for testing
 */

const axios = require('axios');

async function createFreshA1User() {
  console.log('🔄 CREATE FRESH A-1 USER');
  console.log('='.repeat(50));

  try {
    const baseURL = 'http://localhost:8765/api/v1';
    const crypto = require('crypto');
    const randomId = crypto.randomBytes(4).toString('hex');
    const email = `a1-fresh-${randomId}@test.com`;

    console.log(`👤 Creating new user: ${email}`);

    // Register new user
    const registerResponse = await axios.post(`${baseURL}/auth/signup`, {
      email: email,
      password: 'SecureTest123!',
      firstName: 'A1',
      lastName: 'Fresh'
    });

    console.log('✅ User created successfully');
    console.log(`🔑 Token: ${registerResponse.data.token}`);

    const token = registerResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Now test the interview flow
    console.log('\n🎯 Start interview...');
    const startResponse = await axios.post(`${baseURL}/interview/start`, {}, { headers });
    const sessionId = startResponse.data.sessionId;
    console.log(`✅ Interview started: ${sessionId}`);

    // Question 1
    console.log('\n❓ Question 1...');
    const q1Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    console.log(`📝 Q1: ${q1Response.data.question}`);
    console.log(`📋 Options: ${q1Response.data.options.map(o => `"${o.text}"`).join(', ')}`);

    // Answer Q1: Diplomatic
    console.log('\n🎯 Answer Q1: Diplomatic, IO & NATO');
    await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: q1Response.data.key,
      answer: 'Diplomatic, IO & NATO'
    }, { headers });
    console.log(`✅ Q1 answered`);

    // Question 2
    console.log('\n❓ Question 2...');
    const q2Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    if (q2Response.data.question) {
      console.log(`📝 Q2: ${q2Response.data.question}`);
      console.log(`📋 Options: ${q2Response.data.options.map(o => `"${o.text}"`).join(', ')}`);

      // Answer Q2: A-series
      console.log('\n🎯 Answer Q2: Diplomat/official government business (A)');
      await axios.post(`${baseURL}/interview/answer`, {
        sessionId: sessionId,
        questionKey: q2Response.data.key,
        answer: 'Diplomat/official government business (A)'
      }, { headers });
      console.log(`✅ Q2 answered`);

      // Question 3
      console.log('\n❓ Question 3...');
      const q3Response = await axios.post(`${baseURL}/interview/next-question`, {
        sessionId: sessionId
      }, { headers });

      if (q3Response.data.question) {
        console.log(`📝 Q3: ${q3Response.data.question}`);
        console.log(`📋 Options: ${q3Response.data.options.map(o => `"${o.text}"`).join(', ')}`);
        console.log('✅ Q3 EXISTS! Interview is asking additional questions.');

        // Check if this is the diplomat question
        if (q3Response.data.question.toLowerCase().includes('diplomat')) {
          console.log('🎯 DIPLOMAT QUESTION FOUND!');
        }

        // Answer Q3
        console.log('\n🎯 Answer Q3: Yes');
        await axios.post(`${baseURL}/interview/answer`, {
          sessionId: sessionId,
          questionKey: q3Response.data.key,
          answer: 'Yes'
        }, { headers });
        console.log(`✅ Q3 answered`);

        // Question 4
        console.log('\n❓ Question 4...');
        const q4Response = await axios.post(`${baseURL}/interview/next-question`, {
          sessionId: sessionId
        }, { headers });

        if (q4Response.data.question) {
          console.log(`📝 Q4: ${q4Response.data.question}`);
          console.log(`📋 Options: ${q4Response.data.options.map(o => `"${o.text}"`).join(', ')}`);

          if (q4Response.data.question.toLowerCase().includes('government')) {
            console.log('🎯 GOVERNMENT OFFICIAL QUESTION FOUND!');
          }

          // Answer Q4
          console.log('\n🎯 Answer Q4: Yes');
          await axios.post(`${baseURL}/interview/answer`, {
            sessionId: sessionId,
            questionKey: q4Response.data.key,
            answer: 'Yes'
          }, { headers });
          console.log(`✅ Q4 answered`);

          // Question 5
          console.log('\n❓ Question 5...');
          const q5Response = await axios.post(`${baseURL}/interview/next-question`, {
            sessionId: sessionId
          }, { headers });

          if (q5Response.data.question) {
            console.log(`📝 Q5: ${q5Response.data.question}`);
            console.log(`📋 Options: ${q5Response.data.options.map(o => `"${o.text}"`).join(', ')}`);

            if (q5Response.data.question.toLowerCase().includes('international')) {
              console.log('🎯 INTERNATIONAL ORG QUESTION FOUND!');
            }

            // Answer Q5
            console.log('\n🎯 Answer Q5: No');
            await axios.post(`${baseURL}/interview/answer`, {
              sessionId: sessionId,
              questionKey: q5Response.data.key,
              answer: 'No'
            }, { headers });
            console.log(`✅ Q5 answered`);

            // Final check
            console.log('\n❓ Final check...');
            const finalResponse = await axios.post(`${baseURL}/interview/next-question`, {
              sessionId: sessionId
            }, { headers });

            if (finalResponse.data.isComplete) {
              console.log(`✅ Interview completed! Recommendation: ${finalResponse.data.recommendation}`);

              // Check database
              console.log('\n🔍 DATABASE CHECK');
              const sql = require('mssql');
              const config = {
                server: 'localhost',
                port: 14333,
                database: 'L4H',
                user: 'sa',
                password: 'SecureTest123!',
                options: { encrypt: false, trustServerCertificate: true }
              };

              await sql.connect(config);
              const result = await sql.query`
                SELECT u.Email, c.VisaTypeId, vt.Code as VisaCode, vt.Name as VisaName
                FROM Users u
                LEFT JOIN Cases c ON u.Id = c.UserId
                LEFT JOIN VisaTypes vt ON c.VisaTypeId = vt.Id
                WHERE u.Email = ${email}
                ORDER BY c.UpdatedAt DESC
              `;

              if (result.recordset.length > 0) {
                const user = result.recordset[0];
                console.log('📄 Database Result:');
                console.log(`   Email: ${user.Email}`);
                console.log(`   Visa Code: ${user.VisaCode || 'NONE'}`);

                if (user.VisaCode === 'A-1') {
                  console.log('\n🎉🎉🎉 SUCCESS: A-1 USER ASSIGNED A-1 VISA! 🎉🎉🎉');
                  console.log('✅ ALL QUESTIONS WERE ASKED!');
                  console.log('✅ COMPLETION PREVENTION LOGIC IS WORKING!');
                } else {
                  console.log(`\n❌ FAILED: Expected A-1, got ${user.VisaCode || 'NONE'}`);
                }
              }
              await sql.close();
            } else {
              console.log('❌ Interview not completed when expected');
            }
          } else {
            console.log('❌ Q5 missing - Interview completed early');
            console.log(`   Complete: ${q5Response.data.isComplete}`);
            console.log(`   Recommendation: ${q5Response.data.recommendation || 'None'}`);
          }
        } else {
          console.log('❌ Q4 missing - Interview completed early');
          console.log(`   Complete: ${q4Response.data.isComplete}`);
          console.log(`   Recommendation: ${q4Response.data.recommendation || 'None'}`);
        }
      } else {
        console.log('❌ Q3 missing - Interview completed early');
        console.log(`   Complete: ${q3Response.data.isComplete}`);
        console.log(`   Recommendation: ${q3Response.data.recommendation || 'None'}`);
      }
    } else {
      console.log('❌ Q2 missing - Interview completed early');
      console.log(`   Complete: ${q2Response.data.isComplete}`);
      console.log(`   Recommendation: ${q2Response.data.recommendation || 'None'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createFreshA1User().catch(console.error);
