/**
 * Debug i18n runtime loading issues
 * Check what namespaces and translations are actually loaded
 */

const puppeteer = require('puppeteer');

console.log('🔍 DEBUG: i18n Runtime Loading Check');
console.log('='.repeat(60));

async function debugI18nRuntime() {
  let browser = null;
  let page = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 300
    });

    page = await browser.newPage();
    await page.setCacheEnabled(false);

    console.log('🔧 Step 1: Login and navigate to interview page');

    // Login
    await page.goto('http://localhost:5178/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'test.1758939643755@testing.com');
    await page.type('input[type="password"]', 'SecureTest123!');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Go to interview page
    await page.goto(`http://localhost:5178/interview?_=${Date.now()}`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Switch to French
    const languageSelect = await page.$('select');
    if (languageSelect) {
      await page.select('select', 'fr-FR');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('🔧 Step 2: Debug i18n state in browser');

    // Debug i18n state
    const debugInfo = await page.evaluate(() => {
      const debug = {
        i18nExists: typeof window.i18next !== 'undefined',
        currentLanguage: null,
        loadedNamespaces: [],
        interviewNamespaceExists: false,
        frenchInterviewResources: {},
        rawTranslationTest: {},
        namespaceTest: {}
      };

      if (window.i18next) {
        debug.currentLanguage = window.i18next.language;
        debug.loadedNamespaces = window.i18next.options?.ns || [];

        // Check if interview namespace exists
        debug.interviewNamespaceExists = window.i18next.hasResourceBundle('fr-FR', 'interview');

        // Get French interview resources if they exist
        if (debug.interviewNamespaceExists) {
          debug.frenchInterviewResources = window.i18next.getResourceBundle('fr-FR', 'interview') || {};
        }

        // Test specific translation calls
        debug.rawTranslationTest = {
          'interview.title': window.i18next.t('interview.title'),
          'interview:title': window.i18next.t('interview:title'),
          'title_from_interview_namespace': window.i18next.t('title', { ns: 'interview' })
        };

        // Test namespace resolution
        debug.namespaceTest = {
          'interview_with_fallback': window.i18next.t('interview.title', { defaultValue: 'FALLBACK' }),
          'interview_no_fallback': window.i18next.t('interview.title'),
          'interview_explicit_ns': window.i18next.t('title', { ns: 'interview' })
        };
      }

      return debug;
    });

    console.log('\n📊 I18N DEBUG RESULTS:');
    console.log('='.repeat(60));
    console.log(`i18n exists: ${debugInfo.i18nExists}`);
    console.log(`Current language: ${debugInfo.currentLanguage}`);
    console.log(`Loaded namespaces: [${debugInfo.loadedNamespaces.join(', ')}]`);
    console.log(`Interview namespace exists: ${debugInfo.interviewNamespaceExists}`);

    console.log('\n📦 FRENCH INTERVIEW RESOURCES:');
    console.log(JSON.stringify(debugInfo.frenchInterviewResources, null, 2));

    console.log('\n🧪 RAW TRANSLATION TESTS:');
    Object.entries(debugInfo.rawTranslationTest).forEach(([key, value]) => {
      console.log(`  ${key}: "${value}"`);
    });

    console.log('\n🔍 NAMESPACE TESTS:');
    Object.entries(debugInfo.namespaceTest).forEach(([key, value]) => {
      console.log(`  ${key}: "${value}"`);
    });

    // Take a screenshot for reference
    await page.screenshot({ path: 'debug-i18n-runtime.png' });

    return debugInfo;

  } catch (error) {
    console.error('❌ DEBUG FAILED:', error.message);
    return { error: error.message };
  } finally {
    if (browser) {
      console.log('\n⏱️ Keeping browser open for 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await browser.close();
    }
  }
}

// Run the debug
debugI18nRuntime().then(result => {
  console.log('\n🔍 DEBUG COMPLETE');
  if (result.error) {
    console.log('❌ Error occurred:', result.error);
  } else if (result.interviewNamespaceExists && Object.keys(result.frenchInterviewResources).length > 0) {
    console.log('✅ Interview namespace is loaded with French translations!');
    console.log('🔍 Issue might be with how useTranslation hook is resolving keys');
  } else {
    console.log('❌ Interview namespace is not properly loaded');
  }
}).catch(error => {
  console.error('💥 DEBUG ERROR:', error);
});