import { test } from '@playwright/test';

test('check production site translations and dark mode', async ({ page }) => {
  const url = 'https://l4h.74-208-77-43.nip.io';

  const consoleMessages: Array<{ type: string; text: string }> = [];
  const pageErrors: string[] = [];

  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  page.on('pageerror', err => {
    pageErrors.push(err.stack || err.message);
  });

  console.log(`\n=== Loading ${url} ===\n`);

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000); // Wait for i18n to load

  // Check body text
  const bodyText = await page.locator('body').innerText();
  console.log('\n=== BODY TEXT ===');
  console.log(`Length: ${bodyText.length}`);
  console.log(`First 500 chars:\n"${bodyText.substring(0, 500)}"`);

  // Check for translation keys (untranslated)
  const hasTranslationKeys = bodyText.match(/\b(common|nav|auth|landing)\.[a-zA-Z.]+\b/);
  console.log('\n=== TRANSLATION STATUS ===');
  console.log(`Has untranslated keys: ${!!hasTranslationKeys}`);
  if (hasTranslationKeys) {
    console.log(`Found keys: ${hasTranslationKeys.join(', ')}`);
  }

  // Check console logs for i18n
  console.log('\n=== I18N CONSOLE MESSAGES ===');
  const i18nMessages = consoleMessages.filter(msg =>
    msg.text.includes('i18n') || msg.text.includes('translation')
  );
  i18nMessages.forEach((msg, i) => {
    console.log(`[${i + 1}] ${msg.type.toUpperCase()}: ${msg.text}`);
  });

  // Check for errors
  console.log('\n=== ERRORS ===');
  const errors = consoleMessages.filter(msg => msg.type === 'error');
  errors.forEach((err, i) => {
    console.log(`[${i + 1}] ${err.text.substring(0, 200)}`);
  });
  pageErrors.forEach((err, i) => {
    console.log(`[PAGE ${i + 1}] ${err.substring(0, 200)}`);
  });

  // Test dark mode by toggling and checking input styles
  console.log('\n=== DARK MODE TEST ===');

  // Take screenshot in light mode
  await page.screenshot({ path: 'tests/ui.e2e/production-light-mode.png', fullPage: true });
  console.log('Light mode screenshot saved');

  // Find and click dark mode toggle
  const darkModeButton = page.locator('button[aria-label*="dark mode"], button[aria-label*="Dark mode"]').first();
  if (await darkModeButton.count() > 0) {
    await darkModeButton.click();
    await page.waitForTimeout(500);

    // Take screenshot in dark mode
    await page.screenshot({ path: 'tests/ui.e2e/production-dark-mode.png', fullPage: true });
    console.log('Dark mode screenshot saved');

    // Check if dark mode classes are applied
    const htmlClass = await page.locator('html').getAttribute('class');
    console.log(`HTML classes: ${htmlClass}`);
    console.log(`Has dark class: ${htmlClass?.includes('dark')}`);

    // Check input field styling
    const firstInput = page.locator('input[type="text"], input[type="email"]').first();
    if (await firstInput.count() > 0) {
      const bgColor = await firstInput.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      const color = await firstInput.evaluate(el =>
        window.getComputedStyle(el).color
      );
      console.log(`Input background: ${bgColor}`);
      console.log(`Input text color: ${color}`);

      // Check for white-on-white issue
      if (bgColor.includes('255, 255, 255') && color.includes('255, 255, 255')) {
        console.log('⚠️  WARNING: White text on white background detected!');
      }
    }
  } else {
    console.log('Dark mode toggle not found');
  }
});
