/**
 * E2E UI Test: Complete User Registration and Profile Setup to Interview Stage
 *
 * Usage:
 * node e2e-user-creation-test.js --email=test@example.com --country="United States" --marital=single --dob="1990-01-15"
 *
 * Command Line Parameters:
 * --email: User's email address
 * --country: User's country name
 * --marital: Marital status (single, married, divorced, widowed)
 * --dob: Date of birth in YYYY-MM-DD format
 */

import puppeteer from 'puppeteer';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      params[key.substring(2)] = value;
    }
  });

  return params;
}

// Validate required parameters
function validateParams(params) {
  const required = ['email', 'country', 'marital', 'dob'];
  const missing = required.filter(param => !params[param]);

  if (missing.length > 0) {
    console.error('❌ Missing required parameters:', missing.join(', '));
    console.log('\n📋 Usage:');
    console.log('node e2e-user-creation-test.js --email=test@example.com --country="United States" --marital=single --dob="1990-01-15"');
    console.log('\n📝 Parameters:');
    console.log('  --email: User\'s email address');
    console.log('  --country: User\'s country name');
    console.log('  --marital: Marital status (single, married, divorced, widowed)');
    console.log('  --dob: Date of birth in YYYY-MM-DD format');
    process.exit(1);
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(params.dob)) {
    console.error('❌ Invalid date format. Use YYYY-MM-DD format for --dob');
    process.exit(1);
  }

  return params;
}

console.log('🚀 E2E USER CREATION TEST');
console.log('='.repeat(60));

