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
    } else {
      logs.push(text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    errors.push(`Request failed: ${request.url()}`);
    console.log('❌ REQUEST FAILED:', request.url());
  });

  console.log('Navigating to http://localhost:5175/...');
  try {
    await page.goto('http://localhost:5175/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('\n✅ Page loaded successfully');

    // Wait a bit for any async errors
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== SUMMARY ===');
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Logs: ${logs.length}`);

    if (errors.length > 0) {
      console.log('\n=== ALL ERRORS ===');
      errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }

    if (warnings.length > 0) {
      console.log('\n=== ALL WARNINGS ===');
      warnings.forEach((warn, i) => console.log(`${i + 1}. ${warn}`));
    }

  } catch (error) {
    console.error('Failed to load page:', error.message);
  }

  await browser.close();
})();
