const puppeteer = require('puppeteer');

const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'bn-BD', name: 'Bengali' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'de-DE', name: 'German' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'id-ID', name: 'Indonesian' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'pl-PL', name: 'Polish' },
  { code: 'pt-BR', name: 'Portuguese' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'tr-TR', name: 'Turkish' },
  { code: 'ur-PK', name: 'Urdu' },
  { code: 'vi-VN', name: 'Vietnamese' },
  { code: 'tl-PH', name: 'Tagalog' }
];

async function testAllLanguages() {
  console.log('🔍 Comprehensive Language Testing for Visa Library\n');
  console.log('='.repeat(80));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    successful: [],
    errorsFound: [],
    warningsFound: []
  };

  try {
    const page = await browser.newPage();

    // Navigate to Visa Library
    console.log('\n📍 Loading http://localhost:5173/visa-library...\n');
    await page.goto('http://localhost:5173/visa-library', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test each language
    for (const lang of LANGUAGES) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Testing: ${lang.name} (${lang.code})`);
      console.log('='.repeat(80));

      const errors = [];
      const warnings = [];
      const logs = [];

      // Set up console listeners for this language
      const consoleListener = msg => {
        const type = msg.type();
        const text = msg.text();

        if (type === 'error' && !text.includes('favicon')) {
          errors.push(text);
          console.log(`  ❌ ERROR: ${text.substring(0, 100)}`);
        } else if (type === 'warning') {
          warnings.push(text);
          console.log(`  ⚠️  WARNING: ${text.substring(0, 100)}`);
        } else if (type === 'log' && (text.includes('error') || text.includes('failed') || text.includes('rejecting'))) {
          logs.push(text);
          console.log(`  📝 LOG: ${text.substring(0, 100)}`);
        }
      };

      page.on('console', consoleListener);

      try {
        // Switch language
        await page.select('select', lang.code);

        // Wait for language to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Remove listener
        page.off('console', consoleListener);

        // Summarize results for this language
        if (errors.length === 0 && warnings.length === 0) {
          console.log(`  ✅ ${lang.name}: Clean (0 errors, 0 warnings)`);
          results.successful.push(lang.code);
        } else {
          console.log(`  ⚠️  ${lang.name}: ${errors.length} errors, ${warnings.length} warnings`);
          if (errors.length > 0) {
            results.errorsFound.push({
              language: lang.code,
              name: lang.name,
              errors: errors.slice(0, 5),
              count: errors.length
            });
          }
          if (warnings.length > 0) {
            results.warningsFound.push({
              language: lang.code,
              name: lang.name,
              warnings: warnings.slice(0, 5),
              count: warnings.length
            });
          }
        }
      } catch (error) {
        console.log(`  💥 ${lang.name}: Failed to test - ${error.message}`);
        results.errorsFound.push({
          language: lang.code,
          name: lang.name,
          errors: [error.message],
          count: 1
        });
      }
    }

    // Final Summary
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Languages with clean console: ${results.successful.length}/${LANGUAGES.length}`);
    console.log(`❌ Languages with errors: ${results.errorsFound.length}`);
    console.log(`⚠️  Languages with warnings: ${results.warningsFound.length}`);

    if (results.successful.length > 0) {
      console.log('\n✅ Clean Languages:');
      results.successful.forEach(code => {
        const lang = LANGUAGES.find(l => l.code === code);
        console.log(`   - ${lang.name} (${code})`);
      });
    }

    if (results.errorsFound.length > 0) {
      console.log('\n❌ Languages with Errors:');
      results.errorsFound.forEach(item => {
        console.log(`\n   ${item.name} (${item.language}) - ${item.count} error(s):`);
        item.errors.forEach(err => {
          console.log(`      • ${err.substring(0, 120)}`);
        });
      });
    }

    if (results.warningsFound.length > 0) {
      console.log('\n⚠️  Languages with Warnings:');
      results.warningsFound.forEach(item => {
        console.log(`\n   ${item.name} (${item.language}) - ${item.count} warning(s):`);
        item.warnings.forEach(warn => {
          console.log(`      • ${warn.substring(0, 120)}`);
        });
      });
    }

    // Save detailed report
    const fs = require('fs');
    fs.writeFileSync(
      'language-test-report.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n💾 Detailed report saved to: language-test-report.json');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAllLanguages().catch(console.error);
