import { test, expect } from '@playwright/test';

test('Cannlaw Login Test - dcann@cannlaw.com', async ({ page }) => {
  // Use the local port for Cannlaw
  await page.goto('http://localhost:5174/login');

  // Verify we are on the login page
  await expect(page.locator('h2')).toContainText('Associate Sign In');

  // Fill in credentials
  await page.fill('input[id="email"]', 'dcann@cannlaw.com');
  await page.fill('input[id="password"]', 'SecureTest123!');

  // Intercept the login request to see what's happening
  page.on('request', request => {
    if (request.url().includes('login')) {
      console.log('>> Request:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('login')) {
      console.log('<< Response:', response.status(), response.url());
    }
  });

  // Click Sign In
  await page.click('button:has-text("Sign In")');

  // Wait for navigation or error message
  // If successful, it should go to /dashboard
  // If failed, it should show an error
    try {
      await page.waitForURL('**/dashboard', { timeout: 8000 });
      console.log('Login successful! Redirected to dashboard.');
    } catch (e) {
      const errorText = await page.locator('.text-red-600').textContent() || 'No error text found';
      console.log('[DEBUG] Login failed. Error message in UI: ' + errorText);
  
      // Take a screenshot for proof
      await page.screenshot({ path: 'login-failure.png' });
      throw new Error('Login failed for dcann@cannlaw.com: ' + errorText);
    }
  });
