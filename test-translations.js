const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const errors = [];
  const warnings = [];
  const logs = [];

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push(text);
      console.log('❌ ERROR:', text);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log('⚠️  WARNING:', text);
    } else if (text.includes('i18n') || text.includes('translation') || text.includes('language') || text.includes('Failed loading')) {
      logs.push(text);
      console.log('📝 LOG:', text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('locale') || url.includes('.json')) {
      errors.push(`Request failed: ${url}`);
      console.log('❌ REQUEST FAILED:', url);
    }
  });

  // Capture successful requests
  page.on('response', response => {
    const url = response.url();
    if (url.includes('locale') || (url.includes('.json') && !url.includes('vite'))) {
      const status = response.status();
      if (status === 200) {
        console.log(`✅ LOADED: ${url}`);
      } else if (status === 404) {
        console.log(`❌ 404: ${url}`);
      } else {
        console.log(`⚠️  ${status}: ${url}`);
      }
    }
  });

  console.log('Navigating to http://localhost:5175/...');
  try {
    await page.goto('http://localhost:5175/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('\n✅ Page loaded');

    // Wait a bit for any async errors
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check what text is actually on the page
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== PAGE CONTENT (first 500 chars) ===');
    console.log(bodyText.substring(0, 500));

    // Check if any translation keys are visible (indicating missing translations)
    const hasTranslationKeys = bodyText.includes('common.') || bodyText.includes('errors.') || bodyText.includes('landing.');
    if (hasTranslationKeys) {
      console.log('\n⚠️  WARNING: Translation keys are visible on the page!');
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Relevant Logs: ${logs.length}`);

  } catch (error) {
    console.error('Failed to load page:', error.message);
  }

  await browser.close();
})();
