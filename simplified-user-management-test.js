const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🎯 SIMPLIFIED USER MANAGEMENT TEST');
    console.log('==================================');
    
    const networkLogs = [];
    
    // Monitor API requests
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

    // Track admin requests specifically
    page.on('request', request => {
      if (request.url().includes('/admin/users')) {
        const headers = request.headers();
        const authHeader = headers.authorization;
        console.log(`📤 Admin Request Authorization:`, authHeader ? 'PRESENT ✅' : '❌ MISSING');
        if (authHeader) {
          console.log(`   Header: ${authHeader.substring(0, 30)}...`);
        }
      }
    });

    // STEP 1: Go to login page
    console.log('\n1️⃣ Loading login page...');
    await page.goto('http://localhost:5179/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');

    // STEP 2: Login
    console.log('\n2️⃣ Logging in as admin...');
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in');
    
    // Check token after login
    await page.waitForTimeout(1000);
    const storageToken = await page.evaluate(() => {
      try {
        return localStorage.getItem('jwt_token');
      } catch (e) {
        return 'ERROR: ' + e.message;
      }
    });
    console.log('🔑 Token after login:', storageToken ? 'STORED ✅' : '❌ MISSING');

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
    console.log('\n4️⃣ Clicking Manage Users...');
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

    // STEP 5: Wait for API call and check results
    console.log('\n5️⃣ Waiting for admin users API call...');
    await page.waitForTimeout(5000);
    
    // Check final results
    const adminUserRequests = networkLogs.filter(log => log.url.includes('/admin/users'));
    console.log('📊 Admin users API calls:', adminUserRequests.length);
    
    if (adminUserRequests.length > 0) {
      const lastRequest = adminUserRequests[adminUserRequests.length - 1];
      console.log('   Last request status:', lastRequest.status);
      
      if (lastRequest.status === 200) {
        // Count users in UI
        await page.waitForTimeout(2000);
        const userRows = await page.locator('tbody tr').count();
        const adminUserVisible = await page.locator('text=Denise Cann').isVisible();
        
        console.log('\n🎉 SUCCESS! API WORKING!');
        console.log('=========================');
        console.log(`   User rows displayed: ${userRows}`);
        console.log(`   Admin user visible: ${adminUserVisible}`);
        
        if (userRows > 0) {
          console.log('\n🏆 COMPLETE SUCCESS! USER MANAGEMENT IS WORKING!');
          console.log('==================================================');
          console.log('✅ Authentication: Working');
          console.log('✅ Token Persistence: Working');
          console.log('✅ API Authorization: Working');
          console.log('✅ Data Display: Working');
          console.log(`✅ Users Found: ${userRows} users`);
        } else {
          console.log('\n⚠️  API works but no users displayed');
        }
        
      } else if (lastRequest.status === 401) {
        console.log('\n❌ STILL 401 - Authorization still failing');
      }
    } else {
      console.log('\n❌ No admin/users API calls detected');
    }
    
    // Show all API calls
    console.log('\n📈 All API Calls:');
    networkLogs.forEach((log, i) => {
      console.log(`   ${i+1}. ${log.method} ${log.status} - ${log.url}`);
    });

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    console.log('\n⏱️  Browser will stay open for 15 seconds...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
})();