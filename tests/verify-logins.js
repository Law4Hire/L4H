const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrlCannlaw = 'http://localhost:5174';
  const baseUrlL4H = 'http://localhost:5173';
  const credentials = { email: 'dcann@cannlaw.com', password: 'SecureTest123!' };

  console.log('🚀 Starting Login Verification Tests...');

  try {
    // 1. Test Cannlaw Associate Login
    console.log('\n--- Testing Cannlaw Associate Login ---');
    await page.goto(`${baseUrlCannlaw}/login`);
    console.log('🔗 Navigated to Cannlaw Login');
    
    await page.fill('input[id="email"]', credentials.email);
    await page.fill('input[id="password"]', credentials.password);
    console.log('✍️ Filled credentials');
    
    await page.click('button[type="submit"]');
    console.log('🖱️ Clicked Sign In');

    // Wait for either a success toast/redirect or an error message
    try {
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      console.log('✅ SUCCESS: Logged into Cannlaw Associate Portal');
    } catch (e) {
      const errorVisible = await page.isVisible('text=failed');
      if (errorVisible) {
        console.log('❌ FAILED: Login rejected by API (Expected if DB is down)');
      } else {
        console.log('⚠️ TIMEOUT: Page did not redirect. API might be unreachable.');
      }
    }
    await page.screenshot({ path: 'test-cannlaw-login-result.png' });

    // 2. Test Law4Hire Admin Login
    console.log('\n--- Testing Law4Hire Admin Login ---');
    await page.goto(`${baseUrlL4H}/login`);
    console.log('🔗 Navigated to L4H Login');
    
    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);
    
    await page.click('button[type="submit"]');
    console.log('🖱️ Clicked Login');

    try {
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      console.log('✅ SUCCESS: Logged into Law4Hire Admin');
    } catch (e) {
      console.log('❌ FAILED: L4H Login did not proceed to dashboard.');
    }
    await page.screenshot({ path: 'test-l4h-login-result.png' });

  } catch (err) {
    console.error('🛑 Critical Error during UI test:', err.message);
  } finally {
    await browser.close();
    console.log('\nVerification complete. Check screenshots for visual results.');
  }
})();
