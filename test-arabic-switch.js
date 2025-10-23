const puppeteer = require('puppeteer');

async function testArabicSwitch() {
  console.log('🔍 Testing Arabic language switch...\n');

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

      // Print important messages
      if (type === 'error') {
        console.log(`❌ ERROR: ${text}`);
      } else if (type === 'warning') {
        console.log(`⚠️  WARNING: ${text}`);
      } else if (text.includes('ar') || text.includes('language')) {
        console.log(`📝 LOG: ${text}`);
      }
    });

    // Navigate to Visa Library
    console.log('📍 Loading http://localhost:5173/visa-library...\n');
    await page.goto('http://localhost:5173/visa-library', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('\n🔄 Switching to Arabic (ar-SA)...\n');

    // Find and click language selector
    await page.waitForSelector('select');
    await page.select('select', 'ar-SA');

    // Wait for language change
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Summary
    console.log('\n📊 Summary:');
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');

    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Error messages:');
      errors.slice(0, 10).forEach(e => console.log(`  - ${e.text}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warning messages:');
      warnings.slice(0, 10).forEach(w => console.log(`  - ${w.text}`));
    }

  } catch (error) {
    console.error('❌ Failed to test:', error.message);
  } finally {
    await browser.close();
  }
}

testArabicSwitch().catch(console.error);
