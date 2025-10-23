const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing language switching performance...\n');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  let retryCount = 0;
  let errorCount = 0;
  let failedRequests = [];

  // Count retries and errors
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Retry') || text.includes('retry')) {
      retryCount++;
    }
    if (msg.type() === 'error') {
      errorCount++;
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('.json')) {
      failedRequests.push(url);
    }
  });

  console.log('1. Loading page...');
  await page.goto('http://localhost:5175/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`   ✅ Page loaded (Retries: ${retryCount}, Errors: ${errorCount})\n`);

  // Test language switches
  const languages = ['es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ar-SA'];

  for (const lang of languages) {
    retryCount = 0;
    errorCount = 0;
    failedRequests = [];

    console.log(`2. Switching to ${lang}...`);
    const startTime = Date.now();

    await page.select('select', lang);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for language to load

    const duration = Date.now() - startTime;

    if (failedRequests.length > 0) {
      console.log(`   ❌ Failed (${duration}ms) - ${failedRequests.length} failed requests`);
      failedRequests.forEach(url => console.log(`      - ${url}`));
    } else if (retryCount > 0) {
      console.log(`   ⚠️  Success (${duration}ms) but with ${retryCount} retries`);
    } else if (duration > 3000) {
      console.log(`   ⚠️  Success (${duration}ms) but slower than expected`);
    } else {
      console.log(`   ✅ Success (${duration}ms, Retries: ${retryCount}, Errors: ${errorCount})`);
    }
  }

  console.log('\n=== Test Complete ===');
  await browser.close();
})();
