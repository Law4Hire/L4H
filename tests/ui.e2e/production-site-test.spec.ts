import { test, expect } from '@playwright/test';

test.describe('Production Site - l4h.74-208-77-43.nip.io', () => {
  test('should load the page and display text content', async ({ page }) => {
    const url = 'https://l4h.74-208-77-43.nip.io';

    console.log(`Loading ${url}...`);

    // Navigate to the production site
    await page.goto(url, { waitUntil: 'networkidle' });

    console.log('Page loaded, checking for text content...');

    // Get all text content from the body
    const bodyText = await page.locator('body').innerText();

    console.log('Body text length:', bodyText.length);
    console.log('First 500 characters:', bodyText.substring(0, 500));

    // Check if there's actual text content (not just whitespace)
    const hasText = bodyText.trim().length > 0;

    if (!hasText) {
      // Capture screenshot for debugging
      await page.screenshot({ path: 'production-site-failed.png', fullPage: true });

      // Get console logs
      const logs: string[] = [];
      page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));

      // Check for errors
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));

      console.log('Console logs:', logs);
      console.log('Page errors:', errors);

      throw new Error('NO TEXT FOUND ON PAGE - Site is broken!');
    }

    console.log('✓ Text content found on page');

    // Verify we have substantial content (more than just a loading message)
    expect(bodyText.trim().length).toBeGreaterThan(50);

    console.log('✓ Page has substantial text content');
  });

  test('should not have i18n errors in console', async ({ page }) => {
    const url = 'https://l4h.74-208-77-43.nip.io';

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    console.log(`Loading ${url} and monitoring for errors...`);

    // Navigate and wait for page to be fully loaded
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait a bit more for any async initialization
    await page.waitForTimeout(2000);

    console.log('Console errors:', consoleErrors);
    console.log('Page errors:', pageErrors);

    // Check for i18n specific errors
    const i18nErrors = [...consoleErrors, ...pageErrors].filter(err =>
      err.includes('i18next') ||
      err.includes('initReactI18next') ||
      err.includes('NO_I18NEXT_INSTANCE')
    );

    if (i18nErrors.length > 0) {
      console.log('❌ i18n errors found:');
      i18nErrors.forEach(err => console.log('  -', err));
      throw new Error(`i18n initialization errors detected: ${i18nErrors.join('; ')}`);
    }

    console.log('✓ No i18n errors detected');
  });
});
