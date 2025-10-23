import { test, expect } from '@playwright/test';

test('basic test to verify setup', async ({ page }) => {
  // This is a simple test to verify the test setup works
  expect(true).toBe(true);
  console.log('✅ Basic test setup is working');
});