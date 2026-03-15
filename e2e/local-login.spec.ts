import { test, expect } from '@playwright/test';

test.describe('Local Login Tests', () => {
  test('should login successfully as admin', async ({ page }) => {
    // Navigate to Cannlaw login
    await page.goto('http://cannlaw.localhost:8081/login');
    
    // Check if we are on the login page
    await expect(page).toHaveURL(/.*login/);
    
    // Log network responses that fail
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`NETWORK ERROR: ${response.status()} ${response.url()}`);
      }
    });

    // Log browser console messages
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    // Fill in credentials
    await page.fill('input[type="email"]', 'dcann@cannlaw.com');
    await page.fill('input[type="password"]', 'SecureTest123!');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/.*(dashboard|admin)/, { timeout: 10000 });
    
    // Wait a bit to let any network requests finish and see if console logs anything
    await page.waitForTimeout(2000);
    
    // Extract page content to see what is happening
    const bodyText = await page.locator('body').innerText();
    console.log('PAGE TEXT CONTENT:');
    console.log(bodyText);
    
    console.log('Successfully logged in and reached the dashboard page. Waiting to see network trace.');
  });
});
