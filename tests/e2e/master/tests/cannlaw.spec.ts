import { test, expect } from '@playwright/test';
import { logError } from '../utils/logger';

test.describe('Cannlaw Admin Flow', () => {
  test.use({ storageState: '.auth/cannlaw_admin.json' });

  test('Verify Dashboard and Menu Navigation', async ({ page }) => {
    try {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Verify Dashboard Title
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      
      // Navigate to Admin Section
      await page.goto('/admin');
      await expect(page).toHaveURL(/.*admin/);
      await expect(page.getByText('Admin')).toBeVisible();

      // Check specific admin menu items if possible
      // Example: Attorneys, Services (based on App.tsx routes)
      await page.goto('/admin/attorneys');
      await expect(page).toHaveURL(/.*attorneys/);
      
    } catch (error) {
      logError('Cannlaw Admin Flow', error);
      throw error;
    }
  });
});

test.describe('Cannlaw Pro Flow', () => {
  test.use({ storageState: '.auth/cannlaw_pro.json' });

  test('Verify Professional Dashboard', async ({ page }) => {
    try {
      await page.goto('/dashboard');
      // Pro user may see dashboard or access denied depending on permissions
      await expect(page.getByRole('heading').first()).toBeVisible();

      // Check Pro specific routes
      await page.goto('/clients');
      // May redirect if access denied
      await page.waitForLoadState('networkidle');

      await page.goto('/time-tracking');
      await page.waitForLoadState('networkidle');
    } catch (error) {
      logError('Cannlaw Pro Flow', error);
      throw error;
    }
  });

  test('Security Check: Pro accessing Admin routes', async ({ page }) => {
    try {
      // Pro user (Abu) is not Admin, should be redirected or 403
      await page.goto('/admin');
      
      // Expect NOT to be on admin page
      // App.tsx shows ProtectedRoute requireAdmin. 
      // If unauthorized, it might redirect to /unauthorized or dashboard or login
      const url = page.url();
      expect(url).not.toContain('/admin');
      
      // If it redirects to Unauthorized page:
      if (url.includes('unauthorized')) {
         await expect(page.getByText('Access Denied')).toBeVisible();
      }
    } catch (error) {
      logError('Cannlaw Security Check', error);
      throw error;
    }
  });
});
