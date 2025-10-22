const puppeteer = require('puppeteer');

async function testAllConsoleErrors() {
  console.log('🔍 Comprehensive Console Error Testing\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    const testLanguages = [
      { code: 'en-US', name: 'English' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ar-SA', name: 'Arabic' },
      { code: 'bn-BD', name: 'Bengali' },
      { code: 'zh-CN', name: 'Chinese' }
    ];

    let totalErrors = 0;
    let totalWarnings = 0;

    for (const lang of testLanguages) {
      console.log('\n' + '='.repeat(80));
      console.log(`Testing: ${lang.name} (${lang.code})`);
      console.log('='.repeat(80));

      const errors = [];
      const warnings = [];
      const specificIssues = {
        i18nUndefined: [],
        btoaErrors: [],
        routerWarnings: [],
        languageCodeWarnings: []
      };

      // Capture console messages
      const consoleListener = msg => {
        const type = msg.type();
        const text = msg.text();

        // Check for specific issues we fixed
        if (text.includes('i18n.languages were undefined')) {
          specificIssues.i18nUndefined.push(text);
        }
        if (text.includes('btoa') && text.includes('Latin1')) {
          specificIssues.btoaErrors.push(text);
        }
        if (text.includes('React Router Future Flag')) {
          specificIssues.routerWarnings.push(text);
        }
        if (text.includes('rejecting language code')) {
          specificIssues.languageCodeWarnings.push(text);
        }

        if (type === 'error') {
          errors.push(text);
          console.log(`  ❌ ERROR: ${text.substring(0, 100)}`);
        } else if (type === 'warning') {
          warnings.push(text);
          console.log(`  ⚠️  WARNING: ${text.substring(0, 100)}`);
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
      console.log(`     Total Errors: ${errors.length}`);
      console.log(`     Total Warnings: ${warnings.length}`);
      console.log(`     i18n.languages undefined: ${specificIssues.i18nUndefined.length}`);
      console.log(`     btoa compression errors: ${specificIssues.btoaErrors.length}`);
      console.log(`     React Router warnings: ${specificIssues.routerWarnings.length}`);
      console.log(`     Language code warnings: ${specificIssues.languageCodeWarnings.length}`);

      totalErrors += errors.length;
      totalWarnings += warnings.length;

      // Report specific issues
      if (specificIssues.i18nUndefined.length > 0) {
        console.log(`\n  🔍 i18n.languages undefined issues:`);
        specificIssues.i18nUndefined.forEach(err => console.log(`     - ${err}`));
      }
      if (specificIssues.btoaErrors.length > 0) {
        console.log(`\n  🔍 btoa compression errors:`);
        specificIssues.btoaErrors.forEach(err => console.log(`     - ${err}`));
      }
      if (specificIssues.routerWarnings.length > 0) {
        console.log(`\n  🔍 React Router warnings:`);
        specificIssues.routerWarnings.forEach(warn => console.log(`     - ${warn}`));
      }
      if (specificIssues.languageCodeWarnings.length > 0) {
        console.log(`\n  🔍 Language code warnings:`);
        specificIssues.languageCodeWarnings.forEach(warn => console.log(`     - ${warn}`));
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📈 FINAL RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Errors Across All Languages: ${totalErrors}`);
    console.log(`Total Warnings Across All Languages: ${totalWarnings}`);

    if (totalErrors === 0 && totalWarnings === 0) {
      console.log('\n✅ SUCCESS! ZERO errors and ZERO warnings across all tested languages!');
    } else {
      console.log('\n❌ FAILURE! There are still errors or warnings that need to be fixed.');
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAllConsoleErrors().catch(console.error);
