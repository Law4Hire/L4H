/**
 * DEBUG A-1 API FLOW - Test interview API directly to see what questions should be asked
 */

const axios = require('axios');

async function debugA1APIFlow() {
  console.log('🔍 DEBUG A-1 API FLOW');
  console.log('='.repeat(50));

  try {
    const baseURL = 'http://localhost:8765/api/v1';

    // Login to get token
    console.log('🔑 Login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'A-1@testing.com',
      password: 'SecureTest123!'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log(`✅ Login successful`);

    // Start interview
    console.log('\n🎯 Start interview...');
    const startResponse = await axios.post(`${baseURL}/interview/start`, {}, { headers });
    const sessionId = startResponse.data.sessionId;
    console.log(`✅ Interview started: ${sessionId}`);

    // Question 1: Get first question
    console.log('\n❓ Question 1...');
    const q1Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    console.log(`📝 Q1: ${q1Response.data.question}`);
    console.log(`📋 Options: ${q1Response.data.options.map(o => `"${o.text}"`).join(', ')}`);

    // Answer Q1: Diplomatic, IO & NATO
    console.log('\n🎯 Answer Q1: Diplomatic, IO & NATO');
    const a1Response = await axios.post(`${baseURL}/interview/answer`, {
      sessionId: sessionId,
      questionKey: q1Response.data.key,
      answer: 'Diplomatic, IO & NATO'
    }, { headers });
    console.log(`✅ Q1 answered: ${a1Response.data.success}`);

    // Question 2: Get next question
    console.log('\n❓ Question 2...');
    const q2Response = await axios.post(`${baseURL}/interview/next-question`, {
      sessionId: sessionId
    }, { headers });

    if (q2Response.data.question) {
      console.log(`📝 Q2: ${q2Response.data.question}`);
      console.log(`📋 Options: ${q2Response.data.options.map(o => `"${o.text}"`).join(', ')}`);

      // Answer Q2: A-series path
      console.log('\n🎯 Answer Q2: Diplomat/official government business (A)');
      const a2Response = await axios.post(`${baseURL}/interview/answer`, {
        sessionId: sessionId,
        questionKey: q2Response.data.key,
        answer: 'Diplomat/official government business (A)'
      }, { headers });
      console.log(`✅ Q2 answered: ${a2Response.data.success}`);

      // Question 3: Should ask diplomat question
      console.log('\n❓ Question 3...');
      const q3Response = await axios.post(`${baseURL}/interview/next-question`, {
        sessionId: sessionId
      }, { headers });

      if (q3Response.data.question) {
        console.log(`📝 Q3: ${q3Response.data.question}`);
        console.log(`📋 Options: ${q3Response.data.options.map(o => `"${o.text}"`).join(', ')}`);
        console.log('✅ Q3 EXISTS! Interview is continuing as expected.');

        // Answer Q3: Yes, I am a diplomat
        console.log('\n🎯 Answer Q3: Yes');
        const a3Response = await axios.post(`${baseURL}/interview/answer`, {
          sessionId: sessionId,
          questionKey: q3Response.data.key,
          answer: 'Yes'
        }, { headers });
        console.log(`✅ Q3 answered: ${a3Response.data.success}`);

        // Question 4: Should ask government official question
        console.log('\n❓ Question 4...');
        const q4Response = await axios.post(`${baseURL}/interview/next-question`, {
          sessionId: sessionId
        }, { headers });

        if (q4Response.data.question) {
          console.log(`📝 Q4: ${q4Response.data.question}`);
          console.log(`📋 Options: ${q4Response.data.options.map(o => `"${o.text}"`).join(', ')}`);
          console.log('✅ Q4 EXISTS! Government official question found.');

          // Answer Q4: Yes, government official
          console.log('\n🎯 Answer Q4: Yes');
          const a4Response = await axios.post(`${baseURL}/interview/answer`, {
            sessionId: sessionId,
            questionKey: q4Response.data.key,
            answer: 'Yes'
          }, { headers });
          console.log(`✅ Q4 answered: ${a4Response.data.success}`);

          // Question 5: Should ask international org question
          console.log('\n❓ Question 5...');
          const q5Response = await axios.post(`${baseURL}/interview/next-question`, {
            sessionId: sessionId
          }, { headers });

          if (q5Response.data.question) {
            console.log(`📝 Q5: ${q5Response.data.question}`);
            console.log(`📋 Options: ${q5Response.data.options.map(o => `"${o.text}"`).join(', ')}`);
            console.log('✅ Q5 EXISTS! International org question found.');

            // Answer Q5: No, not international org
            console.log('\n🎯 Answer Q5: No');
            const a5Response = await axios.post(`${baseURL}/interview/answer`, {
              sessionId: sessionId,
              questionKey: q5Response.data.key,
              answer: 'No'
            }, { headers });
            console.log(`✅ Q5 answered: ${a5Response.data.success}`);

            // Final question - should complete now
            console.log('\n❓ Final check...');
            const finalResponse = await axios.post(`${baseURL}/interview/next-question`, {
              sessionId: sessionId
            }, { headers });

            if (finalResponse.data.isComplete) {
              console.log(`✅ Interview completed! Recommendation: ${finalResponse.data.recommendation}`);

              if (finalResponse.data.recommendation === 'A-1') {
                console.log('\n🎉🎉🎉 SUCCESS: A-1 RECOMMENDED! 🎉🎉🎉');
              } else {
                console.log(`\n❌ FAILED: Expected A-1, got ${finalResponse.data.recommendation}`);
              }
            } else {
              console.log('❌ Interview not completed when expected');
            }
          } else {
            console.log('❌ Q5 NOT FOUND - International org question missing');
            console.log(`   Complete: ${q5Response.data.isComplete}`);
            console.log(`   Recommendation: ${q5Response.data.recommendation || 'None'}`);
          }
        } else {
          console.log('❌ Q4 NOT FOUND - Government official question missing');
          console.log(`   Complete: ${q4Response.data.isComplete}`);
          console.log(`   Recommendation: ${q4Response.data.recommendation || 'None'}`);
        }
      } else {
        console.log('❌ Q3 NOT FOUND - Interview completed prematurely');
        console.log(`   Complete: ${q3Response.data.isComplete}`);
        console.log(`   Recommendation: ${q3Response.data.recommendation || 'None'}`);
      }
    } else {
      console.log('❌ Q2 NOT FOUND - Interview completed after Q1');
      console.log(`   Complete: ${q2Response.data.isComplete}`);
      console.log(`   Recommendation: ${q2Response.data.recommendation || 'None'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugA1APIFlow().catch(console.error);