import { test, expect } from '@playwright/test';

test.describe('Documents Catalog Test', () => {
  test('should load the documents catalog correctly', async ({ page }) => {
    // Log network responses
    page.on('response', response => {
      if (response.url().includes('uscis-forms')) {
        console.log(`API RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    // Navigate to Documents Catalog
    await page.goto('http://l4h.localhost:8081/uscis-documents');
    
    // Check if loading spinner disappears
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });
    
    // Check if cards are rendered
    const cards = await page.locator('.hover\\:shadow-lg');
    const count = await cards.count();
    console.log(`Found ${count} document cards.`);
    
    expect(count).toBeGreaterThan(0);
    
    // Test Start Form button
    await page.click('text="Start Form"');
    
    // Check if modal is visible
    const modal = await page.locator('role=dialog');
    await expect(modal).toBeVisible();
    console.log('Knockout modal is visible.');
  });
});
