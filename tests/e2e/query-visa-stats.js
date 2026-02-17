async function queryVisaStats() {
    console.log('📊 QUERYING COMPLETE VISA SYSTEM STATISTICS');
    console.log('==========================================');

    try {
        // Login to get admin token
        const loginResponse = await fetch('http://localhost:8765/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'dcann@cannlaw.com',
                password: 'SecureTest123!'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Admin login successful');

        // Get database stats if available
        console.log('\n🗄️  CHECKING DATABASE STATISTICS');
        console.log('==================================');

        try {
            const statsResponse = await fetch('http://localhost:8765/api/v1/admin/database-stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (statsResponse.ok) {
                const dbStats = await statsResponse.json();
                console.log('📈 Database Statistics:');
                console.log(`   • Total users: ${dbStats.totalUsers || 'unknown'}`);
                console.log(`   • Users with assigned visa types: ${dbStats.usersWithVisaTypes || 'unknown'}`);
                console.log(`   • Total visa types in system: ${dbStats.totalVisaTypes || 'unknown'}`);
                console.log(`   • Total cases: ${dbStats.totalCases || 'unknown'}`);
                console.log(`   • Cases with assigned visas: ${dbStats.casesWithVisaTypes || 'unknown'}`);
            } else {
                console.log('⚠️  Database stats endpoint not available');
            }
        } catch (e) {
            console.log('⚠️  Could not fetch database stats:', e.message);
        }

        // Try to get visa types list
        console.log('\n📋 ATTEMPTING TO GET VISA TYPES LIST');
        console.log('====================================');

        try {
            const visaTypesResponse = await fetch('http://localhost:8765/api/v1/visa-types', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (visaTypesResponse.ok) {
                const visaTypes = await visaTypesResponse.json();
                console.log(`📝 Total visa types in system: ${visaTypes.length}`);

                if (visaTypes.length > 0) {
                    console.log('\n📋 Available visa types:');
                    visaTypes.forEach((visa, index) => {
                        console.log(`   ${index + 1}. ${visa.code} - ${visa.name}`);
                    });

                    // Group by series
                    const series = {};
                    visaTypes.forEach(visa => {
                        const seriesKey = visa.code.charAt(0);
                        if (!series[seriesKey]) series[seriesKey] = [];
                        series[seriesKey].push(visa.code);
                    });

                    console.log('\n📊 Visa types by series:');
                    Object.keys(series).sort().forEach(seriesKey => {
                        console.log(`   • ${seriesKey}-series: ${series[seriesKey].join(', ')} (${series[seriesKey].length} types)`);
                    });
                }
            } else {
                console.log('⚠️  Visa types endpoint returned:', visaTypesResponse.status);
            }
        } catch (e) {
            console.log('⚠️  Could not fetch visa types:', e.message);
        }

        // Check interview questions available
        console.log('\n❓ INTERVIEW QUESTIONS ANALYSIS');
        console.log('===============================');

        try {
            // Start a test interview to see what questions are available
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

            if (startResponse.ok) {
                const startData = await startResponse.json();
                const sessionId = startData.sessionId;
                console.log('✅ Test interview session started');

                // Get first question to analyze
                const questionResponse = await fetch('http://localhost:8765/api/v1/interview/next-question', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ sessionId })
                });

                if (questionResponse.ok) {
                    const questionData = await questionResponse.json();
                    if (questionData.question) {
                        console.log(`📝 Sample question: "${questionData.question.question}"`);
                        console.log(`   • Key: ${questionData.question.key}`);
                        console.log(`   • Type: ${questionData.question.type}`);
                        console.log(`   • Remaining visa types to consider: ${questionData.question.remainingVisaTypes || 'unknown'}`);

                        if (questionData.question.options && questionData.question.options.length > 0) {
                            console.log(`   • Options available: ${questionData.question.options.length}`);
                        }
                    }
                }
            }
        } catch (e) {
            console.log('⚠️  Could not analyze interview questions:', e.message);
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

queryVisaStats().catch(console.error);
