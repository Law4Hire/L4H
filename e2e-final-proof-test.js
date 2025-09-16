const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 FINAL PROOF TEST: User Management with Fresh Tokens');
    console.log('=========================================================');
    
    // Clear all local storage to ensure fresh start
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    const consoleLogs = [];
    const networkLogs = [];
    
    page.on('console', msg => {
      const msgText = msg.text();
      consoleLogs.push(msgText);
      if (msgText.includes('jwt_token') || msgText.includes('token') || msgText.includes('401') || msgText.includes('Error')) {
        console.log('🔍 Console:', msgText);
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
        console.log(`🌐 ${response.status()} - ${response.url()}`);
      }
    });

    // STEP 1: Go to login page
    console.log('\n1️⃣ Loading login page with cleared storage...');
    await page.goto('http://localhost:5178/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');

    // STEP 2: Login and capture token
    console.log('\n2️⃣ Logging in as admin...');
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in');
    
    // Check the stored JWT token
    const storedToken = await page.evaluate(() => localStorage.getItem('jwt_token'));
    console.log('🔑 JWT Token stored:', storedToken ? 'YES' : 'NO');
    if (storedToken) {
      console.log('   Token length:', storedToken.length);
      // Decode JWT to check claims
      const tokenParts = storedToken.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('   Token claims:');
          console.log('     - sub:', payload.sub || 'MISSING');
          console.log('     - is_admin:', payload.is_admin || 'MISSING');
          console.log('     - email:', payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 'MISSING');
        } catch (e) {
          console.log('   Could not decode token payload');
        }
      }
    }

    // STEP 3: Navigate to Admin
    console.log('\n3️⃣ Navigating to Admin page...');
    const userDropdown = await page.locator('text=/Hello.*/').first();
    await userDropdown.click();
    await page.waitForTimeout(500);
    
    const adminLink = await page.locator('text=Admin').first();
    await adminLink.click();
    await page.waitForURL('**/admin', { timeout: 5000 });
    console.log('✅ On admin page');

    // STEP 4: Click Manage Users and wait
    console.log('\n4️⃣ Clicking Manage Users...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageUsersBtn = buttons.find(btn => btn.textContent?.includes('Manage Users'));
      if (manageUsersBtn) {
        manageUsersBtn.click();
      }
    });
    
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (!currentUrl.includes('/admin/users')) {
      throw new Error('Failed to navigate to user management page');
    }
    console.log('✅ On user management page');

    // STEP 5: Wait for API call and check token usage
    console.log('\n5️⃣ Checking API calls and token usage...');
    
    // Wait longer for API calls
    await page.waitForTimeout(5000);
    
    // Check what token is being used in requests
    const currentToken = await page.evaluate(() => localStorage.getItem('jwt_token'));
    console.log('🔍 Token at time of API call:', currentToken ? 'Present' : 'MISSING');
    
    // Check the network requests
    const adminUserRequests = networkLogs.filter(log => log.url.includes('/admin/users'));
    console.log('📊 Admin users API calls:', adminUserRequests.length);
    
    if (adminUserRequests.length > 0) {
      const lastRequest = adminUserRequests[adminUserRequests.length - 1];
      console.log('   Last request status:', lastRequest.status);
      
      if (lastRequest.status === 200) {
        // Success! Count the users
        await page.waitForTimeout(2000); // Wait for UI to update
        const userRows = await page.locator('tbody tr').count();
        const adminUserVisible = await page.locator('text=Denise Cann').isVisible();
        const adminEmailVisible = await page.locator('text=dcann@cannlaw.com').isVisible();
        
        console.log('\n🎉 SUCCESS! API Authorization Working!');
        console.log('=====================================');
        console.log(`   ✅ User rows displayed: ${userRows}`);
        console.log(`   ✅ Admin user visible: ${adminUserVisible}`);
        console.log(`   ✅ Admin email visible: ${adminEmailVisible}`);
        console.log(`   ✅ API Response: ${lastRequest.status}`);
        
        if (userRows > 0) {
          console.log('\n🏆 FINAL RESULT: USER MANAGEMENT IS FULLY WORKING!');
          console.log('   - Authentication: ✅ Working');
          console.log('   - Authorization: ✅ Working');
          console.log('   - Data Display: ✅ Working');
          console.log(`   - User Count: ${userRows} users found`);
          
          // Show successful network timeline
          console.log('\n📈 Successful Request Timeline:');
          networkLogs.forEach((log, i) => {
            console.log(`   ${i+1}. ${log.status} - ${log.url}`);
          });
          
        } else {
          console.log('\n⚠️  API works but UI not displaying data properly');
        }
        
      } else if (lastRequest.status === 401) {
        console.log('\n❌ STILL GETTING 401 - Token Issue Persists');
        console.log('   The JWT token structure may still be incorrect');
        console.log('   Or there may be a timing issue with token storage');
      }
    } else {
      console.log('\n❌ No admin/users API calls detected');
      console.log('   This suggests the frontend is not making the request');
    }
    
    // Show all console logs for debugging
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('token') || 
      log.includes('401') || 
      log.includes('Error') ||
      log.includes('jwt')
    );
    
    if (relevantLogs.length > 0) {
      console.log('\n🔍 Relevant Console Logs:');
      relevantLogs.forEach(log => console.log(`   ${log}`));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    console.log('\n⏱️  Keeping browser open for 15 seconds for manual inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
})();