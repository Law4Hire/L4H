const puppeteer = require('puppeteer');

async function debugInterviewAPI() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1400, height: 900 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        console.log('🔍 DEBUGGING INTERVIEW API');
        console.log('==========================');

        // Login to A-1 user
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[type="email"]', { visible: true });
        await page.type('input[type="email"]', 'Testing1000A1@testing.com');
        await page.type('input[type="password"]', 'SecureTest123!');
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('📍 Step 1: Login successful');

        // Navigate to interview
        await page.goto('http://localhost:5173/interview', { waitUntil: 'networkidle2' });
        console.log('📍 Step 2: Navigated to interview page');

        // Debug API calls
        const apiCalls = [];
        page.on('response', response => {
            if (response.url().includes('/api/')) {
                apiCalls.push({
                    url: response.url(),
                    status: response.status(),
                    timestamp: Date.now()
                });
            }
        });

        // Wait for interview to initialize
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check what's on the page
        const pageContent = await page.evaluate(() => {
            const interviewContainer = document.querySelector('[data-testid="interview-container"]');
            const questionContainer = document.querySelector('[data-testid="question-container"]');
            const errorMessage = document.querySelector('[class*="error"]');
            const loadingIndicator = document.querySelector('[class*="loading"]');

            return {
                hasInterviewContainer: !!interviewContainer,
                hasQuestionContainer: !!questionContainer,
                hasError: !!errorMessage,
                hasLoading: !!loadingIndicator,
                bodyText: document.body.innerText.substring(0, 500),
                url: window.location.href
            };
        });

        console.log('📋 Page Debug Info:');
        console.log('Current URL:', pageContent.url);
        console.log('Has interview container:', pageContent.hasInterviewContainer);
        console.log('Has question container:', pageContent.hasQuestionContainer);
        console.log('Has error:', pageContent.hasError);
        console.log('Has loading:', pageContent.hasLoading);
        console.log('Body text preview:', pageContent.bodyText);

        console.log('\n🌐 API Calls Made:');
        apiCalls.forEach(call => {
            console.log(`  ${call.status} ${call.url}`);
        });

        console.log('\n⏳ Waiting 10 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

debugInterviewAPI().catch(console.error);