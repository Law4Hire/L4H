/**
 * DEBUG AFTER PROFILE COMPLETION
 * Check what happens on interview page after completing profile
 */

const puppeteer = require('puppeteer');

async function debugAfterProfileCompletion() {
  console.log('🔍 DEBUG AFTER PROFILE COMPLETION');
  console.log('='.repeat(50));

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 500
    });

    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    console.log('🔑 Login as A-1 user');
    await page.goto('http://localhost:5179/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'A-1@testing.com');
    await page.type('input[type="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const afterLoginUrl = page.url();
    console.log(`📍 After login: ${afterLoginUrl}`);

    if (afterLoginUrl.includes('profile-completion')) {
      console.log('📝 Complete profile registration');

      await page.type('input[name="streetAddress"]', '123 Embassy Row');
      await page.type('input[name="city"]', 'Washington');
      await page.type('input[name="postalCode"]', '20037');
      await page.type('input[name="dateOfBirth"]', '1970-01-01');
      await page.select('select[name="maritalStatus"]', 'Married');

      // Fill countries
      const countryInputs = await page.$$('input[placeholder*="country"]');
      if (countryInputs.length > 0) {
        await countryInputs[0].click();
        await countryInputs[0].type('United States');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }

      const passportInputs = await page.$$('input[placeholder*="passport"]');
      if (passportInputs.length > 0) {
        await passportInputs[0].click();
        await passportInputs[0].type('France');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }

      // Submit profile
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(btn => btn.textContent.trim(), button);
        if (text === 'Complete Profile') {
          const isDisabled = await page.evaluate(btn => btn.disabled, button);
          console.log(`   Complete Profile button disabled: ${isDisabled}`);
          if (!isDisabled) {
            await button.click();
            console.log('   ✅ Profile submitted');
            break;
          } else {
            console.log('   ❌ Complete Profile button is disabled');
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Check current URL after profile completion
    const afterProfileUrl = page.url();
    console.log(`📍 After profile completion: ${afterProfileUrl}`);

    console.log('🎯 Navigate to interview page');
    await page.goto('http://localhost:5179/interview', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Detailed analysis of interview page
    const interviewAnalysis = await page.evaluate(() => {
      const main = document.querySelector('main');
      const header = document.querySelector('header');
      const body = document.body;

      return {
        url: window.location.href,
        mainExists: !!main,
        mainHTML: main ? main.innerHTML.substring(0, 1000) : 'No main element',
        mainTextContent: main ? main.textContent.substring(0, 500) : 'No main element',
        headerExists: !!header,
        totalSelects: document.querySelectorAll('select').length,
        mainSelects: main ? main.querySelectorAll('select').length : 0,
        headerSelects: header ? header.querySelectorAll('select').length : 0,
        allSelectsDetails: Array.from(document.querySelectorAll('select')).map((select, i) => ({
          index: i,
          inMain: main ? main.contains(select) : false,
          inHeader: header ? header.contains(select) : false,
          optionCount: select.options.length,
          firstOptions: Array.from(select.options).slice(0, 3).map(opt => opt.textContent.trim())
        })),
        bodyText: body.textContent.substring(0, 500),
        h1Text: document.querySelector('h1')?.textContent || 'No H1',
        h2Text: document.querySelector('h2')?.textContent || 'No H2',
        h3Text: document.querySelector('h3')?.textContent || 'No H3'
      };
    });

    console.log('📊 Interview Page Analysis:');
    console.log(`   URL: ${interviewAnalysis.url}`);
    console.log(`   Main exists: ${interviewAnalysis.mainExists}`);
    console.log(`   Total selects: ${interviewAnalysis.totalSelects}`);
    console.log(`   Main selects: ${interviewAnalysis.mainSelects}`);
    console.log(`   Header selects: ${interviewAnalysis.headerSelects}`);
    console.log(`   H1: ${interviewAnalysis.h1Text}`);
    console.log(`   H2: ${interviewAnalysis.h2Text}`);
    console.log(`   H3: ${interviewAnalysis.h3Text}`);

    console.log('\n📋 All selects details:');
    interviewAnalysis.allSelectsDetails.forEach(select => {
      const location = select.inMain ? 'MAIN' : select.inHeader ? 'HEADER' : 'OTHER';
      console.log(`   Select ${select.index + 1}: ${location} (${select.optionCount} options) - ${select.firstOptions.join(', ')}`);
    });

    console.log('\n📄 Main element content (first 500 chars):');
    console.log(interviewAnalysis.mainTextContent);

    console.log('\n📄 Body text (first 300 chars):');
    console.log(interviewAnalysis.bodyText.substring(0, 300));

    // Wait longer and try again
    console.log('\n⏱️ Waiting longer for content to load...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const secondAnalysis = await page.evaluate(() => {
      const main = document.querySelector('main');
      return {
        mainSelects: main ? main.querySelectorAll('select').length : 0,
        totalSelects: document.querySelectorAll('select').length,
        mainText: main ? main.textContent.substring(0, 300) : 'No main'
      };
    });

    console.log('📊 After waiting 10 more seconds:');
    console.log(`   Main selects: ${secondAnalysis.mainSelects}`);
    console.log(`   Total selects: ${secondAnalysis.totalSelects}`);
    console.log(`   Main text: ${secondAnalysis.mainText}`);

    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugAfterProfileCompletion().catch(console.error);