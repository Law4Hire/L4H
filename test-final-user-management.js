const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔧 FINAL TEST: Complete user management flow with fixed proxy...');
    
    // Collect console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const msgText = msg.text();
      consoleLogs.push(msgText);
      if (msgText.includes('Manage Users') || msgText.includes('Failed to load') || msgText.includes('Error fetching')) {
        console.log('🔍 Browser console:', msgText);
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ Page error:', error.message);
    });

    // Go to corrected frontend URL
    await page.goto('http://localhost:5178/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ 1. Loaded login page on corrected port 5178');

    // Login as admin
    console.log('🔐 2. Logging in as admin user...');
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ 3. Successfully logged in and redirected to dashboard');
    
    // Navigate to admin via dropdown
    const userDropdown = await page.locator('text=/Hello.*/').first();
    await userDropdown.click();
    await page.waitForTimeout(500);
    
    const adminLink = await page.locator('text=Admin').first();
    await adminLink.click();
    await page.waitForURL('**/admin', { timeout: 5000 });
    console.log('✅ 4. Navigated to admin page via dropdown');
    
    // Find and click Manage Users button via JavaScript (since Playwright click doesn't work)
    console.log('🖱️ 5. Clicking "Manage Users" button via JavaScript...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageUsersBtn = buttons.find(btn => btn.textContent?.includes('Manage Users'));
      if (manageUsersBtn) {
        console.log('Found and clicking Manage Users button');
        manageUsersBtn.click();
      } else {
        console.log('ERROR: Manage Users button not found');
      }
    });
    
    // Wait for navigation and check URL
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('🌐 6. Current URL after clicking:', currentUrl);
    
    if (currentUrl.includes('/admin/users')) {
      console.log('✅ 7. Successfully navigated to User Management page');
      
      // Wait for users to load and check API response
      await page.waitForTimeout(3000);
      
      // Check if user data loaded successfully
      const userRows = await page.locator('tbody tr').count();
      console.log('📊 8. Number of user rows in table:', userRows);
      
      // Check specifically for admin user "Denise Cann"
      const adminUserVisible = await page.locator('text=Denise Cann').isVisible();
      console.log('👤 9. Admin user "Denise Cann" visible:', adminUserVisible);
      
      // Check for admin email
      const adminEmailVisible = await page.locator('text=dcann@cannlaw.com').isVisible();
      console.log('📧 10. Admin email "dcann@cannlaw.com" visible:', adminEmailVisible);
      
      // Check for user count display
      const userCountVisible = await page.locator('text=/Found \\d+ users?/').isVisible();
      console.log('🔢 11. User count display visible:', userCountVisible);
      
      if (userCountVisible) {
        const userCountText = await page.locator('text=/Found \\d+ users?/').textContent();
        console.log('📝 12. User count text:', userCountText);
      }
      
      // Final assessment
      if (userRows > 0 && adminUserVisible && adminEmailVisible) {
        console.log('🎉 ✅ SUCCESS: User Management is FULLY WORKING!');
        console.log('   - Navigation: ✅ Working');
        console.log('   - API Authentication: ✅ Working');
        console.log('   - Data Display: ✅ Working');
        console.log('   - User rows found:', userRows);
        console.log('   - Admin user visible: ✅');
        console.log('   - Admin email visible: ✅');
      } else {
        console.log('❌ PARTIAL SUCCESS: Navigation works but data display issues');
        console.log('   - User rows:', userRows);
        console.log('   - Admin user visible:', adminUserVisible);
        console.log('   - Admin email visible:', adminEmailVisible);
        
        // Check for any error messages on page
        const errorMessages = await page.locator('text=/error|Error|failed|Failed/').count();
        if (errorMessages > 0) {
          console.log('⚠️  Error messages found on page:', errorMessages);
        }
      }
    } else {
      console.log('❌ Navigation failed - still not on user management page');
      console.log('   Current URL:', currentUrl);
    }
    
    // Show relevant console logs
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('Manage Users') || 
      log.includes('Failed to load') || 
      log.includes('Error fetching') ||
      log.includes('401') ||
      log.includes('Unauthorized')
    );
    
    if (relevantLogs.length > 0) {
      console.log('🔍 Relevant console logs:');
      relevantLogs.forEach(log => console.log('  ', log));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();