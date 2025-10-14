async function debugTransitQuestions() {
    console.log('🔍 DEBUGGING TRANSIT QUESTIONS');
    console.log('==============================');

    try {
        // Login
        const loginResponse = await fetch('http://localhost:8765/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'Testing1000A1@testing.com',
                password: 'SecureTest123!'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Login successful');

        // Start interview
        const startResponse = await fetch('http://localhost:8765/api/v1/interview/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                caseId: "4e24641c-2a55-4a7f-97e6-44bc7132bbe6"
            })
        });

        const startData = await startResponse.json();
        const sessionId = startData.sessionId;
        console.log('✅ Interview started');

        // Get first question
        const q1Response = await fetch('http://localhost:8765/api/v1/interview/next-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
        });

        const q1Data = await q1Response.json();
        console.log('📋 Q1:', q1Data.question?.key, '(should be purpose)');
        console.log('   Question text:', q1Data.question?.question);
        console.log('   Remaining visa types:', q1Data.question?.remainingVisaTypes);

        // Answer transit
        await fetch('http://localhost:8765/api/v1/interview/answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                sessionId,
                stepNumber: 1,
                questionKey: q1Data.question?.key,
                answerValue: 'transit'
            })
        });
        console.log('✅ Answered: transit');

        // Get next question - this is where the issue occurs
        const q2Response = await fetch('http://localhost:8765/api/v1/interview/next-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
        });

        const q2Data = await q2Response.json();
        console.log('\n📋 Q2:', q2Data.question?.key);
        console.log('   Expected: governmentOfficial');
        console.log('   Question text:', q2Data.question?.question);
        console.log('   Remaining visa types:', q2Data.question?.remainingVisaTypes);
        console.log('   IsComplete:', q2Data.isComplete);

        if (q2Data.question?.key === 'governmentOfficial') {
            console.log('✅ CORRECT: Got governmentOfficial as expected');
        } else {
            console.log('❌ WRONG: Expected governmentOfficial, got', q2Data.question?.key);
        }

        // Let's also check what all possible questions are available
        console.log('\n🔍 Let me try to get all possible questions by trying common ones:');

        const commonQuestions = ['governmentOfficial', 'internationalOrg', 'isUNRelated', 'familyRelationship'];
        for (const qKey of commonQuestions) {
            try {
                // Try to answer with each question key to see if it exists
                const testResponse = await fetch('http://localhost:8765/api/v1/interview/answer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        sessionId,
                        stepNumber: 2,
                        questionKey: qKey,
                        answerValue: 'test'
                    })
                });

                if (testResponse.ok) {
                    console.log(`   ✅ Question "${qKey}" exists`);
                } else {
                    console.log(`   ❌ Question "${qKey}" does not exist or failed`);
                }
            } catch (e) {
                console.log(`   ❌ Question "${qKey}" failed:`, e.message);
            }
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

debugTransitQuestions().catch(console.error);