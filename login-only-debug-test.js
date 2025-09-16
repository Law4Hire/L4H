const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 LOGIN ONLY DEBUG TEST');
    console.log('========================');
    
    // Capture ALL console logs
    page.on('console', msg => {
      console.log(`📝 [${msg.type()}] ${msg.text()}`);
    });

    // Go to login page
    console.log('\n1️⃣ Loading login page...');
    await page.goto('http://localhost:5179/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');

    // Fill and submit login form
    console.log('\n2️⃣ Filling login form...');
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    
    console.log('\n3️⃣ Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait a moment for the logs to appear
    await page.waitForTimeout(3000);
    
    // Try to wait for dashboard or check if we're still on login
    try {
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      console.log('✅ Navigated to dashboard');
    } catch (e) {
      console.log('❌ Did not navigate to dashboard');
    }
    
    // Check localStorage regardless
    const token = await page.evaluate(() => {
      try {
        return localStorage.getItem('jwt_token');
      } catch (e) {
        return 'ERROR: ' + e.message;
      }
    });
    
    console.log('\n🔑 Final localStorage check:', token ? 'TOKEN PRESENT' : 'NO TOKEN');
    if (token && token !== 'ERROR: ' && !token.startsWith('ERROR')) {
      console.log('   Token length:', token.length);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    console.log('\n⏱️  Browser will stay open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();