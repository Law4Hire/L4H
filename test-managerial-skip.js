/**
 * TEST: Managerial Role Question Should Only Appear for L-1 Transfers
 *
 * This test verifies that:
 * 1. When user selects "No" to transfer (sameCompany=no), the managerialRole question is skipped
 * 2. When user selects "Yes" to transfer (sameCompany=yes), the managerialRole question is asked
 */

const API_BASE = 'http://localhost:8765/api/v1';

async function testManagerialQuestionSkip() {
  console.log('\n========================================');
  console.log('TEST: Managerial Role Question Logic');
  console.log('========================================\n');

  const tests = [
    {
      name: 'No Transfer - Should Skip Managerial Question',
      sameCompany: 'no',
      shouldAskManagerial: false
    },
    {
      name: 'Yes Transfer - Should Ask Managerial Question',
      sameCompany: 'yes',
      shouldAskManagerial: true
    }
  ];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---\n`);

    try {
      // Register unique user for this test
      const email = `test-managerial-${Date.now()}-${test.sameCompany}@testing.com`;
      console.log(`Step 1: Registering user ${email}...`);

      const registerResponse = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'Test123!',
          firstName: 'Test',
          lastName: 'User',
          preferredLanguage: 'en-US'
        })
      });

      if (!registerResponse.ok) {
        throw new Error(`Registration failed: ${registerResponse.status}`);
      }

      const registerData = await registerResponse.json();
      const token = registerData.token;
      console.log('  ✓ Registered');

      // Start interview
      console.log('Step 2: Starting interview...');
      const startResponse = await fetch(`${API_BASE}/interview/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ caseId: registerData.caseId })
      });

      if (!startResponse.ok) {
        throw new Error(`Interview start failed: ${startResponse.status}`);
      }

      const startData = await startResponse.json();
      const sessionId = startData.sessionId;
      console.log(`  ✓ Session: ${sessionId}`);

      // Answer questions
      console.log('Step 3: Answering questions...');

      const answers = [
        { key: 'purpose', value: 'employment' },
        { key: 'hasJobOffer', value: 'yes' },
        { key: 'educationLevel', value: 'bachelor' },
        { key: 'sameCompany', value: test.sameCompany }  // The critical answer
      ];

      let foundManagerialQuestion = false;
      let questionCount = 0;

      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];

        // Submit answer
        await fetch(`${API_BASE}/interview/answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionId,
            stepNumber: i + 1,
            questionKey: answer.key,
            answerValue: answer.value
          })
        });

        console.log(`  ✓ Answered: ${answer.key} = ${answer.value}`);

        // Get next question
        const nextResponse = await fetch(`${API_BASE}/interview/next-question`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        });

        const nextData = await nextResponse.json();

        if (nextData.isComplete) {
          console.log('\n  → Interview completed');
          break;
        }

        if (nextData.question) {
          questionCount++;
          const nextKey = nextData.question.key;
          console.log(`  → Next question: ${nextKey}`);

          if (nextKey === 'managerialRole') {
            foundManagerialQuestion = true;
            console.log('  ⚠️  Found managerialRole question!');
            break;
          }

          // If we hit another question after sameCompany, check a few more
          if (i === answers.length - 1 && questionCount < 3) {
            // Answer the next question generically to continue
            await fetch(`${API_BASE}/interview/answer`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                sessionId,
                stepNumber: i + 2,
                questionKey: nextKey,
                answerValue: nextData.question.options?.[0]?.value || 'no'
              })
            });
            i++; // Continue loop
          }
        }
      }

      // Verify result
      console.log('\nStep 4: Verifying result...');
      if (test.shouldAskManagerial && foundManagerialQuestion) {
        console.log('  ✅ PASS: Managerial question WAS asked (expected)');
      } else if (!test.shouldAskManagerial && !foundManagerialQuestion) {
        console.log('  ✅ PASS: Managerial question was NOT asked (expected)');
      } else if (test.shouldAskManagerial && !foundManagerialQuestion) {
        console.log('  ❌ FAIL: Managerial question was NOT asked (but should have been)');
      } else {
        console.log('  ❌ FAIL: Managerial question WAS asked (but should have been skipped)');
      }

    } catch (error) {
      console.error(`\n❌ Error in test:`, error.message);
    }

    console.log('\n' + '='.repeat(50));
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================\n');
}

testManagerialQuestionSkip().catch(console.error);
