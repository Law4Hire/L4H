async function debugC2Specific() {
    console.log('🔍 DEBUGGING C-2 SPECIFIC ISSUE');
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

        // Question 1: Purpose
        const q1Response = await fetch('http://localhost:8765/api/v1/interview/next-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
        });

        const q1Data = await q1Response.json();
        console.log('📋 Q1:', q1Data.question?.key, '→ transit');
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

        // Question 2: Should be governmentOfficial
        const q2Response = await fetch('http://localhost:8765/api/v1/interview/next-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
        });

        const q2Data = await q2Response.json();
        console.log('📋 Q2:', q2Data.question?.key, '→ no');
        console.log('   Remaining visa types:', q2Data.question?.remainingVisaTypes);

        // Answer no to government official
        await fetch('http://localhost:8765/api/v1/interview/answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                sessionId,
                stepNumber: 2,
                questionKey: q2Data.question?.key,
                answerValue: 'no'
            })
        });

        // Question 3: Should be internationalOrg
        const q3Response = await fetch('http://localhost:8765/api/v1/interview/next-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
        });

        const q3Data = await q3Response.json();
        console.log('📋 Q3:', q3Data.question?.key, '→ no');
        console.log('   Remaining visa types:', q3Data.question?.remainingVisaTypes);

        // Answer no to international org
        await fetch('http://localhost:8765/api/v1/interview/answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                sessionId,
                stepNumber: 3,
                questionKey: q3Data.question?.key,
                answerValue: 'no'
            })
        });

        // Question 4: This should be isUNRelated for C-2 vs C-1 discrimination
        const q4Response = await fetch('http://localhost:8765/api/v1/interview/next-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
        });

        const q4Data = await q4Response.json();
        console.log('📋 Q4:', q4Data.question?.key);
        console.log('   Expected: isUNRelated (to distinguish C-2 from C-1)');
        console.log('   Remaining visa types:', q4Data.question?.remainingVisaTypes);
        console.log('   IsComplete:', q4Data.isComplete);

        if (q4Data.isComplete) {
            console.log('❌ PROBLEM: Interview completed without asking isUNRelated!');
            console.log('   Recommendation:', q4Data.recommendation);
        } else if (q4Data.question?.key === 'isUNRelated') {
            console.log('✅ GOOD: Got isUNRelated question as expected');

            // Answer yes to isUNRelated (for C-2)
            await fetch('http://localhost:8765/api/v1/interview/answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionId,
                    stepNumber: 4,
                    questionKey: q4Data.question?.key,
                    answerValue: 'yes'
                })
            });

            // Check completion
            const q5Response = await fetch('http://localhost:8765/api/v1/interview/next-question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sessionId })
            });

            const q5Data = await q5Response.json();
            if (q5Data.isComplete) {
                console.log('✅ Interview completed with recommendation:', q5Data.recommendation?.visaType);
            } else {
                console.log('🔄 More questions needed:', q5Data.question?.key);
            }
        } else {
            console.log('❌ WRONG: Expected isUNRelated, got', q4Data.question?.key);
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

debugC2Specific().catch(console.error);