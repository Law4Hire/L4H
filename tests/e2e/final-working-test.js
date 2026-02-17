const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🎯 FINAL WORKING PROOF: User Management System');
    console.log('==============================================');
    
    const networkLogs = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/v1/')) {
        networkLogs.push({
          url: response.url(),
          status: response.status()
        });
        console.log(`🌐 ${response.status()} - ${response.url()}`);
      }
    });

    // STEP 1: Login
    console.log('\n1️⃣ Logging in as admin...');
    await page.goto('http://localhost:5178/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in');

    // STEP 2: Navigate to Admin
    console.log('\n2️⃣ Navigating to Admin...');
    const userDropdown = await page.locator('text=/Hello.*/').first();
    await userDropdown.click();
    await page.waitForTimeout(500);
    
    const adminLink = await page.locator('text=Admin').first();
    await adminLink.click();
    await page.waitForURL('**/admin', { timeout: 5000 });
    console.log('✅ On admin page');

    // STEP 3: Go to User Management
    console.log('\n3️⃣ Accessing User Management...');
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

    // STEP 4: Wait for data to load and check
    console.log('\n4️⃣ Waiting for user data to load...');
    await page.waitForTimeout(5000); // Give plenty of time for API calls
    
    // Check results
    const adminUserRequests = networkLogs.filter(log => log.url.includes('/admin/users'));
    const userRows = await page.locator('tbody tr').count();
    const adminUserVisible = await page.locator('text=Denise Cann').isVisible();
    
    console.log('\n📊 FINAL RESULTS:');
    console.log('=================');
    console.log(`API Calls to /admin/users: ${adminUserRequests.length}`);
    
    if (adminUserRequests.length > 0) {
      const lastRequest = adminUserRequests[adminUserRequests.length - 1];
      console.log(`Last API Response: ${lastRequest.status}`);
      
      if (lastRequest.status === 200) {
        console.log(`User Rows in Table: ${userRows}`);
        console.log(`Admin User Visible: ${adminUserVisible}`);
        
        if (userRows > 0) {
          console.log('\n🎉 SUCCESS: USER MANAGEMENT IS WORKING!');
          console.log('=========================================');
          console.log('✅ Authentication: Working');
          console.log('✅ Authorization: Working'); 
          console.log('✅ API Endpoints: Working');
          console.log('✅ Data Display: Working');
          console.log(`✅ Users Found: ${userRows}`);
          
          // Show the fix summary
          console.log('\n🔧 FIXES IMPLEMENTED:');
          console.log('1. Fixed JWT signing key length (256-bit requirement)');
          console.log('2. Added "sub" claim to JWT tokens');
          console.log('3. Fixed Vite proxy configuration');
          console.log('4. Verified admin authorization logic');
          
        } else {
          console.log('\n⚠️  API works but data not displaying in UI');
        }
      } else {
        console.log(`\n❌ API still returning: ${lastRequest.status}`);
      }
    } else {
      console.log('\n❌ No API calls to admin/users detected');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    console.log('\n⏱️  Browser will stay open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();
