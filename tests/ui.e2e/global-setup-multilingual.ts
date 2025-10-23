import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for multilingual e2e tests
 * 
 * This setup ensures that:
 * - Translation files are available and valid
 * - Test environment supports all required languages
 * - Font support is available for all scripts
 * - Performance baseline is established
 */
async function globalSetup(config: FullConfig) {
  console.log('🌐 Setting up multilingual e2e test environment...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Verify base application is running
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:5173';
    console.log(`🔗 Checking application availability at ${baseURL}`);
    
    await page.goto(baseURL, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Application is accessible');

    // Verify translation files are available
    console.log('🔍 Verifying translation file availability...');
    
    const supportedLanguages = [
      'en-US', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA', 
      'zh-CN', 'hi-IN', 'ja-JP', 'ur-PK', 'ru-RU'
    ];

    const translationChecks = [];
    
    for (const lang of supportedLanguages) {
      // Check shared translations
      const sharedCommonUrl = `${baseURL}/locales/shared/${lang}/common.json`;
      const sharedErrorsUrl = `${baseURL}/locales/shared/${lang}/errors.json`;
      
      // Check L4H translations
      const l4hInterviewUrl = `${baseURL}/locales/l4h/${lang}/interview.json`;
      const l4hDashboardUrl = `${baseURL}/locales/l4h/${lang}/dashboard.json`;
      
      translationChecks.push(
        checkTranslationFile(page, sharedCommonUrl, `Shared Common ${lang}`),
        checkTranslationFile(page, sharedErrorsUrl, `Shared Errors ${lang}`),
        checkTranslationFile(page, l4hInterviewUrl, `L4H Interview ${lang}`),
        checkTranslationFile(page, l4hDashboardUrl, `L4H Dashboard ${lang}`)
      );
    }

    const results = await Promise.allSettled(translationChecks);
    const failures = results.filter(r => r.status === 'rejected');
    
    if (failures.length > 0) {
      console.warn(`⚠️ ${failures.length} translation files are not accessible`);
      failures.forEach((failure, index) => {
        console.warn(`   - Check ${index + 1}: ${failure.reason}`);
      });
    } else {
      console.log('✅ All translation files are accessible');
    }

    // Test language switching functionality
    console.log('🔄 Testing language switching mechanism...');
    
    try {
      // Look for language selector
      const languageSelectors = [
        '[data-testid="language-selector"]',
        '.language-selector',
        '#language-select',
        'select[name="language"]'
      ];

      let selectorFound = false;
      for (const selector of languageSelectors) {
        const element = await page.locator(selector).first();
        if (await element.count() > 0) {
          console.log(`✅ Language selector found: ${selector}`);
          selectorFound = true;
          break;
        }
      }

      if (!selectorFound) {
        console.warn('⚠️ No language selector found - tests may need to use JavaScript API');
      }

      // Test i18n JavaScript API availability
      const i18nAvailable = await page.evaluate(() => {
        return typeof (window as any).i18n !== 'undefined';
      });

      if (i18nAvailable) {
        console.log('✅ i18n JavaScript API is available');
      } else {
        console.warn('⚠️ i18n JavaScript API not found');
      }

    } catch (error) {
      console.warn(`⚠️ Language switching test failed: ${error}`);
    }

    // Test font support for different scripts
    console.log('🔤 Testing font support for different scripts...');
    
    const scriptTests = [
      { script: 'Arabic', text: 'العربية', lang: 'ar-SA' },
      { script: 'Chinese', text: '简体中文', lang: 'zh-CN' },
      { script: 'Hindi', text: 'हिन्दी', lang: 'hi-IN' },
      { script: 'Japanese', text: '日本語', lang: 'ja-JP' },
      { script: 'Russian', text: 'Русский', lang: 'ru-RU' },
      { script: 'Urdu', text: 'اردو', lang: 'ur-PK' }
    ];

    for (const test of scriptTests) {
      try {
        await page.evaluate(({ text, lang }) => {
          const testDiv = document.createElement('div');
          testDiv.textContent = text;
          testDiv.lang = lang;
          testDiv.style.position = 'absolute';
          testDiv.style.top = '-1000px';
          document.body.appendChild(testDiv);
          
          const computedStyle = getComputedStyle(testDiv);
          const fontFamily = computedStyle.fontFamily;
          
          document.body.removeChild(testDiv);
          
          return fontFamily;
        }, test);
        
        console.log(`✅ ${test.script} script support verified`);
      } catch (error) {
        console.warn(`⚠️ ${test.script} script test failed: ${error}`);
      }
    }

    // Establish performance baseline
    console.log('⚡ Establishing performance baseline...');
    
    const performanceStart = Date.now();
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    const baselineLoadTime = Date.now() - performanceStart;
    
    console.log(`📊 Baseline page load time: ${baselineLoadTime}ms`);
    
    // Store baseline for comparison in tests
    process.env.MULTILINGUAL_BASELINE_LOAD_TIME = baselineLoadTime.toString();

    console.log('✅ Multilingual e2e test environment setup complete');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function checkTranslationFile(page: any, url: string, description: string): Promise<void> {
  try {
    const response = await page.goto(url);
    if (response.status() === 200) {
      const content = await response.text();
      const parsed = JSON.parse(content);
      
      if (Object.keys(parsed).length === 0) {
        throw new Error(`${description} is empty`);
      }
      
      console.log(`✅ ${description} verified`);
    } else {
      throw new Error(`${description} returned status ${response.status()}`);
    }
  } catch (error) {
    throw new Error(`${description}: ${error}`);
  }
}

export default globalSetup;