async function runE2EUserCreationTest() {
  const params = validateParams(parseArgs());

  console.log('📋 Test Parameters:');
  console.log(`   Email: ${params.email}`);
  console.log(`   Country: ${params.country}`);
  console.log(`   Marital Status: ${params.marital}`);
  console.log(`   Date of Birth: ${params.dob}`);
  console.log('');

  let browser = null;
  let page = null;

  try {
    console.log('launching browser');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 300
    });

    page = await browser.newPage();
    await page.setCacheEnabled(false);

    console.log('🔧 Step 1: Navigate to registration page');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🔧 Step 2: Fill registration form');

    // Fill email
    await page.type('input[type="email"]', params.email);
    console.log(`   ✅ Email: ${params.email}`);

    // Fill password
    await page.type('input[type="password"]', 'SecureTest123!');
    console.log('   ✅ Password: SecureTest123!');

    // Find and fill confirm password field
    const passwordFields = await page.$$('input[type="password"]');
    if (passwordFields.length > 1) {
      await passwordFields[1].type('SecureTest123!');
      console.log('   ✅ Confirm Password: SecureTest123!');
    }

    // Submit registration
    await page.click('button[type="submit"]');
    console.log('   ✅ Registration form submitted');

    // Wait for navigation to profile completion page
    await new Promise(resolve => setTimeout(resolve, 4000));

    console.log('🔧 Step 3: Complete profile information');

    // Fill first name
    const firstNameField = await page.$('input[name="firstName"], input[placeholder*="First"], input[placeholder*="first"]');
    if (firstNameField) {
      await firstNameField.type('John');
      console.log('   ✅ First Name: John');
    }

    // Fill last name
    const lastNameField = await page.$('input[name="lastName"], input[placeholder*="Last"], input[placeholder*="last"]');
    if (lastNameField) {
      await lastNameField.type('Doe');
      console.log('   ✅ Last Name: Doe');
    }

    // Fill date of birth
    const dobField = await page.$('input[type="date"], input[name="dateOfBirth"], input[name="dob"]');
    if (dobField) {
      await dobField.type(params.dob);
      console.log(`   ✅ Date of Birth: ${params.dob}`);
    }

    // Select country
    const countrySelect = await page.$('select[name="country"], select[name="nationality"]');
    if (countrySelect) {
      const countryOptions = await page.$$eval('select[name="country"] option, select[name="nationality"] option', options =>
        options.map(option => ({ value: option.value, text: option.textContent.trim() }))
      );

      // Find matching country
      const matchingCountry = countryOptions.find(option =>
        option.text.toLowerCase().includes(params.country.toLowerCase()) ||
        option.value.toLowerCase().includes(params.country.toLowerCase())
      );

      if (matchingCountry) {
        await page.select('select[name="country"], select[name="nationality"]', matchingCountry.value);
        console.log(`   ✅ Country: ${params.country}`);
      } else {
        console.log(`   ⚠️ Country not found, using default`);
      }
    }

    // Select marital status
    const maritalSelect = await page.$('select[name="maritalStatus"], select[name="marital"]');
    if (maritalSelect) {
      const maritalOptions = await page.$$eval('select[name="maritalStatus"] option, select[name="marital"] option', options =>
        options.map(option => ({ value: option.value, text: option.textContent.trim() }))
      );

      // Find matching marital status
      const matchingMarital = maritalOptions.find(option =>
        option.text.toLowerCase().includes(params.marital.toLowerCase()) ||
        option.value.toLowerCase().includes(params.marital.toLowerCase())
      );

      if (matchingMarital) {
        await page.select('select[name="maritalStatus"], select[name="marital"]', matchingMarital.value);
        console.log(`   ✅ Marital Status: ${params.marital}`);
      } else {
        console.log(`   ⚠️ Marital status not found, using default`);
      }
    }

    // Fill phone number
    const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="Phone"]');
    if (phoneField) {
      await phoneField.type('+1-555-123-4567');
      console.log('   ✅ Phone: +1-555-123-4567');
    }

    // Fill address fields if present
    const addressField = await page.$('input[name="address"], input[placeholder*="Address"]');
    if (addressField) {
      await addressField.type('123 Main Street');
      console.log('   ✅ Address: 123 Main Street');
    }

    const cityField = await page.$('input[name="city"], input[placeholder*="City"]');
    if (cityField) {
      await cityField.type('New York');
      console.log('   ✅ City: New York');
    }

    const zipField = await page.$('input[name="zip"], input[name="zipCode"], input[name="postalCode"]');
    if (zipField) {
      await zipField.type('10001');
      console.log('   ✅ ZIP Code: 10001');
    }

    console.log('🔧 Step 4: Submit profile completion form');

    // Find and click submit/continue button
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      console.log('   ✅ Profile form submitted');
    } else {
      // Alternative: look for buttons with common submit text
      const buttonTexts = ['Continue', 'Submit', 'Complete', 'Next'];
      let buttonFound = false;

      for (const text of buttonTexts) {
        const button = await page.evaluateHandle((buttonText) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(btn => btn.textContent.trim().toLowerCase().includes(buttonText.toLowerCase()));
        }, text);

        if (button.asElement()) {
          await button.asElement().click();
          console.log(`   ✅ Profile form submitted (${text} button)`);
          buttonFound = true;
          break;
        }
      }

      if (!buttonFound) {
        // Fallback: try the last button
        const allButtons = await page.$$('button');
        if (allButtons.length > 0) {
          await allButtons[allButtons.length - 1].click();
          console.log('   ✅ Form submitted (fallback button)');
        }
      }
    }

    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔧 Step 5: Navigate to interview stage');

    // Check if we're on dashboard, if so navigate to interview
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes('dashboard')) {
      console.log('   📍 On dashboard, navigating to interview...');

      // Look for interview link or button
      const interviewLink = await page.$('a[href*="interview"]');
      if (interviewLink) {
        await interviewLink.click();
        console.log('   ✅ Clicked interview link');
      } else {
        // Look for button with "Interview" text
        const interviewButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          return buttons.find(btn => btn.textContent.trim().toLowerCase().includes('interview'));
        });

        if (interviewButton.asElement()) {
          await interviewButton.asElement().click();
          console.log('   ✅ Clicked interview button');
        } else {
          // Navigate directly to interview page
          await page.goto('http://localhost:5173/interview', { waitUntil: 'networkidle0' });
          console.log('   ✅ Navigated directly to interview');
        }
      }
    } else if (currentUrl.includes('interview')) {
      console.log('   ✅ Already on interview page');
    } else {
      console.log('   📍 Navigating to interview page...');
      await page.goto('http://localhost:5173/interview', { waitUntil: 'networkidle0' });
    }

    // Wait for interview page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔧 Step 6: Verify interview stage reached');

    // Check for interview page elements
    const interviewElements = await page.evaluate(() => {
      const hasTitle = document.querySelector('h1, h2, h3, [data-testid*="interview"]');
      const hasQuestion = document.querySelector('[data-testid*="question"], .question');
      const hasProgressIndicator = document.querySelector('[data-testid="interview-progress"]');
      const buttons = Array.from(document.querySelectorAll('button'));
      const hasNextButton = buttons.some(btn =>
        btn.textContent.trim().toLowerCase().includes('next') ||
        btn.textContent.trim().toLowerCase().includes('question')
      );

      return {
        title: hasTitle ? hasTitle.textContent.trim() : null,
        hasQuestion: !!hasQuestion,
        hasProgress: !!hasProgressIndicator,
        hasNextButton: hasNextButton,
        url: window.location.href
      };
    });

    console.log('📊 Interview Page Verification:');
    console.log(`   URL: ${interviewElements.url}`);
    console.log(`   Title: ${interviewElements.title || 'Not found'}`);
    console.log(`   Has Question: ${interviewElements.hasQuestion ? '✅' : '❌'}`);
    console.log(`   Has Progress: ${interviewElements.hasProgress ? '✅' : '❌'}`);
    console.log(`   Has Next Button: ${interviewElements.hasNextButton ? '✅' : '❌'}`);

    // Take final screenshot
    await page.screenshot({
      path: `e2e-user-creation-${params.email.replace('@', '-').replace('.', '-')}-final.png`,
      fullPage: true
    });

    const isSuccess = interviewElements.url.includes('interview') &&
                     (interviewElements.hasQuestion || interviewElements.hasProgress);

    console.log('\n' + '='.repeat(60));
    if (isSuccess) {
      console.log('🎉 SUCCESS: User creation and setup complete!');
      console.log('✅ User has been created and reached the interview stage');
      console.log(`📧 Email: ${params.email}`);
      console.log(`🔑 Password: SecureTest123!`);
    } else {
      console.log('⚠️ PARTIAL SUCCESS: User created but may not have reached interview stage');
      console.log('Check the screenshot and URL for current state');
    }
    console.log('='.repeat(60));

    return {
      success: isSuccess,
      email: params.email,
      finalUrl: interviewElements.url,
      screenshot: `e2e-user-creation-${params.email.replace('@', '-').replace('.', '-')}-final.png`
    };

  } catch (error) {
    console.error('❌ E2E TEST FAILED:', error.message);

    if (page) {
      await page.screenshot({
        path: `e2e-user-creation-error-${Date.now()}.png`,
        fullPage: true
      });
      console.log('📸 Error screenshot saved');
    }

    return { success: false, error: error.message };
  } finally {
    if (browser) {
      console.log('\n⏱️ Keeping browser open for 10 seconds for verification...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await browser.close();
    }
  }
}

const result = await runE2EUserCreationTest();
if (result.success) {
  console.log('\n🌟 E2E USER CREATION TEST COMPLETED SUCCESSFULLY! ✅');
  process.exit(0);
} else {
  console.log('\n💥 E2E USER CREATION TEST FAILED! ❌');
  process.exit(1);
}