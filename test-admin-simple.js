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

    // Test 1: Check if buttons are visible
    console.log('Checking admin buttons visibility...');

    const manageUsersButton = await page.locator('text=Manage Users').first();
    const manageCasesButton = await page.locator('text=Manage Cases').first();
    const managePricingButton = await page.locator('text=Manage Pricing').first();

    // Check if buttons are visible
    const usersVisible = await manageUsersButton.isVisible();
    const casesVisible = await manageCasesButton.isVisible();
    const pricingVisible = await managePricingButton.isVisible();

    console.log('Manage Users button visible:', usersVisible ? '✅' : '❌');
    console.log('Manage Cases button visible:', casesVisible ? '✅' : '❌');
    console.log('Manage Pricing button visible:', pricingVisible ? '✅' : '❌');

    // Test 2: Check button styling
    if (usersVisible) {
      const buttonClasses = await manageUsersButton.getAttribute('class');
      console.log('Button classes:', buttonClasses);

      const hasBlueBackground = buttonClasses && buttonClasses.includes('bg-blue-600');
      console.log('Button has blue background:', hasBlueBackground ? '✅' : '❌');
    }

    // Test 3: Navigate to user management
    console.log('Testing user management page...');
    if (usersVisible) {
      await manageUsersButton.click();
      await page.waitForURL('**/admin/users', { timeout: 10000 });
      console.log('Navigated to user management page');

      // Wait for the users table to load
      await page.waitForSelector('table', { timeout: 10000 });

      // Check if users are displayed
      const userRows = await page.locator('tbody tr').count();
      console.log(`Found ${userRows} user rows in the table`);

      if (userRows > 0) {
        console.log('✅ Users are being displayed correctly');

        // Check user count display
        const userCountElement = await page.locator('text=Found').textContent();
        console.log('User count display:', userCountElement);

        // Check if admin user is visible
        const adminUserVisible = await page.locator('text=dcann@cannlaw.com').isVisible();
        console.log('Admin user visible in table:', adminUserVisible ? '✅' : '❌');
      } else {
        console.log('❌ No users found - API issue still exists');
      }
    }

    console.log('🎉 Admin screen test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'admin-test-failure.png', fullPage: true });
    console.log('Screenshot saved as admin-test-failure.png');
  } finally {
    await browser.close();
  }
}

testAdminScreenFixes();