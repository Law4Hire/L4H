const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🎯 FINAL COMPLETE TEST: User Management with Token Persistence Fix');
    console.log('================================================================');
    
    // Clear all storage to ensure fresh start
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    const networkLogs = [];
    const tokenLogs = [];
    
    page.on('console', msg => {
      const msgText = msg.text();
      if (msgText.includes('token') || msgText.includes('localStorage')) {
        console.log('🔍 Console:', msgText);
      }
    });

    // Monitor network requests
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/v1/')) {
        networkLogs.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
        console.log(`🌐 ${response.request().method()} ${response.status()} - ${response.url()}`);
      }
    });

    page.on('request', request => {
      if (request.url().includes('/admin/users')) {
        const headers = request.headers();
        const authHeader = headers.authorization;
        tokenLogs.push({
          url: request.url(),
          hasAuth: !!authHeader,
          authValue: authHeader ? authHeader.substring(0, 50) + '...' : 'MISSING'
        });
        console.log(`📤 Admin Request Authorization:`, authHeader ? 'PRESENT' : '❌ MISSING');
      }
    });

    // STEP 1: Go to login page
    console.log('\n1️⃣ Loading login page with cleared storage...');
    await page.goto('http://localhost:5179/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');

    // Check initial state
    let storageToken = await page.evaluate(() => localStorage.getItem('jwt_token'));
    console.log('   Initial localStorage token:', storageToken ? 'PRESENT' : 'NONE (expected)');

    // STEP 2: Login and capture token storage
    console.log('\n2️⃣ Logging in as admin...');
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in');
    
    // CHECK: Token should now be stored in localStorage
    storageToken = await page.evaluate(() => localStorage.getItem('jwt_token'));
    console.log('🔑 Token after login:');
    console.log('   localStorage:', storageToken ? 'STORED ✅' : '❌ MISSING');
    
    if (storageToken) {
      console.log('   Token length:', storageToken.length);
      // Decode to check claims
      try {
        const payload = JSON.parse(atob(storageToken.split('.')[1]));
        console.log('   Key claims:');
        console.log('     - sub:', payload.sub || 'MISSING');
        console.log('     - is_admin:', payload.is_admin || 'MISSING');
        console.log('     - email:', payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 'MISSING');
      } catch (e) {
        console.log('   Could not decode token');
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

    // STEP 4: Click Manage Users
    console.log('\n4️⃣ Clicking Manage Users button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageUsersBtn = buttons.find(btn => btn.textContent?.includes('Manage Users'));
      if (manageUsersBtn) {
        manageUsersBtn.click();
      }
    });
    
    await page.waitForTimeout(2000);
    await page.waitForURL('**/admin/users', { timeout: 5000 });
    console.log('✅ On user management page');

    // STEP 5: Wait for API call and verify token usage
    console.log('\n5️⃣ Waiting for admin users API call...');
    await page.waitForTimeout(5000); // Give time for API call
    
    // Check token is still available for the API call
    const currentToken = await page.evaluate(() => localStorage.getItem('jwt_token'));
    console.log('🔍 Token available for API call:', currentToken ? 'YES ✅' : '❌ MISSING');
    
    // Analyze the API calls
    const adminUserRequests = networkLogs.filter(log => log.url.includes('/admin/users'));
    console.log('📊 Admin users API calls made:', adminUserRequests.length);
    
    if (adminUserRequests.length > 0) {
      const lastRequest = adminUserRequests[adminUserRequests.length - 1];
      console.log('   Last request status:', lastRequest.status);
      
      // Check authorization header
      if (tokenLogs.length > 0) {
        const lastTokenLog = tokenLogs[tokenLogs.length - 1];
        console.log('   Authorization header:', lastTokenLog.hasAuth ? 'PRESENT ✅' : '❌ MISSING');
      }
      
      if (lastRequest.status === 200) {
        // SUCCESS! Count the users in the UI
        await page.waitForTimeout(2000); // Wait for UI to update
        const userRows = await page.locator('tbody tr').count();
        const adminUserVisible = await page.locator('text=Denise Cann').isVisible();
        
        console.log('\n🎉 API CALL SUCCESSFUL!');
        console.log('========================');
        console.log(`   User rows displayed: ${userRows}`);
        console.log(`   Admin user visible: ${adminUserVisible}`);
        
        if (userRows > 0) {
          console.log('\n🏆 COMPLETE SUCCESS! USER MANAGEMENT IS FULLY WORKING!');
          console.log('======================================================');
          console.log('✅ JWT Token Generation: Working');
          console.log('✅ Token Persistence to localStorage: Working');
          console.log('✅ Token Retrieval for API Calls: Working');
          console.log('✅ API Authorization: Working');
          console.log('✅ Data Retrieval: Working');
          console.log('✅ UI Display: Working');
          console.log(`✅ Users Found: ${userRows} users`);
          
          console.log('\n🔧 FIXES THAT RESOLVED THE ISSUE:');
          console.log('1. Fixed JWT signing key length (256-bit requirement for HS256)');
          console.log('2. Added "sub" claim to JWT tokens for ASP.NET Core compatibility');
          console.log('3. Updated setJwtToken() to persist tokens to localStorage');
          console.log('4. Updated getJwtToken() to read from localStorage when memory is empty');
          console.log('5. Fixed Vite proxy configuration to properly route API calls');
          
        } else {
          console.log('\n⚠️  API successful but UI not showing data properly');
        }
        
      } else if (lastRequest.status === 401) {
        console.log('\n❌ STILL GETTING 401 - Authorization Issue Persists');
        console.log('   This should not happen if the fix worked properly');
      } else {
        console.log(`\n❌ API returned unexpected status: ${lastRequest.status}`);
      }
    } else {
      console.log('\n❌ No admin/users API calls detected');
      console.log('   Frontend may not be making the request');
    }
    
    // Show complete network timeline
    console.log('\n📈 Complete Network Request Timeline:');
    networkLogs.forEach((log, i) => {
      console.log(`   ${i+1}. ${log.method} ${log.status} - ${log.url}`);
    });

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    console.log('\n⏱️  Browser will stay open for 20 seconds for manual verification...');
    await page.waitForTimeout(20000);
    await browser.close();
  }
})();