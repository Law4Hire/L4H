const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: false, // Show browser so we can see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const errors = [];
  const warnings = [];
  const retryMessages = [];

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
    } else if (text.includes('Retry') || text.includes('retry') || text.includes('failed') || text.includes('Failed')) {
      retryMessages.push(text);
      console.log('🔄 RETRY:', text);
    } else if (text.includes('language') || text.includes('translation')) {
      console.log('📝 LOG:', text);
    }
  });

  // Capture request failures
  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('locale') || url.includes('.json')) {
      console.log('❌ REQUEST FAILED:', url);
      console.log('   Failure:', request.failure().errorText);
    }
  });

  // Track 404s
  page.on('response', response => {
    const url = response.url();
    if (url.includes('locale') || (url.includes('.json') && !url.includes('vite'))) {
      const status = response.status();
      if (status === 404) {
        console.log(`❌ 404: ${url}`);
      } else if (status !== 200 && status !== 304) {
        console.log(`⚠️  ${status}: ${url}`);
      }
    }
  });

  console.log('Navigating to http://localhost:5175/...');
  await page.goto('http://localhost:5175/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  console.log('\n✅ Page loaded, waiting 3 seconds for initial load...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n=== INITIAL LOAD SUMMARY ===');
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Retry Messages: ${retryMessages.length}`);

  if (retryMessages.length > 0) {
    console.log('\n=== RETRY MESSAGES ===');
    retryMessages.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
  }

  console.log('\n=== Now going to switch language to Spanish (es-ES) ===\n');

  // Clear the arrays
  errors.length = 0;
  warnings.length = 0;
  retryMessages.length = 0;

  // Find and click the language selector
  try {
    await page.select('select', 'es-ES');
    console.log('Selected Spanish language, waiting 15 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log('\n=== LANGUAGE SWITCH SUMMARY ===');
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Retry Messages: ${retryMessages.length}`);

    if (retryMessages.length > 0) {
      console.log('\n=== RETRY MESSAGES ===');
      retryMessages.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
    }

  } catch (error) {
    console.error('Failed to switch language:', error.message);
  }

  console.log('\n=== Keeping browser open for 30 seconds for manual inspection ===');
  await new Promise(resolve => setTimeout(resolve, 30000));

  await browser.close();
})();
