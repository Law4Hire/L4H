const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Testing complete user management flow...');
    
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
    
    // Click "Manage Users" button
    await manageUsersButton.click();
    console.log('10. Clicked "Manage Users" button');
    
    // Wait a moment for navigation (don't fail if URL doesn't change)
    try {
      await page.waitForURL('**/admin/users', { timeout: 3000 });
      console.log('11. Navigated to user management page');
    } catch {
      console.log('11. URL did not change to /admin/users - checking current page content');
      const currentUrl = page.url();
      console.log('    Current URL:', currentUrl);
    }
    
    // Wait for the page to load and check for users
    await page.waitForLoadState('networkidle');
    
    // Check if we can see the user count
    const userCountText = await page.locator('text=/Found \\d+ users?/').first();
    try {
      await userCountText.waitFor({ state: 'visible', timeout: 5000 });
      const userCountString = await userCountText.textContent();
      console.log('12. User count display:', userCountString);
    } catch {
      console.log('12. User count text not found - may not be on user management page');
    }
    
    // Check if we can see actual user rows in the table
    const userRows = await page.locator('tbody tr').count();
    console.log('13. Number of user rows in table:', userRows);
    
    // Check specifically for admin user "Denise Cann"
    const adminUserRow = await page.locator('text=Denise Cann').first();
    const adminUserVisible = await adminUserRow.isVisible();
    console.log('14. Admin user "Denise Cann" visible:', adminUserVisible);
    
    // Check for email dcann@cannlaw.com
    const adminEmail = await page.locator('text=dcann@cannlaw.com').first();
    const adminEmailVisible = await adminEmail.isVisible();
    console.log('15. Admin email "dcann@cannlaw.com" visible:', adminEmailVisible);
    
    if (userRows > 0 && adminUserVisible && adminEmailVisible) {
      console.log('✅ SUCCESS: User Management is working! Users are displayed correctly.');
    } else {
      console.log('❌ FAILURE: User Management is NOT working. Users are not displayed.');
      console.log('   - User rows:', userRows);
      console.log('   - Admin user visible:', adminUserVisible);
      console.log('   - Admin email visible:', adminEmailVisible);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();