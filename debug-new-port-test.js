const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 DEBUGGING: Testing New Port 5179');
    
    const networkLogs = [];
    
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
      if (request.url().includes('/api/') || request.url().includes('/v1/')) {
        const headers = request.headers();
        console.log(`📤 Request to: ${request.url()}`);
        if (headers.authorization) {
          console.log(`   Authorization: ${headers.authorization.substring(0, 50)}...`);
        } else {
          console.log(`   ❌ NO Authorization header`);
        }
      }
    });

    // Go to new port
    console.log('\n1️⃣ Testing NEW PORT 5179...');
    await page.goto('http://localhost:5179/login');
    await page.waitForLoadState('networkidle');
    
    // Login
    console.log('\n2️⃣ Logging in...');
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful');
    
    // Check token immediately after login
    const token = await page.evaluate(() => localStorage.getItem('jwt_token'));
    console.log('\n🔑 Token after login:', token ? 'PRESENT' : 'MISSING');
    
    if (token) {
      // Decode JWT payload
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('   Token claims:');
        console.log('     sub:', payload.sub || 'MISSING');
        console.log('     is_admin:', payload.is_admin || 'MISSING');
        console.log('     email:', payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 'MISSING');
      } catch (e) {
        console.log('   ❌ Could not decode token');
      }
    }

    // Navigate to admin
    console.log('\n3️⃣ Navigating to admin...');
    const userDropdown = await page.locator('text=/Hello.*/').first();
    await userDropdown.click();
    await page.waitForTimeout(500);
    
    const adminLink = await page.locator('text=Admin').first();
    await adminLink.click();
    await page.waitForURL('**/admin', { timeout: 5000 });
    
    // Click manage users
    console.log('\n4️⃣ Clicking Manage Users...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageUsersBtn = buttons.find(btn => btn.textContent?.includes('Manage Users'));
      if (manageUsersBtn) {
        manageUsersBtn.click();
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Check final results
    console.log('\n📊 NETWORK ANALYSIS:');
    const loginRequests = networkLogs.filter(log => log.url.includes('/auth/login'));
    const adminRequests = networkLogs.filter(log => log.url.includes('/admin/users'));
    
    console.log(`Login requests: ${loginRequests.length}`);
    if (loginRequests.length > 0) {
      console.log(`   Last login: ${loginRequests[loginRequests.length - 1].status}`);
    }
    
    console.log(`Admin users requests: ${adminRequests.length}`);
    if (adminRequests.length > 0) {
      console.log(`   Last admin request: ${adminRequests[adminRequests.length - 1].status}`);
    }
    
    // Show all network calls
    console.log('\n🌐 ALL API CALLS:');
    networkLogs.forEach((log, i) => {
      console.log(`   ${i+1}. ${log.method} ${log.status} - ${log.url}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n⏱️  Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();