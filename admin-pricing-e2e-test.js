const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 ADMIN PRICING MANAGEMENT E2E TEST');
    console.log('====================================');
    
    // Capture ALL console logs
    page.on('console', msg => {
      console.log(`📝 [${msg.type()}] ${msg.text()}`);
    });

    // Capture network errors
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`❌ Network error: ${response.status()} ${response.url()}`);
      }
    });

    // Step 1: Go to login page
    console.log('\n1️⃣ Loading login page...');
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');

    // Step 2: Login as admin user
    console.log('\n2️⃣ Logging in as admin...');
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in and redirected to dashboard');

    // Step 3: Navigate to admin page
    console.log('\n3️⃣ Navigating to admin page...');
    await page.click('button:has-text("Hello Denise")');
    
    // Wait for dropdown to appear and try multiple selectors
    await page.waitForTimeout(1000);
    
    // Look for admin link with multiple fallback selectors
    const adminSelectors = [
      'a[href="/admin"]',
      'a:has-text("Admin")',
      '[role="menuitem"]:has-text("Admin")',
      'text="Admin"'
    ];
    
    let adminLinkFound = false;
    for (const selector of adminSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        adminLinkFound = true;
        console.log(`✅ Found admin link with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Admin link not found with selector: ${selector}`);
      }
    }
    
    if (!adminLinkFound) {
      throw new Error('Could not find admin link with any selector');
    }
    
    await page.waitForURL('**/admin', { timeout: 5000 });
    console.log('✅ Successfully navigated to admin page');

    // Step 4: Click Manage Pricing button
    console.log('\n4️⃣ Clicking Manage Pricing button...');
    await page.waitForSelector('button:has-text("Manage Pricing")', { timeout: 5000 });
    await page.click('button:has-text("Manage Pricing")');
    await page.waitForURL('**/admin/pricing', { timeout: 5000 });
    console.log('✅ Successfully navigated to pricing management page');

    // Step 5: Wait for pricing data to load
    console.log('\n5️⃣ Waiting for pricing data to load...');
    
    // Wait for the page header
    await page.waitForSelector('h1:has-text("Pricing Management")', { timeout: 10000 });
    console.log('✅ Pricing Management header found');

    // Wait for packages section
    await page.waitForSelector('text="Service Packages"', { timeout: 10000 });
    console.log('✅ Service Packages section found');

    // Step 6: Count visa types and pricing rules
    console.log('\n6️⃣ Checking pricing data...');
    
    try {
      // Wait for visa type cards to load
      await page.waitForSelector('[class*="Card"]', { timeout: 10000 });
      
      const packageCount = await page.locator('text="Service Packages"').count();
      console.log(`📊 Found ${packageCount} Service Packages section(s)`);

      // Look for visa type headings (these contain visa codes and names)
      const visaTypeHeadings = await page.locator('h2, h3').filter({ hasText: /^[A-Z]{1,3}-[A-Z0-9]+ -/ }).count();
      console.log(`📊 Found ${visaTypeHeadings} visa type(s) with pricing rules`);

      // Look for Edit buttons (these indicate pricing rules are present)
      const editButtons = await page.locator('button:has-text("Edit")').count();
      console.log(`📊 Found ${editButtons} editable pricing rule(s)`);

      // Step 7: Test editing functionality
      if (editButtons > 0) {
        console.log('\n7️⃣ Testing edit functionality...');
        
        // Click the first Edit button
        await page.locator('button:has-text("Edit")').first().click();
        console.log('✅ Clicked first Edit button');
        
        // Check for Save and Cancel buttons
        await page.waitForSelector('button:has-text("Save")', { timeout: 5000 });
        await page.waitForSelector('button:has-text("Cancel")', { timeout: 5000 });
        console.log('✅ Edit mode activated - Save and Cancel buttons visible');
        
        // Cancel the edit
        await page.click('button:has-text("Cancel")');
        console.log('✅ Successfully canceled edit');
      }

      // Final validation
      if (packageCount > 0 && (visaTypeHeadings > 0 || editButtons > 0)) {
        console.log('\n🎉 SUCCESS: Admin Pricing Management is working correctly!');
        console.log(`   - Service Packages sections: ${packageCount}`);
        console.log(`   - Visa types with pricing: ${visaTypeHeadings}`);
        console.log(`   - Editable pricing rules: ${editButtons}`);
      } else {
        console.log('\n❌ FAILURE: Expected pricing data not found');
        console.log(`   - Service Packages sections: ${packageCount}`);
        console.log(`   - Visa types with pricing: ${visaTypeHeadings}`);
        console.log(`   - Editable pricing rules: ${editButtons}`);
      }

    } catch (error) {
      console.log('\n❌ FAILURE: Error loading pricing data');
      console.log('   Error:', error.message);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'pricing-error.png' });
      console.log('   Screenshot saved as pricing-error.png');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-failure.png' });
    console.log('Screenshot saved as test-failure.png');
  } finally {
    console.log('\n⏱️  Browser will stay open for 15 seconds for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
})();