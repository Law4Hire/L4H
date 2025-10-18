import { test } from '@playwright/test';

test('debug console errors on production site', async ({ page }) => {
  const url = 'https://l4h.74-208-77-43.nip.io';

  const consoleMessages: Array<{ type: string; text: string; location?: string }> = [];
  const pageErrors: string[] = [];

  // Capture ALL console messages with full details
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location().url
    });
  });

  // Capture page errors with full stack
  page.on('pageerror', err => {
    pageErrors.push(err.stack || err.message);
  });

  console.log(`\n=== Loading ${url} ===\n`);

  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for any errors to surface
  await page.waitForTimeout(3000);

  console.log('\n=== ALL CONSOLE MESSAGES ===');
  consoleMessages.forEach((msg, i) => {
    console.log(`\n[${i + 1}] ${msg.type.toUpperCase()}`);
    console.log(`Location: ${msg.location}`);
    console.log(`Message: ${msg.text}`);
  });

  console.log('\n=== PAGE ERRORS ===');
  pageErrors.forEach((err, i) => {
    console.log(`\n[${i + 1}] ${err}`);
  });

  // Get the HTML
  const html = await page.content();
  console.log('\n=== HTML LENGTH ===');
  console.log(html.length, 'characters');

  // Check what's in the root div
  const rootContent = await page.locator('#root').innerHTML();
  console.log('\n=== ROOT DIV CONTENT ===');
  console.log(rootContent.substring(0, 500));

  // Get body text
  const bodyText = await page.locator('body').innerText();
  console.log('\n=== BODY TEXT ===');
  console.log(`Length: ${bodyText.length}`);
  console.log(`Content: "${bodyText}"`);
});
