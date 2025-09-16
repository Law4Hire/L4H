// Actual UI test to verify dashboard functionality - no assumptions
const { chromium } = require('playwright');

async function testActualDashboard() {
  console.log('🧪 Testing ACTUAL Dashboard Functionality...\n');

  let browser;
  try {
    browser = await chromium.launch({ 
      headless: false, 
      slowMo: 500,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    const page = await browser.newPage();

    // Step 1: Navigate to the application
    console.log('1️⃣ Navigating to L4H application at http://localhost:5180');
    await page.goto('http://localhost:5180');
    await page.waitForTimeout(3000);
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());

    // Step 2: Check what's actually on the page
    const bodyText = await page.textContent('body');
    console.log('Page contains login form:', bodyText.includes('Login') || bodyText.includes('email') || bodyText.includes('password'));
    
    // Step 3: Try to login if login form is present
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      console.log('✅ Found login form');
      await emailInput.fill('dcann@cannlaw.com');
      await passwordInput.fill('SecureTest123!');
      await loginButton.click();
      
      console.log('Clicked login, waiting for response...');
      await page.waitForTimeout(5000);
      
      const newUrl = page.url();
      console.log('After login URL:', newUrl);
      
      if (newUrl.includes('dashboard')) {
        console.log('✅ Successfully logged in and redirected to dashboard');
      } else {
        console.log('❌ Login did not redirect to dashboard');
        const errorText = await page.textContent('body');
        console.log('Page content after login attempt:', errorText.substring(0, 200));
      }
    } else {
      console.log('❌ Could not find login form');
      console.log('Available inputs:', await page.locator('input').count());
      console.log('Available buttons:', await page.locator('button').count());
    }

    // Step 4: Test dashboard functionality if we're on dashboard
    if (page.url().includes('dashboard') || page.url().includes('admin')) {
      console.log('\n2️⃣ Testing Dashboard Features...');
      
      // Test Case Status
      console.log('Testing Case Status...');
      const caseElements = await page.locator('*:has-text("Case"), *:has-text("Status"), *:has-text("Error")').all();
      console.log('Found case-related elements:', caseElements.length);
      
      for (let i = 0; i < Math.min(3, caseElements.length); i++) {
        const text = await caseElements[i].textContent();
        console.log(`Case element ${i + 1}:`, text?.substring(0, 100));
        if (text?.includes('Error')) {
          console.log('❌ FOUND ERROR in case status');
        }
      }
      
      // Test Visa Interview button
      console.log('\nTesting Visa Interview button...');
      const interviewButtons = await page.locator('button:has-text("Interview"), button:has-text("Visa"), a:has-text("Interview")').all();
      console.log('Found interview-related buttons:', interviewButtons.length);
      
      if (interviewButtons.length > 0) {
        const beforeUrl = page.url();
        await interviewButtons[0].click();
        await page.waitForTimeout(2000);
        const afterUrl = page.url();
        
        if (beforeUrl !== afterUrl) {
          console.log('✅ Interview button caused navigation');
          console.log('Before:', beforeUrl);
          console.log('After:', afterUrl);
        } else {
          console.log('❌ Interview button did not cause navigation');
        }
      }
      
      // Test Pricing page
      console.log('\nTesting Pricing functionality...');
      await page.goto('http://localhost:5180/pricing');
      await page.waitForTimeout(3000);
      
      const pricingText = await page.textContent('body');
      if (pricingText.includes('Error') || pricingText.includes('Failed')) {
        console.log('❌ Pricing page shows errors');
        console.log('Error content:', pricingText.substring(0, 200));
      } else if (pricingText.includes('Loading')) {
        console.log('⚠️ Pricing page stuck on loading');
      } else {
        console.log('✅ Pricing page loaded');
      }
      
      // Test language switching
      console.log('\nTesting Language switching...');
      const languageSelectors = await page.locator('select, [role="combobox"], .language').all();
      console.log('Found language selectors:', languageSelectors.length);
      
      if (languageSelectors.length > 0) {
        const beforeContent = await page.textContent('body');
        await languageSelectors[0].click();
        await page.waitForTimeout(1000);
        
        // Try to find and click a different language option
        const options = await page.locator('option, [role="option"]').all();
        if (options.length > 1) {
          await options[1].click();
          await page.waitForTimeout(2000);
          
          const afterContent = await page.textContent('body');
          if (beforeContent !== afterContent) {
            console.log('✅ Language switching changed content');
          } else {
            console.log('❌ Language switching did not change content');
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testActualDashboard().catch(console.error);