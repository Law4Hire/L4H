const { execSync } = require('child_process');

console.log('🧪 Testing Adaptive Interview Workflow - Family-Based Immigration Scenario');

// Test scenario: User moving to USA to be with husband who is US citizen
const testScenario = {
  email: 'sally.immigrant@example.com',
  password: 'SecureTest123!',
  scenario: 'Family-based Immigration - Spouse of US Citizen'
};

// Function to test API endpoint
async function testEndpoint(url, method = 'GET', data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const curlCommand = [
    'timeout', '30', 'curl', '-s',
    '-X', method,
    '-H', '"Content-Type: application/json"',
    token ? `-H "Authorization: Bearer ${token}"` : '',
    data ? `-d '${JSON.stringify(data)}'` : '',
    `"http://localhost:8765${url}"`
  ].filter(Boolean).join(' ');

  try {
    console.log(`📡 Testing: ${method} ${url}`);
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
    return JSON.parse(result);
  } catch (error) {
    console.error(`❌ Error testing ${url}:`, error.message);
    return null;
  }
}

async function runFamilyImmigrationTest() {
  try {
    // Step 1: Login with existing user
    console.log('\n1️⃣ Logging in as Sally...');
    const loginResponse = await testEndpoint('/api/v1/auth/login', 'POST', {
      email: testScenario.email,
      password: testScenario.password
    });

    if (!loginResponse || !loginResponse.token) {
      console.error('❌ Login failed or no token received');
      return;
    }

    console.log('✅ Login successful');
    const token = loginResponse.token;

    // Step 2: Start interview session
    console.log('\n2️⃣ Starting interview session...');
    const startResponse = await testEndpoint('/api/v1/interview/start', 'POST', {
      caseId: loginResponse.user?.caseId || 1
    }, token);

    if (!startResponse || !startResponse.sessionId) {
      console.error('❌ Failed to start interview session');
      return;
    }

    console.log('✅ Interview session started:', startResponse.sessionId);
    const sessionId = startResponse.sessionId;

    // Step 3: Get first question
    console.log('\n3️⃣ Getting first adaptive question...');
    let questionResponse = await testEndpoint('/api/v1/interview/next-question', 'POST', {
      sessionId: sessionId
    }, token);

    if (!questionResponse || questionResponse.isComplete) {
      console.error('❌ Failed to get first question or interview already complete');
      return;
    }

    console.log('✅ First question received:');
    console.log(`   Question: ${questionResponse.question?.question}`);
    console.log(`   Type: ${questionResponse.question?.type}`);
    console.log(`   Remaining visa types: ${questionResponse.question?.remainingVisaTypes}`);

    let questionCount = 1;

    // Step 4: Answer questions systematically for family immigration
    const familyScenarioAnswers = [
      { key: 'purpose', value: 'family', description: 'Family/Personal purpose' },
      { key: 'familyRelationship', value: 'spouse', description: 'Relationship to US family member' },
      { key: 'usFamilyStatus', value: 'citizen', description: 'US family member citizenship status' }
    ];

    // Answer questions until completion
    while (!questionResponse.isComplete && questionCount <= 5) {
      const currentQuestion = questionResponse.question;

      // Find the appropriate answer for this question
      const answerData = familyScenarioAnswers.find(a => a.key === currentQuestion.key);

      if (!answerData) {
        console.log(`⚠️  Unexpected question key: ${currentQuestion.key}`);
        console.log(`   Available options: ${currentQuestion.options?.map(o => o.value).join(', ')}`);

        // Use first available option as fallback
        answerData = {
          key: currentQuestion.key,
          value: currentQuestion.options?.[0]?.value || 'unknown',
          description: 'Fallback answer'
        };
      }

      console.log(`\n📝 Answering question ${questionCount}: ${answerData.description}`);
      console.log(`   Question: ${currentQuestion.question}`);
      console.log(`   Answer: ${answerData.value}`);

      // Submit answer
      const answerResponse = await testEndpoint('/api/v1/interview/answer', 'POST', {
        sessionId: sessionId,
        stepNumber: questionCount,
        questionKey: currentQuestion.key,
        answerValue: answerData.value
      }, token);

      if (!answerResponse) {
        console.error('❌ Failed to submit answer');
        break;
      }

      console.log('✅ Answer submitted successfully');

      // Get next question
      questionResponse = await testEndpoint('/api/v1/interview/next-question', 'POST', {
        sessionId: sessionId
      }, token);

      if (!questionResponse) {
        console.error('❌ Failed to get next question');
        break;
      }

      if (questionResponse.isComplete) {
        console.log('\n🎯 Interview completed!');
        console.log(`   Total questions asked: ${questionCount}`);
        console.log(`   Recommended visa: ${questionResponse.recommendation?.visaType || 'None'}`);
        console.log(`   Rationale: ${questionResponse.recommendation?.rationale || 'None'}`);

        // Validate recommendation for family scenario
        const recommendedVisa = questionResponse.recommendation?.visaType;
        if (recommendedVisa && (recommendedVisa.includes('K-1') || recommendedVisa.includes('CR-1') || recommendedVisa.includes('IR-1'))) {
          console.log('✅ CORRECT: Recommended visa is appropriate for spouse of US citizen scenario');
        } else {
          console.log(`❌ INCORRECT: Recommended visa "${recommendedVisa}" is not appropriate for spouse of US citizen scenario`);
          console.log('   Expected: K-1 (Fiancé), CR-1/IR-1 (Spouse), or similar family-based visa');
        }

        break;
      } else {
        questionCount++;
        console.log(`   Next question: ${questionResponse.question?.question}`);
        console.log(`   Remaining visa types: ${questionResponse.question?.remainingVisaTypes}`);
      }
    }

    // Step 5: Validate efficiency
    console.log('\n📊 Interview Efficiency Analysis:');
    console.log(`   Questions asked: ${questionCount}`);
    console.log(`   Target: ≤3 questions for clear family scenarios`);

    if (questionCount <= 3) {
      console.log('✅ EFFICIENT: Interview completed within target question count');
    } else {
      console.log('⚠️  IMPROVEMENT NEEDED: Interview took more questions than optimal');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

console.log('\n🚀 Starting family-based immigration interview test...');
console.log(`📋 Scenario: ${testScenario.scenario}`);
console.log(`👤 Test user: ${testScenario.email}`);

runFamilyImmigrationTest().then(() => {
  console.log('\n✅ Test completed');
}).catch(error => {
  console.error('\n❌ Test failed:', error.message);
});