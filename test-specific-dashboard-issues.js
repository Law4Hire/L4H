// Test the specific dashboard issues mentioned by the user
const { chromium } = require('playwright');

async function testSpecificDashboardIssues() {
  console.log('🎯 Testing Specific Dashboard Issues...\n');

  let browser;
  try {
    browser = await chromium.launch({ 
      headless: false, 
      slowMo: 500
    });
    const page = await browser.newPage();

    // Login first
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:5180/login');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'dcann@cannlaw.com');
    await page.fill('input[type="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    if (page.url().includes('dashboard')) {
      console.log('✅ Successfully logged in to dashboard\n');

      // Test Issue 1: Case Status showing "Error"
      console.log('2️⃣ Testing Case Status (reported as showing "Error")...');
      
      // Look for case-related sections
      const casesSections = await page.locator('[data-testid*="case"], .case, *:has-text("Case Status"), *:has-text("My Cases"), *:has-text("Cases")').all();
      console.log('Found', casesSections.length, 'case-related sections');
      
      for (let i = 0; i < casesSections.length; i++) {
        const text = await casesSections[i].textContent();
        console.log(`Case section ${i + 1}:`, text?.substring(0, 150));
        
        if (text?.includes('Error') && !text.includes('react-refresh')) {
          console.log('❌ CONFIRMED: Case Status shows Error');
        }
      }

      // Test Issue 2: Visa Interview button not working
      console.log('\n3️⃣ Testing Visa Interview button (reported as not working)...');
      
      const interviewButtons = await page.locator('button:has-text("Interview"), button:has-text("Visa Interview"), a:has-text("Interview"), *[role="button"]:has-text("Interview")').all();
      console.log('Found', interviewButtons.length, 'interview-related buttons/links');
      
      if (interviewButtons.length > 0) {
        const beforeUrl = page.url();
        console.log('Clicking interview button...');
        
        try {
          await interviewButtons[0].click();
          await page.waitForTimeout(3000);
          
          const afterUrl = page.url();
          if (beforeUrl !== afterUrl) {
            console.log('✅ Interview button works - navigated to:', afterUrl);
          } else {
            console.log('❌ CONFIRMED: Interview button does not navigate');
          }
        } catch (error) {
          console.log('❌ CONFIRMED: Interview button click failed:', error.message);
        }
      } else {
        console.log('❌ No interview buttons found at all');
      }

      // Test Issue 3: Pricing page errors
      console.log('\n4️⃣ Testing Pricing page (reported as having errors)...');
      
      await page.goto('http://localhost:5180/pricing');
      await page.waitForTimeout(3000);
      
      const pricingContent = await page.textContent('body');
      
      // Look for specific error indicators
      if (pricingContent.includes('Error loading') || 
          pricingContent.includes('Failed to fetch') || 
          pricingContent.includes('Something went wrong') ||
          pricingContent.includes('Network Error')) {
        console.log('❌ CONFIRMED: Pricing page shows errors');
        
        // Find error messages
        const errorElements = await page.locator('*:has-text("Error"), *:has-text("Failed"), .error').all();
        for (let i = 0; i < Math.min(errorElements.length, 3); i++) {
          const text = await errorElements[i].textContent();
          if (text && !text.includes('react-refresh') && text.length < 200) {
            console.log(`Error message ${i + 1}:`, text);
          }
        }
      } else if (pricingContent.includes('Loading')) {
        console.log('⚠️ Pricing page stuck on loading');
      } else {
        console.log('✅ Pricing page appears to load without obvious errors');
      }

      // Test Issue 4: Language switching (reported as only affecting navbar)
      console.log('\n5️⃣ Testing Language switching (reported as only affecting navbar)...');
      
      // Go to appointments page (mentioned by user)
      await page.goto('http://localhost:5180/appointments');
      await page.waitForTimeout(3000);
      
      const beforeContent = await page.textContent('main, .content, .page-content');
      console.log('Page content before language change (first 100 chars):', beforeContent?.substring(0, 100));
      
      // Look for language selector
      const languageSelectors = await page.locator('select[name*="language"], select[aria-label*="language"], .language-selector, [data-testid*="language"]').all();
      console.log('Found', languageSelectors.length, 'language selectors');
      
      if (languageSelectors.length > 0) {
        try {
          await languageSelectors[0].click();
          await page.waitForTimeout(1000);
          
          // Try to select a different language
          const options = await page.locator('option').all();
          if (options.length > 1) {
            await options[1].click();
            await page.waitForTimeout(3000);
            
            const afterContent = await page.textContent('main, .content, .page-content');
            
            if (beforeContent === afterContent) {
              console.log('❌ CONFIRMED: Language switching does not change page content');
            } else {
              console.log('✅ Language switching works - content changed');
            }
          }
        } catch (error) {
          console.log('Error testing language switching:', error.message);
        }
      } else {
        console.log('❌ No language selectors found');
      }

    } else {
      console.log('❌ Could not login to dashboard');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('\n🎯 DASHBOARD ISSUES TESTING COMPLETE');
  console.log('This test confirms which issues are still present after the API fixes.');
}

testSpecificDashboardIssues().catch(console.error);