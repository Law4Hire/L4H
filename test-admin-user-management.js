const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Testing admin user management with debugging...');
    
    // Listen for console errors and navigation events
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    // Go to login page
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    console.log('2. Loaded login page');

    // Login as admin
    console.log('3. Logging in as admin user...');
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('4. Successfully logged in and redirected to dashboard');
    
    // Look for user dropdown button (Hello Denise)
    const userDropdown = await page.locator('text=/Hello.*/').first();
    await userDropdown.waitFor({ state: 'visible', timeout: 5000 });
    console.log('5. User dropdown "Hello Denise" button is visible');
    
    // Click user dropdown to open menu
    await userDropdown.click();
    console.log('6. Clicked user dropdown to open menu');
    
    // Wait a moment for dropdown to open
    await page.waitForTimeout(500);
    
    // Look for Admin link in dropdown menu
    const adminLink = await page.locator('text=Admin').first();
    await adminLink.waitFor({ state: 'visible', timeout: 5000 });
    console.log('7. Admin link is visible in dropdown menu');
    
    // Click Admin link
    await adminLink.click();
    await page.waitForURL('**/admin', { timeout: 5000 });
    console.log('8. Navigated to admin page');
    
    // Look for "Manage Users" button
    const manageUsersButton = await page.locator('text=Manage Users').first();
    await manageUsersButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('9. "Manage Users" button is visible');
    
    // Get current URL before clicking
    const urlBeforeClick = page.url();
    console.log('10. URL before clicking Manage Users:', urlBeforeClick);
    
    // Click "Manage Users" button with more explicit handling
    console.log('11. Clicking "Manage Users" button...');
    
    // Wait for navigation promise
    const navigationPromise = page.waitForURL('**/admin/users', { timeout: 5000 }).catch(() => {
      console.log('    Navigation timeout - checking if URL changed anyway');
    });
    
    // Click the button
    await manageUsersButton.click();
    
    // Wait for potential navigation
    await navigationPromise;
    
    // Check URL after click
    await page.waitForTimeout(1000); // Give time for any potential navigation
    const urlAfterClick = page.url();
    console.log('12. URL after clicking Manage Users:', urlAfterClick);
    
    if (urlAfterClick !== urlBeforeClick) {
      console.log('13. ✅ Navigation occurred');
    } else {
      console.log('13. ❌ No navigation - URL did not change');
      
      // Check if button is actually clickable and not disabled
      const isEnabled = await manageUsersButton.isEnabled();
      const isVisible = await manageUsersButton.isVisible();
      console.log('    Button enabled:', isEnabled);
      console.log('    Button visible:', isVisible);
      
      // Try clicking again with force option
      console.log('    Attempting force click...');
      await manageUsersButton.click({ force: true });
      await page.waitForTimeout(1000);
      
      const urlAfterForceClick = page.url();
      console.log('    URL after force click:', urlAfterForceClick);
    }
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're now on the user management page by looking for specific content
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/users')) {
      console.log('14. ✅ Successfully navigated to user management page');
      
      // Check if we can see the user count
      const userCountText = await page.locator('text=/Found \\d+ users?/').first();
      try {
        await userCountText.waitFor({ state: 'visible', timeout: 5000 });
        const userCountString = await userCountText.textContent();
        console.log('15. User count display:', userCountString);
      } catch {
        console.log('15. User count text not found');
      }
      
      // Check if we can see actual user rows in the table
      const userRows = await page.locator('tbody tr').count();
      console.log('16. Number of user rows in table:', userRows);
      
      // Check specifically for admin user "Denise Cann"
      const adminUserRow = await page.locator('text=Denise Cann').first();
      const adminUserVisible = await adminUserRow.isVisible();
      console.log('17. Admin user "Denise Cann" visible:', adminUserVisible);
      
      // Check for email dcann@cannlaw.com
      const adminEmail = await page.locator('text=dcann@cannlaw.com').first();
      const adminEmailVisible = await adminEmail.isVisible();
      console.log('18. Admin email "dcann@cannlaw.com" visible:', adminEmailVisible);
      
      if (userRows > 0 && adminUserVisible && adminEmailVisible) {
        console.log('✅ SUCCESS: User Management is working! Users are displayed correctly.');
      } else {
        console.log('❌ FAILURE: User Management page loads but users are not displayed.');
        console.log('   - User rows:', userRows);
        console.log('   - Admin user visible:', adminUserVisible);
        console.log('   - Admin email visible:', adminEmailVisible);
      }
    } else {
      console.log('14. ❌ Still not on user management page');
      console.log('    Current URL:', currentUrl);
      console.log('    Expected URL should contain: /admin/users');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();