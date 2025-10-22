const puppeteer = require('puppeteer');

async function testThreeLanguages() {
  console.log('🔍 Testing Visa Library console logs for specific languages\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    const testLanguages = [
      { code: 'en-US', name: 'English (initial load)' },
      { code: 'ar-SA', name: 'Arabic' },
      { code: 'bn-BD', name: 'Bengali' }
    ];

    for (const lang of testLanguages) {
      console.log('\n' + '='.repeat(80));
      console.log(`Testing: ${lang.name} (${lang.code})`);
      console.log('='.repeat(80));

      const errors = [];
      const warnings = [];
      const logs = [];

      // Capture console messages
      const consoleListener = msg => {
        const type = msg.type();
        const text = msg.text();

        if (type === 'error') {
          errors.push(text);
          console.log(`  ❌ ERROR: ${text}`);
        } else if (type === 'warning') {
          warnings.push(text);
          console.log(`  ⚠️  WARNING: ${text}`);
        } else if (type === 'log' && (
          text.includes('error') ||
          text.includes('Error') ||
          text.includes('failed') ||
          text.includes('Failed') ||
          text.includes('rejecting')
        )) {
          logs.push(text);
          console.log(`  📝 LOG: ${text}`);
        }
      };

      page.on('console', consoleListener);

      if (lang.code === 'en-US') {
        // Initial load
        console.log('  📍 Loading http://localhost:5173/visa-library...\n');
        await page.goto('http://localhost:5173/visa-library', {
          waitUntil: 'networkidle0',
          timeout: 30000
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        // Switch language
        console.log(`  🔄 Switching to ${lang.name}...\n`);
        await page.select('select', lang.code);
        await new Promise(resolve => setTimeout(resolve, 4000));
      }

      page.off('console', consoleListener);

      // Summary for this language
      console.log(`\n  📊 Summary for ${lang.name}:`);
      console.log(`     Errors: ${errors.length}`);
      console.log(`     Warnings: ${warnings.length}`);
      console.log(`     Relevant Logs: ${logs.length}`);

      if (errors.length > 0) {
        console.log(`\n  🔍 Error Details:`);
        errors.forEach((err, i) => {
          console.log(`     ${i + 1}. ${err.substring(0, 120)}`);
        });
      }

      if (warnings.length > 0) {
        console.log(`\n  🔍 Warning Details:`);
        warnings.forEach((warn, i) => {
          console.log(`     ${i + 1}. ${warn.substring(0, 120)}`);
        });
      }

      if (logs.length > 0) {
        console.log(`\n  🔍 Relevant Log Details:`);
        logs.forEach((log, i) => {
          console.log(`     ${i + 1}. ${log.substring(0, 120)}`);
        });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Testing Complete');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testThreeLanguages().catch(console.error);
