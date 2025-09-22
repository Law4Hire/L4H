const http = require('http');

const API_BASE = 'http://localhost:8765';

async function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8765,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve(body);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testBusinessVisaFlow() {
    console.log('🚀 Testing Business Visa Flow...\n');

    try {
        // Test B-1 flow: purpose=business, employerSponsor=no, treatyCountry=no
        console.log('📋 Testing B-1 Flow (Business, No Treaty)...');
        let answers = { purpose: "business" };

        // Step 1: Get first question after purpose
        let response = await makeRequest('POST', '/api/interview/next-question', { answers });
        console.log(`Question 1: ${response.question} (${response.key})`);

        if (response.key === 'employerSponsor') {
            answers.employerSponsor = "no";
            response = await makeRequest('POST', '/api/interview/next-question', { answers });
            console.log(`Question 2: ${response.question} (${response.key})`);

            if (response.key === 'treatyCountry') {
                answers.treatyCountry = "no";
                response = await makeRequest('POST', '/api/interview/next-question', { answers });
                console.log(`Question 3: ${response.question} (${response.key})`);

                if (response.key === 'complete') {
                    console.log('✅ B-1 Flow completed successfully');
                } else {
                    console.log(`❌ B-1 Flow failed - unexpected question: ${response.key}`);
                }
            }
        }

        console.log('\n📋 Testing E-1 Flow (Treaty Trader)...');
        answers = {
            purpose: "business",
            employerSponsor: "no",
            treatyCountry: "yes"
        };

        response = await makeRequest('POST', '/api/interview/next-question', { answers });
        console.log(`E-1 Question: ${response.question} (${response.key})`);

        if (response.key === 'tradeActivity') {
            answers.tradeActivity = "yes";
            response = await makeRequest('POST', '/api/interview/next-question', { answers });
            console.log(`E-1 Final: ${response.question} (${response.key})`);

            if (response.key === 'complete') {
                console.log('✅ E-1 Flow completed successfully');
            } else {
                console.log(`❌ E-1 Flow failed - unexpected question: ${response.key}`);
            }
        }

        console.log('\n📋 Testing E-2 Flow (Treaty Investor)...');
        answers = {
            purpose: "business",
            employerSponsor: "no",
            treatyCountry: "yes",
            tradeActivity: "no"
        };

        response = await makeRequest('POST', '/api/interview/next-question', { answers });
        console.log(`E-2 Question: ${response.question} (${response.key})`);

        if (response.key === 'investment') {
            answers.investment = "yes";
            response = await makeRequest('POST', '/api/interview/next-question', { answers });
            console.log(`E-2 Final: ${response.question} (${response.key})`);

            if (response.key === 'complete') {
                console.log('✅ E-2 Flow completed successfully');
            } else {
                console.log(`❌ E-2 Flow failed - unexpected question: ${response.key}`);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBusinessVisaFlow();