const { chromium } = require('@playwright/test');

async function testProductionSite() {
  console.log('==========================================');
  console.log('Production Site Translation Test');
  console.log('==========================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });

    // Show translation-related errors immediately
    if (text.includes('translation') || text.includes('i18n') || text.includes('locales') ||
        text.includes('⚠️') || text.includes('❌') || text.includes('🚨')) {
      console.log(`[${msg.type().toUpperCase()}] ${text}`);
    }
  });

  const languages = [
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese' },
    { code: 'es-ES', name: 'Spanish' }
  ];

  for (const lang of languages) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${lang.name} (${lang.code})`);
    console.log('='.repeat(60));

    try {
      // Navigate to site with language parameter
      await page.goto(`https://l4h.74-208-77-43.nip.io/?lng=${lang.code}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait a bit for i18n to initialize
      await page.waitForTimeout(2000);

      // Check what's displayed
      const title = await page.textContent('h1').catch(() => 'NOT FOUND');
      const brandTitle = await page.locator('[class*="brand"]').first().textContent().catch(() => 'NOT FOUND');

      console.log(`\nTitle element: ${title}`);
      console.log(`Brand element: ${brandTitle}`);

      // Check for translation keys (indicates translation failure)
      const bodyText = await page.textContent('body');
      const hasTranslationKeys = bodyText.includes('landing.') || bodyText.includes('common.') ||
                                  bodyText.includes('brand.title') || bodyText.includes('brand.subtitle');

      if (hasTranslationKeys) {
        console.log('❌ TRANSLATION KEYS VISIBLE - translations not loading!');
        console.log('Sample text:', bodyText.substring(0, 200));
      } else {
        console.log('✓ No translation keys visible');
      }

      // Show recent console messages for this language
      const recentErrors = consoleMessages.slice(-10);
      if (recentErrors.length > 0) {
        console.log('\nRecent console output:');
        recentErrors.forEach(m => {
          if (m.text.includes('translation') || m.text.includes('Failed') || m.text.includes('404')) {
            console.log(`  [${m.type}] ${m.text}`);
          }
        });
      }

    } catch (error) {
      console.error(`\n❌ Error testing ${lang.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));

  await browser.close();
}

testProductionSite().catch(console.error);
