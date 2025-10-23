const puppeteer = require('puppeteer');

async function checkConsoleErrors() {
  console.log('🔍 Checking console errors on Visa Library page...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });

      // Print errors and warnings immediately
      if (type === 'error') {
        console.log(`❌ ERROR: ${text}`);
      } else if (type === 'warning') {
        console.log(`⚠️  WARNING: ${text}`);
      } else if (type === 'log') {
        console.log(`📝 LOG: ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.log(`💥 PAGE ERROR: ${error.message}`);
    });

    // Navigate to Visa Library
    console.log('📍 Loading http://localhost:5173/visa-library...\n');

    await page.goto('http://localhost:5173/visa-library', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait a bit for any async operations
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Summary
    console.log('\n📊 Summary:');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
    console.log(`Warnings: ${consoleMessages.filter(m => m.type === 'warning').length}`);
    console.log(`Logs: ${consoleMessages.filter(m => m.type === 'log').length}`);

  } catch (error) {
    console.error('❌ Failed to check console:', error.message);
  } finally {
    await browser.close();
  }
}

checkConsoleErrors().catch(console.error);
