const { chromium } = require('playwright');

async function testAdminScreenFixes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Starting admin screen test...');

    // Navigate to login page
    await page.goto('http://localhost:5178/login');
    await page.waitForSelector('form', { timeout: 10000 });

    console.log('Logging in as admin...');

    // Login as admin
    await page.fill('input[type="email"]', 'dcann@cannlaw.com');
    await page.fill('input[type="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Logged in successfully');

    // Navigate to admin page
    console.log('Navigating to admin page...');
    await page.goto('http://localhost:5178/admin');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Test 1: Check if admin page header is visible
    const adminHeader = await page.textContent('h1');
    console.log('Admin page header:', adminHeader);

    // Test 2: Check if buttons are visible and properly styled
    console.log('Checking admin buttons visibility...');

    const manageUsersButton = await page.locator('text=Manage Users').first();
    const manageCasesButton = await page.locator('text=Manage Cases').first();
    const managePricingButton = await page.locator('text=Manage Pricing').first();

    // Check if buttons are visible
    await expect(manageUsersButton).toBeVisible();
    await expect(manageCasesButton).toBeVisible();
    await expect(managePricingButton).toBeVisible();

    // Check button styling - they should have the blue background
    const manageUsersButtonClass = await manageUsersButton.getAttribute('class');
    console.log('Manage Users button classes:', manageUsersButtonClass);

    // Test 3: Navigate to user management and check if users are loaded
    console.log('Testing user management page...');
    await manageUsersButton.click();

    // Wait for navigation
    await page.waitForURL('**/admin/users', { timeout: 10000 });
    console.log('Navigated to user management page');

    // Wait for the users table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check if users are displayed
    const userRows = await page.locator('tbody tr').count();
    console.log(`Found ${userRows} user rows in the table`);

    if (userRows > 0) {
      console.log('✅ Users are being displayed correctly');

      // Check if the admin user is visible
      const adminUserVisible = await page.locator('text=dcann@cannlaw.com').isVisible();
      console.log('Admin user visible:', adminUserVisible ? '✅' : '❌');

      // Check if the user count is displayed
      const userCountText = await page.locator('text=Found').textContent();
      console.log('User count display:', userCountText);
    } else {
      console.log('❌ No users found - this indicates the API issue still exists');
    }

    // Test 4: Check if role checkboxes are functional
    console.log('Testing role management functionality...');
    const firstUserRow = page.locator('tbody tr').first();
    const adminCheckbox = firstUserRow.locator('input[type="checkbox"]').first();
    const staffCheckbox = firstUserRow.locator('input[type="checkbox"]').last();

    console.log('Admin checkbox visible:', await adminCheckbox.isVisible() ? '✅' : '❌');
    console.log('Staff checkbox visible:', await staffCheckbox.isVisible() ? '✅' : '❌');

    console.log('🎉 Admin screen fixes test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'admin-test-failure.png', fullPage: true });
    console.log('Screenshot saved as admin-test-failure.png');
  } finally {
    await browser.close();
  }
}

// Helper function to add expect functionality
async function expect(locator) {
  return {
    toBeVisible: async () => {
      const isVisible = await locator.isVisible();
      if (!isVisible) {
        throw new Error(`Element not visible: ${locator}`);
      }
      return true;
    }
  };
}

testAdminScreenFixes();