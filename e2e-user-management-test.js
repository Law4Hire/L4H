const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔧 COMPREHENSIVE E2E TEST: User Management Flow');
    console.log('======================================================');
    
    // Collect console messages for debugging
    const consoleLogs = [];
    const networkLogs = [];
    
    page.on('console', msg => {
      const msgText = msg.text();
      consoleLogs.push(msgText);
      if (msgText.includes('API') || msgText.includes('fetch') || msgText.includes('Error') || msgText.includes('401') || msgText.includes('Unauthorized')) {
        console.log('🔍 Browser console:', msgText);
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ Page error:', error.message);
    });

    // Monitor network requests
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/v1/')) {
        networkLogs.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`🌐 Network: ${response.status()} ${response.url()}`);
      }
    });

    // STEP 1: Navigate to login page
    console.log('\n1️⃣ Navigating to login page...');
    await page.goto('http://localhost:5178/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded successfully');

    // STEP 2: Login as admin
    console.log('\n2️⃣ Logging in as admin user (dcann@cannlaw.com)...');
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect and check for success
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ Successfully logged in and redirected to dashboard');
    } catch (error) {
      console.log('❌ Login failed or redirect did not occur');
      console.log('   Current URL:', page.url());
      throw error;
    }
    
    // STEP 3: Navigate to Admin via dropdown
    console.log('\n3️⃣ Navigating to Admin page via dropdown...');
    
    // Wait for and click the user dropdown (Hello Denise)
    const userDropdown = await page.locator('text=/Hello.*/').first();
    await userDropdown.waitFor({ state: 'visible', timeout: 5000 });
    await userDropdown.click();
    console.log('   ✓ Clicked user dropdown');
    
    // Wait a moment for dropdown to appear
    await page.waitForTimeout(500);
    
    // Click Admin link
    const adminLink = await page.locator('text=Admin').first();
    await adminLink.waitFor({ state: 'visible', timeout: 3000 });
    await adminLink.click();
    console.log('   ✓ Clicked Admin link');
    
    // Wait for navigation to admin page
    try {
      await page.waitForURL('**/admin', { timeout: 5000 });
      console.log('✅ Successfully navigated to admin page');
    } catch (error) {
      console.log('❌ Failed to navigate to admin page');
      console.log('   Current URL:', page.url());
      throw error;
    }
    
    // STEP 4: Click Manage Users button
    console.log('\n4️⃣ Clicking "Manage Users" button...');
    
    // Wait for the button to be visible
    const manageUsersButton = await page.locator('text=Manage Users').first();
    await manageUsersButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('   ✓ Found Manage Users button');
    
    // Click using JavaScript to ensure it works
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageUsersBtn = buttons.find(btn => btn.textContent?.includes('Manage Users'));
      if (manageUsersBtn) {
        console.log('Found and clicking Manage Users button via JavaScript');
        manageUsersBtn.click();
        return true;
      }
      return false;
    });
    console.log('   ✓ Clicked Manage Users button');
    
    // Wait for navigation to user management page
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (!currentUrl.includes('/admin/users')) {
      console.log('❌ Failed to navigate to user management page');
      throw new Error('Navigation to /admin/users failed');
    }
    console.log('✅ Successfully navigated to User Management page');
    
    // STEP 5: Wait for users to load and verify count
    console.log('\n5️⃣ Waiting for users to load and verifying count...');
    
    // Wait longer for API call to complete
    await page.waitForTimeout(5000);
    
    // Check for loading states
    const loadingVisible = await page.locator('text=Loading').isVisible();
    if (loadingVisible) {
      console.log('   ⏳ Loading indicator still visible, waiting...');
      await page.waitForTimeout(3000);
    }
    
    // Count user rows in table
    const userRows = await page.locator('tbody tr').count();
    console.log('📊 Number of user rows found in table:', userRows);
    
    // Check for specific admin user data
    const adminUserVisible = await page.locator('text=Denise Cann').isVisible();
    const adminEmailVisible = await page.locator('text=dcann@cannlaw.com').isVisible();
    
    console.log('👤 Admin user "Denise Cann" visible:', adminUserVisible);
    console.log('📧 Admin email "dcann@cannlaw.com" visible:', adminEmailVisible);
    
    // Check for user count display
    let userCountText = null;
    const userCountVisible = await page.locator('text=/Found \\d+ users?/').isVisible();
    if (userCountVisible) {
      userCountText = await page.locator('text=/Found \\d+ users?/').textContent();
      console.log('🔢 User count display:', userCountText);
    }
    
    // Check for any error messages
    const errorElements = await page.locator('text=/error|Error|failed|Failed/').count();
    if (errorElements > 0) {
      console.log('⚠️  Error messages found on page:', errorElements);
      const errorTexts = await page.locator('text=/error|Error|failed|Failed/').allTextContents();
      errorTexts.forEach(text => console.log('   Error:', text));
    }
    
    // STEP 6: Final assessment
    console.log('\n6️⃣ FINAL ASSESSMENT');
    console.log('======================================================');
    
    // The test FAILS if user count is 0
    if (userRows === 0) {
      console.log('❌ TEST FAILED: User count is 0');
      console.log('   FAILURE REASONS:');
      console.log('   - No users displayed in table');
      console.log('   - Admin user not visible:', !adminUserVisible);
      console.log('   - Admin email not visible:', !adminEmailVisible);
      
      // Show network logs for debugging
      console.log('\n🌐 Network Request Summary:');
      networkLogs.forEach(log => {
        console.log(`   ${log.status} - ${log.url}`);
      });
      
      // Show relevant console logs
      const relevantLogs = consoleLogs.filter(log => 
        log.includes('API') || 
        log.includes('fetch') || 
        log.includes('Error') || 
        log.includes('401') || 
        log.includes('Unauthorized') ||
        log.includes('Failed')
      );
      
      if (relevantLogs.length > 0) {
        console.log('\n🔍 Relevant Browser Console Logs:');
        relevantLogs.forEach(log => console.log('   ', log));
      }
      
      throw new Error('USER MANAGEMENT TEST FAILED: 0 users displayed');
    }
    
    // Test PASSES if users are found
    console.log('🎉 ✅ TEST PASSED: User Management is working correctly!');
    console.log('');
    console.log('SUCCESS METRICS:');
    console.log(`   ✓ Login: Working (redirected to dashboard)`);
    console.log(`   ✓ Navigation: Working (reached /admin/users)`);
    console.log(`   ✓ User Data: Working (${userRows} users displayed)`);
    console.log(`   ✓ Admin User: ${adminUserVisible ? 'Visible' : 'Not Visible'}`);
    console.log(`   ✓ Admin Email: ${adminEmailVisible ? 'Visible' : 'Not Visible'}`);
    if (userCountText) {
      console.log(`   ✓ Count Display: ${userCountText}`);
    }
    
    // Show successful network requests
    const successfulRequests = networkLogs.filter(log => log.status >= 200 && log.status < 300);
    if (successfulRequests.length > 0) {
      console.log('\n✅ Successful API Requests:');
      successfulRequests.forEach(log => {
        console.log(`   ${log.status} - ${log.url}`);
      });
    }
    
    console.log('\n🎯 CONCLUSION: User management authentication and data display are both working correctly!');

  } catch (error) {
    console.error('\n❌ TEST EXECUTION FAILED:');
    console.error('   Error:', error.message);
    console.error('   Current URL:', page.url());
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-failure-screenshot.png' });
    console.log('   📸 Screenshot saved as test-failure-screenshot.png');
    
    process.exit(1);
  } finally {
    // Keep browser open for 10 seconds so user can see the result
    console.log('\n⏱️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();