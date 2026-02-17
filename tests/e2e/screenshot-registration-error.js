const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright browser...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down actions so we can see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to registration page...');
    await page.goto('http://localhost:5173/register', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    console.log('Page loaded. Waiting for form to be ready...');
    await page.waitForTimeout(2000);

    console.log('Filling out registration form...');

    // Fill email
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailInput.fill('test@example.com');
    console.log('Email filled');

    // Fill password
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill('SecureTest123!');
      console.log('Password filled');
      await passwordInputs[1].fill('SecureTest123!');
      console.log('Confirm password filled');
    }

    // Fill first name
    const firstNameInput = await page.locator('input[name="firstName"], input[placeholder*="first" i]').first();
    await firstNameInput.fill('Test');
    console.log('First name filled');

    // Fill last name
    const lastNameInput = await page.locator('input[name="lastName"], input[placeholder*="last" i]').first();
    await lastNameInput.fill('User');
    console.log('Last name filled');

    await page.waitForTimeout(1000);

    console.log('Taking screenshot of filled form...');
    await page.screenshot({ path: 'registration-form-filled.png', fullPage: true });

    console.log('Clicking register button...');
    // Try multiple selectors for the register button
    const registerButton = await page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")').first();
    await registerButton.click();

    console.log('Waiting for response/error...');
    await page.waitForTimeout(3000);

    console.log('Taking screenshot of error...');
    await page.screenshot({ path: 'registration-error.png', fullPage: true });

    // Try to extract error message text
    console.log('\n=== Checking for error messages ===');
    const errorSelectors = [
      '.error',
      '.alert',
      '.mud-alert-message',
      '[role="alert"]',
      '.error-message',
      '.validation-message',
      'text=Internal Server Error',
      'text=Error'
    ];

    for (const selector of errorSelectors) {
      try {
        const errorElements = await page.locator(selector).all();
        for (const element of errorElements) {
          const text = await element.textContent();
          if (text && text.trim()) {
            console.log(`Found error (${selector}): ${text.trim()}`);
          }
        }
      } catch (e) {
        // Selector not found, continue
      }
    }

    // Get the entire page text to look for error messages
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes('Internal Server Error')) {
      console.log('\n✓ "Internal Server Error" found on page');
    }
    if (bodyText.includes('Error')) {
      const errorMatch = bodyText.match(/.{0,50}Error.{0,50}/g);
      if (errorMatch) {
        console.log('Error context:', errorMatch);
      }
    }

    console.log('\n=== Screenshots saved ===');
    console.log('1. registration-form-filled.png - Form before submission');
    console.log('2. registration-error.png - Error state after submission');

  } catch (error) {
    console.error('Error occurred:', error.message);
    await page.screenshot({ path: 'registration-error-debug.png', fullPage: true });
    console.log('Debug screenshot saved as registration-error-debug.png');
  } finally {
    await browser.close();
  }
})();
