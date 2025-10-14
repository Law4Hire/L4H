/**
 * API TEST: L-1A vs L-1B Visa Differentiation
 *
 * This test verifies that the API correctly returns L-1A for executive/manager
 * and L-1B for specialized knowledge roles.
 *
 * Fix applied: Changed InterviewController.cs line 641 from:
 *   VisaType = visaType?.Name ?? "Unknown"
 * To:
 *   VisaType = visaType?.Code ?? "Unknown"
 */

const API_BASE = 'http://localhost:8765/api/v1';

async function testL1APIDifferentiation() {
  console.log('\n========================================');
  console.log('API TEST: L-1A vs L-1B Differentiation');
  console.log('========================================\n');

  const tests = [
    {
      role: 'executive',
      expectedVisa: 'L-1A',
      email: `test-l1a-api-${Date.now()}@testing.com`
    },
    {
      role: 'specialized',
      expectedVisa: 'L-1B',
      email: `test-l1b-api-${Date.now()}@testing.com`
    }
  ];

  for (const test of tests) {
    console.log(`\n--- Testing ${test.expectedVisa} for ${test.role} role ---\n`);

    try {
      // Step 1: Register user
      console.log(`Step 1: Registering user ${test.email}...`);
      const registerResponse = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: test.email,
          password: 'Test123!',
          firstName: test.role === 'executive' ? 'Executive' : 'Specialized',
          lastName: 'Tester',
          preferredLanguage: 'en-US'
        })
      });

      if (!registerResponse.ok) {
        throw new Error(`Registration failed: ${registerResponse.status} ${await registerResponse.text()}`);
      }

      const registerData = await registerResponse.json();
      const token = registerData.token;
      console.log('✓ User registered successfully');

      // Step 2: Get cases
      console.log('Step 2: Getting user cases...');
      const casesResponse = await fetch(`${API_BASE}/cases/my-cases`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!casesResponse.ok) {
        throw new Error(`Cases fetch failed: ${casesResponse.status}`);
      }

      const cases = await casesResponse.json();
      if (!cases || cases.length === 0) {
        throw new Error('No case found');
      }

      const caseId = cases[0].id;
      console.log(`  ✓ Found case ID: ${caseId}`);

      // Step 3: Start interview
      console.log('Step 3: Starting interview...');
      const startResponse = await fetch(`${API_BASE}/interview/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ caseId })
      });

      if (!startResponse.ok) {
        throw new Error(`Interview start failed: ${startResponse.status}`);
      }

      const startData = await startResponse.json();
      const sessionId = startData.sessionId;
      console.log(`  ✓ Session ID: ${sessionId}`);

      // Step 4: Answer questions
      console.log('Step 4: Answering interview questions...');

      const answers = [
        { key: 'purpose', value: 'employment', label: 'Employment' },
        { key: 'hasJobOffer', value: 'yes', label: 'Has sponsor: Yes' },
        { key: 'educationLevel', value: 'bachelor', label: 'Bachelor\'s degree' },
        { key: 'sameCompany', value: 'yes', label: 'Same company: Yes' },
        { key: 'managerialRole', value: test.role, label: `Role: ${test.role}` }
      ];

      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];

        // Submit answer
        const answerResponse = await fetch(`${API_BASE}/interview/answer`, {
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

        if (!answerResponse.ok) {
          throw new Error(`Answer submission failed: ${answerResponse.status}`);
        }

        console.log(`  ✓ ${answer.label}`);

        // Get next question
        const nextResponse = await fetch(`${API_BASE}/interview/next-question`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        });

        if (!nextResponse.ok) {
          throw new Error(`Next question failed: ${nextResponse.status}`);
        }

        const nextData = await nextResponse.json();

        if (nextData.isComplete) {
          console.log('\nStep 5: Interview complete, checking recommendation...');
          const recommendation = nextData.recommendation;

          console.log(`  → Recommendation received: "${recommendation.visaType}"`);
          console.log(`  → Expected visa: "${test.expectedVisa}"`);
          console.log(`  → Rationale: ${recommendation.rationale}`);

          if (recommendation.visaType === test.expectedVisa) {
            console.log(`\n✅ SUCCESS: API correctly returned ${test.expectedVisa} for ${test.role} role`);
          } else {
            console.log(`\n❌ FAILURE: Expected ${test.expectedVisa} but got ${recommendation.visaType}`);
          }
          break;
        }
      }

    } catch (error) {
      console.error(`\n❌ Error testing ${test.expectedVisa}:`, error.message);
    }

    console.log('\n' + '='.repeat(50));
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================\n');
}

testL1APIDifferentiation().catch(console.error);
