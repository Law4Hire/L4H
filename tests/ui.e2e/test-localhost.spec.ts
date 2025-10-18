import { test } from '@playwright/test';

test('test localhost for errors', async ({ page }) => {
  const url = 'http://localhost:5173';

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
  await page.waitForTimeout(3000);

  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach((msg, i) => {
    console.log(`\n[${i + 1}] ${msg.type.toUpperCase()}: ${msg.text.substring(0, 200)}`);
  });

  console.log('\n=== PAGE ERRORS ===');
  pageErrors.forEach((err, i) => {
    console.log(`\n[${i + 1}] ${err}`);
  });

  const bodyText = await page.locator('body').innerText();
  console.log('\n=== BODY TEXT ===');
  console.log(`Length: ${bodyText.length}`);
  console.log(`First 200 chars: "${bodyText.substring(0, 200)}"`);
});
