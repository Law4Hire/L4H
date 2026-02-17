import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test('Verify Client Name Edit', async ({ page }) => {
  // 1. Log in as Denise (Admin)
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'denise@cannlaw.com');
  // Try common passwords if one fails? For now hardcode typical dev password
  await page.fill('input[type="password"]', 'Password123!'); 
  await page.click('button:has-text("Sign In")');

  // Verify Dashboard Load
  await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  
  // 2. Go to Client Management or use Dashboard list
  // The user went to Dashboard. "I set the assignment... then clicked the edit button for the one assigned to... Ed@cannsoft.com"
  // Assuming "Ed@cannsoft.com" is visible on the dashboard in the table.
  
  // Filter for "Ed" to be safe
  await page.fill('input[placeholder*="Search"]', 'Ed');
  await page.waitForTimeout(1000); // Debounce

  // Find row with Ed@cannsoft.com (client email? or assigned attorney?)
  // User said "assigned to one of the LLC partners, Ed@cannsoft.com".
  // So Ed is the attorney. The client is "Ed Cann" (character).
  
  // Let's look for the client "Ed Cann"
  const clientName = 'Ed Cann';
  const row = page.locator('tr', { hasText: clientName });
  await expect(row).toBeVisible();

  // Click Edit
  await row.locator('button:has-text("Edit")').click();

  // 3. Edit Name
  const modal = page.locator('.fixed.inset-0').last();
  await expect(modal).toBeVisible();
  
  // Click Edit button in modal to enable fields
  await modal.locator('button:has-text("Edit")').click();

  // Update First Name
  const firstNameInput = modal.locator('input[placeholder="First Name"]');
  await firstNameInput.fill('EdX');

  // Save
  await modal.locator('button:has-text("Save")').click();

  // 4. Verify Success
  // Modal might close or show success.
  // Wait for network idle or text change
  await page.waitForTimeout(1000); 
  
  // Verify row updated
  const updatedRow = page.locator('tr', { hasText: 'EdX Cann' });
  await expect(updatedRow).toBeVisible();
});
