// Debug what's actually on the page
const { chromium } = require('playwright');

async function debugPageContent() {
  console.log('🔍 Debugging Page Content...\n');

  let browser;
  try {
    browser = await chromium.launch({ 
      headless: false, 
      slowMo: 1000
    });
    const page = await browser.newPage();

    // Navigate to L4H
    console.log('1️⃣ Navigating to http://localhost:5180');
    await page.goto('http://localhost:5180');
    await page.waitForTimeout(5000);

    // Capture page info
    console.log('URL:', page.url());
    console.log('Title:', await page.title());

    // Check all input elements
    const inputs = await page.locator('input').all();
    console.log('\n📝 Found', inputs.length, 'input elements:');
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      const id = await input.getAttribute('id');
      console.log(`Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}", id="${id}"`);
    }

    // Check all button elements  
    const buttons = await page.locator('button').all();
    console.log('\n🔘 Found', buttons.length, 'button elements:');
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      console.log(`Button ${i + 1}: text="${text?.trim()}", type="${type}"`);
    }

    // Check if we're on a landing page instead of login
    const bodyText = await page.textContent('body');
    console.log('\n📄 Page contains:');
    console.log('- "Login":', bodyText.includes('Login'));
    console.log('- "Sign in":', bodyText.includes('Sign in'));
    console.log('- "Email":', bodyText.includes('email') || bodyText.includes('Email'));
    console.log('- "Password":', bodyText.includes('password') || bodyText.includes('Password'));
    console.log('- "Dashboard":', bodyText.includes('Dashboard'));
    console.log('- "Welcome":', bodyText.includes('Welcome'));
    console.log('- "Get Started":', bodyText.includes('Get Started'));

    // Look for navigation or routing
    console.log('\n🗺️ Looking for navigation links...');
    const links = await page.locator('a').all();
    console.log('Found', links.length, 'links');
    for (let i = 0; i < Math.min(links.length, 5); i++) {
      const link = links[i];
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      console.log(`Link ${i + 1}: text="${text?.trim()}", href="${href}"`);
    }

    // Try to navigate to login page directly
    console.log('\n2️⃣ Trying direct navigation to /login');
    await page.goto('http://localhost:5180/login');
    await page.waitForTimeout(3000);
    
    const loginInputs = await page.locator('input').all();
    console.log('On /login page - Found', loginInputs.length, 'inputs');
    
    if (loginInputs.length > 0) {
      console.log('✅ Login page has inputs');
      
      // Try to login
      const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        console.log('3️⃣ Attempting login...');
        await emailInput.fill('dcann@cannlaw.com');
        await passwordInput.fill('SecureTest123!');
        
        const submitButton = await page.locator('button[type="submit"], button:has-text("Login")').first();
        await submitButton.click();
        await page.waitForTimeout(5000);
        
        console.log('After login URL:', page.url());
        
        if (page.url().includes('dashboard')) {
          console.log('✅ Successfully reached dashboard');
          
          // Now test the actual dashboard issues
          console.log('\n4️⃣ Testing Dashboard Issues...');
          
          // Check for Case Status error
          const pageContent = await page.textContent('body');
          if (pageContent.includes('Error')) {
            console.log('❌ CONFIRMED: Page contains "Error" text');
            
            // Find all elements containing "Error"
            const errorElements = await page.locator('*:has-text("Error")').all();
            console.log('Found', errorElements.length, 'elements with "Error"');
            for (let i = 0; i < Math.min(errorElements.length, 3); i++) {
              const text = await errorElements[i].textContent();
              console.log(`Error element ${i + 1}:`, text?.substring(0, 100));
            }
          } else {
            console.log('✅ No "Error" text found on dashboard');
          }
          
          // Check for working buttons
          const dashboardButtons = await page.locator('button').all();
          console.log('Dashboard has', dashboardButtons.length, 'buttons');
          
        } else {
          console.log('❌ Login did not reach dashboard');
          const errorContent = await page.textContent('body');
          console.log('Login result content:', errorContent.substring(0, 300));
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugPageContent().catch(console.error);