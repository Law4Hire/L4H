const { chromium } = require('playwright');

async function testDashboardFixes() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing Dashboard Fixes...\n');
    
    // Navigate to the application
    await page.goto('http://localhost:5180');
    await page.waitForTimeout(2000);
    
    // First register a new user
    console.log('1️⃣ Registering new user...');
    await page.click('button:has-text("Get Started")');
    await page.waitForSelector('input[name="email"]');
    
    const testEmail = `test${Date.now()}@example.com`;
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Should redirect to profile completion
    const currentUrl = page.url();
    if (currentUrl.includes('/profile-completion')) {
      console.log('✅ Registration flow redirects to profile completion');
    } else {
      console.log('❌ Registration flow NOT redirecting to profile completion');
    }
    
    // Complete profile
    await page.fill('input[name="phoneNumber"]', '+1234567890');
    await page.fill('input[name="streetAddress"]', '123 Test St');
    await page.fill('input[name="city"]', 'Test City');
    await page.fill('input[name="stateProvince"]', 'Test State');
    await page.fill('input[name="postalCode"]', '12345');
    await page.selectOption('select[name="country"]', 'US');
    await page.selectOption('select[name="nationality"]', 'US');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Should be on dashboard now
    const dashboardUrl = page.url();
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ Profile completion redirects to dashboard');
    } else {
      console.log('❌ Profile completion NOT redirecting to dashboard');
      console.log('Current URL:', dashboardUrl);
    }
    
    // Test Case Status
    console.log('\n2️⃣ Testing Case Status...');
    await page.waitForSelector('h2:has-text("Case Status")');
    
    const caseStatusText = await page.textContent('.case-status-content, [data-testid="case-status"], .space-y-4');
    console.log('Case Status Content:', caseStatusText);
    
    if (caseStatusText.includes('Error')) {
      console.log('❌ Case Status still shows Error');
    } else {
      console.log('✅ Case Status does NOT show Error');
    }
    
    // Test Visa Interview
    console.log('\n3️⃣ Testing Visa Interview button...');
    const interviewButton = await page.$('button:has-text("Visa Interview")');
    if (interviewButton) {
      console.log('Found interview button, clicking...');
      await interviewButton.click();
      await page.waitForTimeout(2000);
      
      const newUrl = page.url();
      console.log('URL after interview click:', newUrl);
      
      if (newUrl.includes('/interview')) {
        console.log('✅ Visa Interview button navigates to interview page');
      } else {
        console.log('❌ Visa Interview button does NOT navigate to interview page');
      }
    } else {
      console.log('❌ Visa Interview button not found');
    }
    
    // Go back to dashboard
    await page.goto('http://localhost:5180/dashboard');
    await page.waitForTimeout(2000);
    
    // Test Pricing page
    console.log('\n4️⃣ Testing Pricing page...');
    const pricingButton = await page.$('button:has-text("Pricing")');
    if (pricingButton) {
      await pricingButton.click();
      await page.waitForTimeout(2000);
      
      const pricingUrl = page.url();
      console.log('URL after pricing click:', pricingUrl);
      
      if (pricingUrl.includes('/pricing')) {
        // Check if page loads without error
        const errorText = await page.textContent('body');
        if (errorText.includes('Error') || errorText.includes('error')) {
          console.log('❌ Pricing page shows error');
        } else {
          console.log('✅ Pricing page loads without error');
        }
      } else {
        console.log('❌ Pricing button does NOT navigate to pricing page');
      }
    } else {
      console.log('❌ Pricing button not found');
    }
    
    // Test Appointments page
    console.log('\n5️⃣ Testing Appointments page and localization...');
    await page.goto('http://localhost:5180/appointments');
    await page.waitForTimeout(2000);
    
    const appointmentsPageText = await page.textContent('body');
    if (appointmentsPageText.includes('Appointments')) {
      console.log('✅ Appointments page shows English text');
    } else {
      console.log('❌ Appointments page missing English text');
    }
    
    // Test language switching
    console.log('Testing language switch to Spanish...');
    const languageButton = await page.$('[data-testid="language-switcher"], button:has-text("EN")');
    if (languageButton) {
      await languageButton.click();
      await page.waitForTimeout(500);
      
      const spanishOption = await page.$('button:has-text("Español"), [data-value="es-ES"]');
      if (spanishOption) {
        await spanishOption.click();
        await page.waitForTimeout(2000);
        
        const updatedPageText = await page.textContent('body');
        if (updatedPageText.includes('Citas')) {
          console.log('✅ Appointments page switches to Spanish');
        } else {
          console.log('❌ Appointments page does NOT switch to Spanish');
          console.log('Page text sample:', updatedPageText.substring(0, 200));
        }
      } else {
        console.log('❌ Spanish language option not found');
      }
    } else {
      console.log('❌ Language switcher not found');
    }
    
    // Test Messages page
    console.log('\n6️⃣ Testing Messages page...');
    await page.goto('http://localhost:5180/messages');
    await page.waitForTimeout(2000);
    
    const messagesPageText = await page.textContent('body');
    if (messagesPageText.includes('Messages') || messagesPageText.includes('Mensajes')) {
      console.log('✅ Messages page shows localized text');
    } else {
      console.log('❌ Messages page missing localized text');
    }
    
    console.log('\n🏁 Test Summary Complete');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

testDashboardFixes();