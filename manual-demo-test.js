/**
 * MANUAL DEMO TEST - Step by step with manual verification
 * This will show you each step clearly and wait for confirmation
 */

const { chromium } = require('playwright');

async function runManualDemo() {
    console.log('🎬 MANUAL DEMO - Opening browser for step-by-step verification');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1500 // Slow motion so you can see every action
    });

    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });

    const page = await context.newPage();

    try {
        console.log('\n📱 STEP 1: Navigate to Login Page');
        await page.goto('http://localhost:5173/login');
        await page.waitForTimeout(2000);

        console.log('✅ Login page loaded. You should see the login form.');
        await page.screenshot({ path: 'demo-1-login-page.png' });

        console.log('\n🔐 STEP 2: Fill Email Field');
        console.log('   Typing: svet@testing.com');

        // Clear any existing text first
        await page.fill('input[type="email"]', '');
        await page.waitForTimeout(500);

        // Type slowly so you can see it
        await page.type('input[type="email"]', 'svet@testing.com', { delay: 100 });
        await page.waitForTimeout(1000);

        console.log('✅ Email entered. You should see: svet@testing.com');
        await page.screenshot({ path: 'demo-2-email-filled.png' });

        console.log('\n🔑 STEP 3: Fill Password Field');
        console.log('   Typing: SecureTest123!');

        // Clear and fill password
        await page.fill('input[type="password"]', '');
        await page.waitForTimeout(500);
        await page.type('input[type="password"]', 'SecureTest123!', { delay: 100 });
        await page.waitForTimeout(1000);

        console.log('✅ Password entered. You should see dots for the password.');
        await page.screenshot({ path: 'demo-3-password-filled.png' });

        console.log('\n👆 STEP 4: Click Login Button');
        console.log('   Looking for login button...');

        // Find and highlight the login button
        const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("login")').first();
        await loginButton.hover();
        await page.waitForTimeout(1000);

        console.log('   Clicking login button NOW...');
        await loginButton.click();

        console.log('✅ Login button clicked. Waiting for response...');
        await page.waitForTimeout(5000); // Wait 5 seconds to see what happens

        await page.screenshot({ path: 'demo-4-after-login-click.png' });

        // Check current URL and page content
        const currentUrl = page.url();
        console.log(`\n🌐 Current URL: ${currentUrl}`);

        // Look for any error messages or success indicators
        const pageText = await page.textContent('body');
        const hasError = pageText.toLowerCase().includes('error') ||
                        pageText.toLowerCase().includes('invalid') ||
                        pageText.toLowerCase().includes('failed');

        const hasSuccess = pageText.toLowerCase().includes('dashboard') ||
                          pageText.toLowerCase().includes('welcome') ||
                          currentUrl.includes('dashboard');

        console.log(`\n🔍 ANALYSIS:`);
        console.log(`   Has Error Text: ${hasError ? 'YES ❌' : 'NO ✅'}`);
        console.log(`   Has Success Indicators: ${hasSuccess ? 'YES ✅' : 'NO ❌'}`);

        if (hasError) {
            console.log('\n❌ LOGIN APPEARS TO HAVE FAILED');
            console.log('   Check the browser for error messages');
        } else if (hasSuccess) {
            console.log('\n✅ LOGIN APPEARS SUCCESSFUL');
            console.log('   Proceeding to test dashboard...');
        } else {
            console.log('\n⚠️  LOGIN STATUS UNCLEAR');
            console.log('   No clear error or success indicators found');
        }

        console.log('\n🚀 STEP 5: Try to Navigate to Dashboard');
        console.log('   Manually going to dashboard URL...');

        await page.goto('http://localhost:5173/dashboard');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'demo-5-dashboard-attempt.png' });

        const dashboardUrl = page.url();
        console.log(`   Dashboard URL: ${dashboardUrl}`);

        if (dashboardUrl.includes('dashboard')) {
            console.log('✅ Successfully reached dashboard page');

            console.log('\n📋 STEP 6: Look for Cases and View Buttons');

            // Look for any cards or case elements
            const cards = await page.locator('div[class*="card"], div[class*="Card"], .MuiCard-root').count();
            const buttons = await page.locator('button').count();

            console.log(`   Found ${cards} card elements`);
            console.log(`   Found ${buttons} buttons`);

            // Look specifically for View buttons
            const viewButtons = await page.locator('button:has-text("View"), button:has-text("view")').count();
            console.log(`   Found ${viewButtons} View buttons`);

            if (viewButtons > 0) {
                console.log('\n👆 STEP 7: Test View Button');
                await page.locator('button:has-text("View"), button:has-text("view")').first().click();
                await page.waitForTimeout(2000);

                await page.screenshot({ path: 'demo-6-view-button-clicked.png' });
                console.log('✅ View button clicked - check screenshot for result');
            } else {
                console.log('\n⚠️  No View buttons found to test');
            }

        } else {
            console.log('❌ Could not reach dashboard - redirected back to login');
        }

        console.log('\n📷 FINAL SCREENSHOTS SAVED:');
        console.log('   demo-1-login-page.png');
        console.log('   demo-2-email-filled.png');
        console.log('   demo-3-password-filled.png');
        console.log('   demo-4-after-login-click.png');
        console.log('   demo-5-dashboard-attempt.png');
        if (await page.locator('button:has-text("View")').count() > 0) {
            console.log('   demo-6-view-button-clicked.png');
        }

        console.log('\n👀 Browser will stay open for 60 seconds for manual inspection...');
        console.log('   Use this time to manually test the interface');
        await page.waitForTimeout(60000);

    } catch (error) {
        console.error('\n❌ Demo failed:', error.message);
        await page.screenshot({ path: 'demo-error.png' });
        console.log('📷 Error screenshot saved as demo-error.png');

        console.log('\n🔍 Browser staying open for 30 seconds to investigate...');
        await page.waitForTimeout(30000);

        throw error;
    } finally {
        await browser.close();
        console.log('\n🔚 Demo completed - browser closed');
    }
}

// Install playwright if needed
async function ensurePlaywright() {
    try {
        require('playwright');
    } catch (e) {
        console.log('📦 Installing Playwright...');
        const { execSync } = require('child_process');
        execSync('npm install playwright', { stdio: 'inherit' });
        execSync('npx playwright install chromium', { stdio: 'inherit' });
    }
}

// Run the demo
(async () => {
    try {
        await ensurePlaywright();
        await runManualDemo();
        console.log('\n✅ MANUAL DEMO COMPLETED');
    } catch (error) {
        console.error('\n💥 Manual demo failed:', error.message);
        process.exit(1);
    }
})();