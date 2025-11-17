const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.message);
  });

  // Listen for network failures
  page.on('requestfailed', request => {
    console.error('[REQUEST FAILED]', request.url(), request.failure()?.errorText);
  });

  try {
    console.log('Navigating to L4H site...');
    await page.goto('https://l4h.74-208-77-43.nip.io/', { waitUntil: 'networkidle' });

    console.log('Taking screenshot of initial page...');
    await page.screenshot({ path: 'l4h-initial.png', fullPage: true });

    // Wait a bit for the page to fully render
    await page.waitForTimeout(2000);

    console.log('\nLooking for login elements...');
    const loginButton = await page.locator('text=Login').first();
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Found login button, clicking...');
      await loginButton.click();
      await page.waitForTimeout(1000);
    }

    // Look for email input
    console.log('Looking for email input...');
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();

    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Found email input, filling with dcann@cannlaw.com...');
      await emailInput.fill('dcann@cannlaw.com');

      console.log('Looking for password input...');
      const passwordInput = await page.locator('input[type="password"]').first();
      await passwordInput.fill('SecureTest123!');

      console.log('Taking screenshot before login...');
      await page.screenshot({ path: 'l4h-login-form.png', fullPage: true });

      console.log('Looking for submit button...');
      const submitButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();

      console.log('Clicking submit...');
      await submitButton.click();

      console.log('Waiting for navigation...');
      await page.waitForTimeout(3000);

      console.log('Taking screenshot after login...');
      await page.screenshot({ path: 'l4h-after-login.png', fullPage: true });

      // Check what's on the page
      const bodyText = await page.locator('body').innerText();
      console.log('\n=== PAGE CONTENT ===');
      console.log(bodyText.substring(0, 500));

      // Check for specific dashboard elements
      const hasDashboard = await page.locator('text=Dashboard').isVisible({ timeout: 2000 }).catch(() => false);
      console.log('\n=== DASHBOARD CHECK ===');
      console.log('Dashboard visible:', hasDashboard);

      // Get all visible text elements
      const textElements = await page.locator('body *:visible').allTextContents();
      console.log('\n=== VISIBLE ELEMENTS ===');
      console.log('Number of visible elements:', textElements.length);
      console.log('Sample elements:', textElements.slice(0, 20));

      // Check network requests
      console.log('\n=== CHECKING API CALLS ===');
      await page.waitForTimeout(2000);

    } else {
      console.log('Could not find email input field');
      console.log('Current URL:', page.url());
      console.log('Page title:', await page.title());
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'l4h-error.png', fullPage: true });
  } finally {
    console.log('\nTest complete. Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();
