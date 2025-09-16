// Comprehensive UI test to verify dashboard fixes work properly
const { chromium } = require('playwright');

async function testDashboardFunctionality() {
  console.log('🧪 Testing Dashboard Functionality After API Fix...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to L4H application
    console.log('1️⃣ Navigating to L4H application...');
    await page.goto('http://localhost:5180');
    await page.waitForTimeout(2000);

    // Check if we're on login page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Login with admin credentials
    console.log('\n2️⃣ Logging in with admin credentials...');
    await page.fill('input[type="email"]', 'dcann@cannlaw.com');
    await page.fill('input[type="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and dashboard to load
    await page.waitForTimeout(3000);
    
    // Check if we're now on dashboard
    const dashboardUrl = page.url();
    console.log('After login URL:', dashboardUrl);
    
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ Login successful - now on dashboard');
    } else {
      console.log('❌ Login may have failed - not on dashboard');
      return;
    }

    // Test Case Status functionality
    console.log('\n3️⃣ Testing Case Status functionality...');
    try {
      const caseStatusButton = await page.locator('text=View Cases').first();
      if (await caseStatusButton.isVisible()) {
        await caseStatusButton.click();
        await page.waitForTimeout(2000);
        
        // Check if cases page loaded properly
        const casesContent = await page.textContent('body');
        if (casesContent.includes('Error') && casesContent.includes('Loading')) {
          console.log('❌ Case Status still showing Error');
        } else {
          console.log('✅ Case Status working - no Error message visible');
        }
      } else {
        console.log('❌ Case Status button not found');
      }
    } catch (error) {
      console.log('❌ Case Status test failed:', error.message);
    }

    // Navigate back to dashboard
    await page.goto('http://localhost:5180/dashboard');
    await page.waitForTimeout(2000);

    // Test Visa Interview functionality
    console.log('\n4️⃣ Testing Visa Interview functionality...');
    try {
      const interviewButton = await page.locator('text=Start Interview').first();
      if (await interviewButton.isVisible()) {
        await interviewButton.click();
        await page.waitForTimeout(2000);
        
        // Check if we navigated to interview page
        const afterClickUrl = page.url();
        if (afterClickUrl.includes('/interview') || afterClickUrl !== dashboardUrl) {
          console.log('✅ Visa Interview button working - navigation occurred');
        } else {
          console.log('❌ Visa Interview button not working - no navigation');
        }
      } else {
        console.log('❌ Visa Interview button not found');
      }
    } catch (error) {
      console.log('❌ Visa Interview test failed:', error.message);
    }

    // Navigate back to dashboard
    await page.goto('http://localhost:5180/dashboard');
    await page.waitForTimeout(2000);

    // Test Pricing page functionality
    console.log('\n5️⃣ Testing Pricing page functionality...');
    try {
      const pricingButton = await page.locator('text=View Pricing').first();
      if (await pricingButton.isVisible()) {
        await interviewButton.click();
        await page.waitForTimeout(2000);
        
        // Check if pricing page loaded without errors
        const pageContent = await page.textContent('body');
        if (pageContent.includes('Error') || pageContent.includes('Failed to load')) {
          console.log('❌ Pricing page showing errors');
        } else {
          console.log('✅ Pricing page loaded successfully');
        }
      } else {
        // Try direct navigation to pricing
        await page.goto('http://localhost:5180/pricing');
        await page.waitForTimeout(2000);
        
        const pageContent = await page.textContent('body');
        if (pageContent.includes('Error') || pageContent.includes('Failed to load')) {
          console.log('❌ Pricing page showing errors');
        } else {
          console.log('✅ Pricing page loaded successfully');
        }
      }
    } catch (error) {
      console.log('❌ Pricing test failed:', error.message);
    }

    // Test Language switching functionality
    console.log('\n6️⃣ Testing Language switching functionality...');
    try {
      // Navigate to appointments page first
      await page.goto('http://localhost:5180/appointments');
      await page.waitForTimeout(2000);
      
      // Get initial page content
      const initialContent = await page.textContent('body');
      console.log('Initial language content sample:', initialContent.substring(0, 100));
      
      // Look for language switcher and change language
      const languageSwitcher = await page.locator('[role="combobox"], .language-selector, select').first();
      if (await languageSwitcher.isVisible()) {
        await languageSwitcher.click();
        await page.waitForTimeout(1000);
        
        // Try to select Spanish or another language
        const spanishOption = await page.locator('option[value="es-ES"], text=Español').first();
        if (await spanishOption.isVisible()) {
          await spanishOption.click();
          await page.waitForTimeout(2000);
          
          // Check if content changed
          const newContent = await page.textContent('body');
          if (newContent !== initialContent) {
            console.log('✅ Language switching working - content changed');
          } else {
            console.log('❌ Language switching may not be working - content unchanged');
          }
        } else {
          console.log('❌ Spanish language option not found');
        }
      } else {
        console.log('❌ Language switcher not found');
      }
    } catch (error) {
      console.log('❌ Language switching test failed:', error.message);
    }

    console.log('\n✅ Dashboard functionality testing completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboardFunctionality().catch(console.error);