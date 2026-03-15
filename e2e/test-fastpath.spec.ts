import { test, expect } from '@playwright/test';

test.describe('FastPath Quiz Tests', () => {
  test('should load fastpath quiz without crashing', async ({ page }) => {
    // Log network responses that fail
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`NETWORK ERROR: ${response.status()} ${response.url()}`);
      }
    });

    // Log browser console messages
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    // Log page errors
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // Navigate to L4H Landing Page
    await page.goto('http://l4h.localhost:8081');
    
    // Click "Check My Eligibility"
    await page.click('text="Check My Eligibility"');
    
    // Wait a bit to let any network requests finish and see if console logs anything
    await page.waitForTimeout(2000);
    
    // Extract page content
    const bodyText = await page.locator('body').innerText();
    console.log('PAGE TEXT CONTENT:');
    console.log(bodyText);
    
    console.log('Successfully clicked Check My Eligibility.');
  });
});
