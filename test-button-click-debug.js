const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Testing button click specifically...');
    
    // Collect console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const msgText = msg.text();
      consoleLogs.push(msgText);
      console.log('Browser console:', msgText);
    });
    
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    // Go to admin page directly
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to admin via dropdown
    const userDropdown = await page.locator('text=/Hello.*/').first();
    await userDropdown.click();
    await page.waitForTimeout(500);
    
    const adminLink = await page.locator('text=Admin').first();
    await adminLink.click();
    await page.waitForURL('**/admin', { timeout: 5000 });
    
    console.log('2. On admin page, looking for Manage Users button...');
    
    // Wait for the button and try various ways to click it
    const manageUsersButton = await page.locator('text=Manage Users').first();
    await manageUsersButton.waitFor({ state: 'visible', timeout: 5000 });
    
    console.log('3. Button found, attempting various click methods...');
    
    // Method 1: Direct click
    console.log('   Trying direct click...');
    await manageUsersButton.click();
    await page.waitForTimeout(1000);
    console.log('   Console logs so far:', consoleLogs);
    
    // Method 2: Force click
    console.log('   Trying force click...');
    await manageUsersButton.click({ force: true });
    await page.waitForTimeout(1000);
    console.log('   Console logs after force click:', consoleLogs);
    
    // Method 3: JavaScript execution
    console.log('   Trying JavaScript execution...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageUsersBtn = buttons.find(btn => btn.textContent?.includes('Manage Users'));
      if (manageUsersBtn) {
        console.log('Found button via JS, triggering click');
        manageUsersBtn.click();
      } else {
        console.log('Button not found via JS');
      }
    });
    await page.waitForTimeout(1000);
    console.log('   Console logs after JS execution:', consoleLogs);
    
    // Method 4: Check if button has proper event listeners
    const hasOnClick = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageUsersBtn = buttons.find(btn => btn.textContent?.includes('Manage Users'));
      if (manageUsersBtn) {
        // Check if onclick is set
        const hasOnClick = manageUsersBtn.onclick !== null;
        const hasEventListeners = getEventListeners && getEventListeners(manageUsersBtn).click?.length > 0;
        console.log('Button onclick property:', hasOnClick);
        console.log('Button has click event listeners:', hasEventListeners);
        return { hasOnClick, hasEventListeners };
      }
      return null;
    });
    
    console.log('4. Button event listener check:', hasOnClick);
    
    // Final URL check
    const finalUrl = page.url();
    console.log('5. Final URL:', finalUrl);
    console.log('6. All console logs captured:', consoleLogs);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();