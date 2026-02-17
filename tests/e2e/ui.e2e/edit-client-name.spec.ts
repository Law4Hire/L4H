import { test, expect } from '@playwright/test';

test('Edit Client Name as Admin', async ({ page }) => {
  // 1. Log in as Denise (Admin)
  await page.goto('/');
  await page.fill('input[name="email"]', 'denise@cannlaw.com');
  await page.fill('input[name="password"]', 'password123'); // Assuming default test password
  await page.click('button:has-text("Login")');

  // Verify Dashboard Load
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Hello Denise');

  // 2. Go to Dashboard and find a testing case
  // We need a stable target. Let's look for a row with a specific email or name.
  // The user mentioned "Ed@cannsoft.com". Let's assume we can search or find it.
  
  // Use the search box to filter for "test" or a known test account
  const searchInput = page.locator('input[placeholder="Search by client name..."]');
  await searchInput.fill('Ed');
  await page.waitForTimeout(1000); // Wait for debounce

  // 3. Click Edit on the case
  // Find the row containing "Ed" and click the "Edit" button
  const row = page.locator('tr').filter({ hasText: 'Ed' }).first();
  await expect(row).toBeVisible();
  
  await row.locator('button:has-text("Edit")').click();

  // 4. Change Name
  const modal = page.locator('div.fixed.inset-0'); // Modal container
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Case Details');

  // Click "Edit" in the modal to switch to edit mode
  await modal.locator('button:has-text("Edit")').click();

  // Find the First Name input
  const firstNameInput = modal.locator('input[placeholder="First Name"]');
  const originalName = await firstNameInput.inputValue();
  const newName = originalName + 'X';
  
  await firstNameInput.fill(newName);

  // 5. Save
  await modal.locator('button:has-text("Save")').click();

  // 6. Verify result
  // The modal might close, or update. Let's check if the row updates or if we can re-open and see the change.
  // Assuming success closes edit mode or updates the view.
  // Let's verify the row in the table is updated.
  await expect(page.locator('tr').filter({ hasText: newName })).toBeVisible();

});
