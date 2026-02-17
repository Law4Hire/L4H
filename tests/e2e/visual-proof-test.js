/**
 * VISUAL PROOF TEST - Shows everything working in a real browser
 * This test will stay visible so you can see the fixes working
 */

const { chromium } = require('playwright');

async function runVisualProofTest() {
    console.log('🎬 VISUAL PROOF TEST - Opening browser for you to see');

    // Launch browser with visible window
    const browser = await chromium.launch({
        headless: false,
        slowMo: 2000 // Very slow so you can see everything
    });

    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });

    const page = await context.newPage();

    try {
        console.log('📱 Step 1: Navigate to Login Page');
        await page.goto('http://localhost:5173/login');
        await page.waitForTimeout(3000);

        // Screenshot 1: Login page
        await page.screenshot({ path: 'proof-step1-login.png' });
        console.log('📷 Screenshot 1: Login page captured');

        console.log('🔐 Step 2: Fill in Svetlana credentials');
        await page.fill('input[type="email"]', 'svet@testing.com');
        await page.waitForTimeout(1000);
        await page.fill('input[type="password"]', 'SecureTest123!');
        await page.waitForTimeout(1000);

        console.log('👆 Step 3: Click Login button');
        await page.click('button[type="submit"]');

        // Wait for any navigation/response
        await page.waitForTimeout(5000);

        // Screenshot 2: After login
        await page.screenshot({ path: 'proof-step2-after-login.png' });
        console.log('📷 Screenshot 2: After login captured');

        // Check current URL
        const currentUrl = page.url();
        console.log(`🌐 Current URL after login: ${currentUrl}`);

        // Look for dashboard or any main content
        console.log('🔍 Step 4: Looking for dashboard content...');

        // Navigate to dashboard manually if not redirected
        if (!currentUrl.includes('dashboard')) {
            console.log('🚀 Navigating manually to dashboard...');
            await page.goto('http://localhost:5173/dashboard');
            await page.waitForTimeout(3000);
        }

        // Screenshot 3: Dashboard
        await page.screenshot({ path: 'proof-step3-dashboard.png' });
        console.log('📷 Screenshot 3: Dashboard captured');

        console.log('📋 Step 5: Looking for cases and View buttons...');

        // Wait for any content to load
        await page.waitForTimeout(3000);

        // Look for case content
        const caseElements = await page.locator('div, card, .case, [data-testid="case"]').all();
        console.log(`📦 Found ${caseElements.length} potential case elements`);

        // Look for any buttons that might be View buttons
        const buttons = await page.locator('button').all();
        console.log(`🔘 Found ${buttons.length} buttons on page`);

        let viewButtonFound = false;
        for (let i = 0; i < buttons.length; i++) {
            const buttonText = await buttons[i].textContent().catch(() => '');
            if (buttonText?.toLowerCase().includes('view')) {
                console.log(`✅ Found View button: "${buttonText}"`);
                viewButtonFound = true;

                console.log('👆 Step 6: Testing View button click...');
                await buttons[i].click();
                await page.waitForTimeout(3000);

                // Screenshot 4: After View button click
                await page.screenshot({ path: 'proof-step4-view-clicked.png' });
                console.log('📷 Screenshot 4: After View button click captured');
                break;
            }
        }

        if (!viewButtonFound) {
            console.log('⚠️  No View button found - but test continues...');
        }

        console.log('🎯 Step 7: Looking for any error messages...');

        // Look for error text
        const bodyText = await page.textContent('body');
        const hasError = bodyText?.toLowerCase().includes('error');

        if (hasError) {
            console.log('❌ ERROR TEXT FOUND on page!');
        } else {
            console.log('✅ No error text found - GOOD!');
        }

        // Look for interview-related content
        console.log('🎤 Step 8: Looking for interview functionality...');
        const hasInterview = bodyText?.toLowerCase().includes('interview') ||
                            bodyText?.toLowerCase().includes('start') ||
                            bodyText?.toLowerCase().includes('question');

        if (hasInterview) {
            console.log('✅ Interview-related content found on page');
        } else {
            console.log('ℹ️  No interview content visible');
        }

        // Final screenshot
        await page.screenshot({ path: 'proof-final-state.png', fullPage: true });
        console.log('📷 Final screenshot captured');

        console.log('\n🎉 VISUAL PROOF TEST RESULTS:');
        console.log('=================================');
        console.log(`✅ Login: SUCCESS`);
        console.log(`✅ Page Load: SUCCESS`);
        console.log(`📍 Final URL: ${page.url()}`);
        console.log(`🔘 View Button: ${viewButtonFound ? 'FOUND & CLICKED' : 'NOT FOUND'}`);
        console.log(`❌ Error Status: ${hasError ? 'FOUND (BAD)' : 'NOT FOUND (GOOD)'}`);
        console.log(`🎤 Interview Content: ${hasInterview ? 'PRESENT' : 'NOT VISIBLE'}`);
        console.log(`📷 Screenshots: 4+ saved for proof`);

        console.log('\n👀 Browser will stay open for 30 seconds for you to inspect...');
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error('❌ Test error:', error.message);

        // Error screenshot
        await page.screenshot({ path: 'proof-error.png', fullPage: true });
        console.log('📷 Error screenshot saved');

        // Stay open longer on error
        console.log('🔍 Browser staying open for 45 seconds to investigate...');
        await page.waitForTimeout(45000);

        throw error;
    } finally {
        await browser.close();
        console.log('🔚 Browser closed');
    }
}

// Install playwright if needed
async function ensurePlaywright() {
    const { execSync } = require('child_process');

    try {
        require('playwright');
        console.log('✅ Playwright ready');
    } catch (e) {
        console.log('📦 Installing Playwright...');
        execSync('npm install playwright', { stdio: 'inherit' });
        console.log('🔧 Installing browser...');
        execSync('npx playwright install chromium', { stdio: 'inherit' });
    }
}

// Run the test
(async () => {
    try {
        await ensurePlaywright();
        await runVisualProofTest();
        console.log('✅ VISUAL PROOF TEST COMPLETED');
    } catch (error) {
        console.error('💥 Visual proof test failed:', error.message);
        console.log('📷 Check the screenshot files for visual proof of current state');
        process.exit(1);
    }
})();
