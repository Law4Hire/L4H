// Comprehensive test to verify all dashboard fixes are working
const { chromium } = require('playwright');

async function testAllFixes() {
  console.log('🎯 Testing All Dashboard Fixes...\n');

  let browser;
  try {
    browser = await chromium.launch({ 
      headless: false, 
      slowMo: 1000
    });
    const page = await browser.newPage();

    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:5181/login');
    await page.waitForTimeout(3000);
    
    await page.fill('input[type="email"]', 'dcann@cannlaw.com');
    await page.fill('input[type="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    if (!page.url().includes('dashboard')) {
      console.log('❌ Login failed - could not reach dashboard');
      return;
    }
    console.log('✅ Login successful - reached dashboard\n');

    // Test Fix 1: Case Status should not show "Error"
    console.log('2️⃣ Testing Case Status (JWT token fix)...');
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    const caseStatusSection = await page.locator('*:has-text("Case Status")').first();
    if (await caseStatusSection.isVisible()) {
      const caseStatusContent = await caseStatusSection.textContent();
      
      if (caseStatusContent.includes('Error') && !caseStatusContent.includes('react-refresh')) {
        console.log('❌ FAILED: Case Status still shows Error');
        console.log('Content:', caseStatusContent.substring(0, 200));
      } else if (caseStatusContent.includes('No cases found') || caseStatusContent.includes('Case #')) {
        console.log('✅ PASSED: Case Status shows proper content (no error)');
      } else {
        console.log('⚠️  UNCLEAR: Case Status content:', caseStatusContent.substring(0, 100));
      }
    } else {
      console.log('❌ Could not find Case Status section');
    }

    // Test Fix 2: Interview button should navigate
    console.log('\n3️⃣ Testing Interview button navigation...');
    
    const interviewButtons = await page.locator('button:has-text("Interview"), *:has-text("🎤")').all();
    console.log('Found', interviewButtons.length, 'interview buttons');
    
    if (interviewButtons.length > 0) {
      const beforeUrl = page.url();
      console.log('Clicking interview button...');
      
      try {
        // Click the interview button
        await interviewButtons[0].click();
        await page.waitForTimeout(5000);
        
        const afterUrl = page.url();
        
        if (afterUrl !== beforeUrl) {
          if (afterUrl.includes('interview')) {
            console.log('✅ PASSED: Interview button navigated to interview page');
          } else {
            console.log('✅ PASSED: Interview button navigated somewhere:', afterUrl);
          }
        } else {
          // Check if an error toast appeared instead
          const toastElements = await page.locator('.toast, [role="alert"], *:has-text("You need to create a case")').all();
          if (toastElements.length > 0) {
            const toastText = await toastElements[0].textContent();
            if (toastText.includes('create a case')) {
              console.log('✅ PASSED: Interview button works - shows expected "create a case" message');
            } else {
              console.log('⚠️  Interview button shows message:', toastText);
            }
          } else {
            console.log('❌ FAILED: Interview button does not navigate or show message');
          }
        }
      } catch (error) {
        console.log('❌ FAILED: Interview button click failed:', error.message);
      }
    } else {
      console.log('❌ No interview buttons found');
    }

    // Test Fix 3: Language switching
    console.log('\n4️⃣ Testing Language switching...');
    
    // Navigate back to dashboard if we left
    if (!page.url().includes('dashboard')) {
      await page.goto('http://localhost:5181/dashboard');
      await page.waitForTimeout(3000);
    }
    
    // Get current page content
    const beforeContent = await page.textContent('main, body');
    console.log('Page content before language change (first 50 chars):', beforeContent?.substring(0, 50));
    
    // Look for language selector
    const languageSelectors = await page.locator('select, .language-selector').all();
    console.log('Found', languageSelectors.length, 'potential language selectors');
    
    if (languageSelectors.length > 0) {
      try {
        // Try to change language
        const selector = languageSelectors[0];
        const currentValue = await selector.inputValue();
        console.log('Current language value:', currentValue);
        
        // Get all options
        const options = await page.locator('option').all();
        console.log('Found', options.length, 'language options');
        
        // Find a different option
        let targetOption = null;
        for (const option of options) {
          const value = await option.getAttribute('value');
          if (value && value !== currentValue) {
            targetOption = value;
            break;
          }
        }
        
        if (targetOption) {
          console.log('Switching to language:', targetOption);
          await selector.selectOption(targetOption);
          await page.waitForTimeout(3000);
          
          const afterContent = await page.textContent('main, body');
          
          if (beforeContent !== afterContent) {
            console.log('✅ PASSED: Language switching changed page content');
          } else {
            console.log('❌ FAILED: Language switching did not change page content');
          }
        } else {
          console.log('⚠️  Could not find alternative language option');
        }
      } catch (error) {
        console.log('❌ Error testing language switching:', error.message);
      }
    } else {
      console.log('❌ No language selectors found');
    }

    console.log('\n🎯 TESTING SUMMARY:');
    console.log('   1. JWT Token Fix (Case Status): Check results above');
    console.log('   2. Interview Button Navigation: Check results above'); 
    console.log('   3. Language Switching: Check results above');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testAllFixes().catch(console.error);