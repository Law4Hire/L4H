const puppeteer = require('puppeteer');

async function debugInterviewAPIDetailed() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1400, height: 900 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        console.log('🔍 DEBUGGING INTERVIEW API - DETAILED FLOW');
        console.log('==========================================');

        // Test user: A-1 diplomat from UK
        const userEmail = 'Testing1000A1@testing.com';
        console.log(`Testing user: ${userEmail}`);

        // Track all API requests and responses
        const apiLog = [];
        page.on('response', async response => {
            if (response.url().includes('/api/v1/interview/')) {
                try {
                    const responseBody = await response.text();
                    apiLog.push({
                        method: 'RESPONSE',
                        url: response.url(),
                        status: response.status(),
                        body: responseBody,
                        timestamp: new Date().toISOString()
                    });
                } catch (e) {
                    apiLog.push({
                        method: 'RESPONSE',
                        url: response.url(),
                        status: response.status(),
                        body: 'Failed to read response',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });

        page.on('request', async request => {
            if (request.url().includes('/api/v1/interview/')) {
                try {
                    const postData = request.postData();
                    apiLog.push({
                        method: 'REQUEST',
                        url: request.url(),
                        body: postData || 'No body',
                        timestamp: new Date().toISOString()
                    });
                } catch (e) {
                    apiLog.push({
                        method: 'REQUEST',
                        url: request.url(),
                        body: 'Failed to read request',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });

        // Login
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[type="email"]', { visible: true });
        await page.type('input[type="email"]', userEmail);
        await page.type('input[type="password"]', 'SecureTest123!');
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('📍 Step 1: Login successful');

        // Navigate to interview
        await page.goto('http://localhost:5173/interview', { waitUntil: 'networkidle2' });
        console.log('📍 Step 2: Navigated to interview page');

        // Wait for interview to load
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Print all API interactions
        console.log('\n🌐 API INTERACTIONS:');
        console.log('====================');
        apiLog.forEach((log, index) => {
            console.log(`\n${index + 1}. ${log.method} at ${log.timestamp}`);
            console.log(`   URL: ${log.url}`);
            if (log.body && log.body !== 'No body' && log.body !== 'Failed to read request' && log.body !== 'Failed to read response') {
                try {
                    const parsed = JSON.parse(log.body);
                    console.log(`   Body: ${JSON.stringify(parsed, null, 2)}`);
                } catch (e) {
                    console.log(`   Body: ${log.body}`);
                }
            }
        });

        // Check what's displayed on page
        const pageDebug = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const questionText = document.querySelector('[data-testid="question-text"]')?.innerText || 'No question found';
            const optionsText = [...document.querySelectorAll('[data-testid="question-option"]')].map(el => el.innerText);
            const errorText = document.querySelector('.error')?.innerText || 'No error';

            return {
                bodyText: bodyText.substring(0, 1000),
                questionText,
                optionsText,
                errorText,
                url: window.location.href
            };
        });

        console.log('\n📋 PAGE DEBUG INFO:');
        console.log('===================');
        console.log('Current URL:', pageDebug.url);
        console.log('Question text:', pageDebug.questionText);
        console.log('Options:', pageDebug.optionsText);
        console.log('Error:', pageDebug.errorText);
        console.log('Body preview:', pageDebug.bodyText);

        console.log('\n⏳ Waiting 15 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 15000));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

debugInterviewAPIDetailed().catch(console.error);