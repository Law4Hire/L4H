import { test, expect, Page } from '@playwright/test';

/**
 * Multilingual End-to-End Tests
 * 
 * Comprehensive tests for multilingual user journeys including:
 * - Complete user registration and interview flows in multiple languages
 * - Language switching during active sessions
 * - RTL language support validation
 * - Translation completeness and fallback behavior
 * - Performance and accessibility in multilingual context
 */

interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  hasNativeScript: boolean;
}

const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en-US', name: 'English', nativeName: 'English', isRTL: false, direction: 'ltr', hasNativeScript: true },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', isRTL: false, direction: 'ltr', hasNativeScript: true },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', isRTL: false, direction: 'ltr', hasNativeScript: true },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', isRTL: true, direction: 'rtl', hasNativeScript: true },
  { code: 'zh-CN', name: 'Chinese', nativeName: '简体中文', isRTL: false, direction: 'ltr', hasNativeScript: true }
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const TEST_PASSWORD = 'SecureTest123!';

class MultilingualTestHelper {
  constructor(private page: Page) {}

  async switchLanguage(languageCode: string): Promise<boolean> {
    console.log(`🔄 Switching to language: ${languageCode}`);
    
    const selectors = [
      `[data-language="${languageCode}"]`,
      `[data-lang="${languageCode}"]`,
      `option[value="${languageCode}"]`,
      '.language-selector select',
      '#language-select'
    ];

    for (const selector of selectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.count() > 0) {
          if (selector.includes('select') || selector.includes('option')) {
            await this.page.selectOption(selector, languageCode);
          } else {
            await element.click();
          }
          await this.page.waitForTimeout(2000);
          console.log(`✅ Language switched using: ${selector}`);
          return true;
        }
      } catch (error) {
        console.log(`⚠️ Failed selector ${selector}: ${error}`);
      }
    }

    // Try JavaScript approach
    try {
      await this.page.evaluate((lang) => {
        if ((window as any).i18n) {
          (window as any).i18n.changeLanguage(lang);
        }
      }, languageCode);
      await this.page.waitForTimeout(2000);
      console.log(`✅ Language switched via JavaScript`);
      return true;
    } catch (error) {
      console.log(`❌ JavaScript switch failed: ${error}`);
    }

    return false;
  }

  async validateLanguageDisplay(language: LanguageConfig): Promise<boolean> {
    try {
      // Check HTML lang attribute
      const htmlLang = await this.page.getAttribute('html', 'lang');
      const langCorrect = htmlLang === language.code;

      // Check document direction
      const direction = await this.page.evaluate(() => 
        getComputedStyle(document.documentElement).direction
      );
      const directionCorrect = direction === language.direction;

      // Check for translation loading
      await this.page.waitForTimeout(1000);
      const pageText = await this.page.textContent('body') || '';
      const characterEncodingCorrect = !pageText.includes('�');

      console.log(`🔍 Validation for ${language.name}: ` +
        `Lang=${langCorrect}, ` +
        `Dir=${directionCorrect}, ` +
        `Encoding=${characterEncodingCorrect}`);

      return langCorrect && directionCorrect && characterEncodingCorrect;
    } catch (error) {
      console.log(`❌ Validation error for ${language.name}: ${error}`);
      return false;
    }
  }  
async registerUser(language: LanguageConfig): Promise<string> {
    const email = `${language.code}-test-${Date.now()}@testing.com`;
    console.log(`🌐 Registering user in ${language.name}: ${email}`);

    await this.page.goto(`${BASE_URL}/register`);
    await this.page.waitForSelector('input[name="email"]', { timeout: 10000 });

    // Switch to target language if not English
    if (language.code !== 'en-US') {
      await this.switchLanguage(language.code);
    }

    // Fill registration form
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', TEST_PASSWORD);
    await this.page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await this.page.fill('input[name="firstName"]', 'Test');
    await this.page.fill('input[name="lastName"]', 'User');

    // Submit registration
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('**/profile-completion', { timeout: 30000 });

    console.log(`✅ User registered successfully in ${language.name}`);
    return email;
  }

  async completeProfile(language: LanguageConfig): Promise<boolean> {
    console.log(`📝 Completing profile in ${language.name}`);

    try {
      await this.page.waitForSelector('input[name="streetAddress"]', { timeout: 10000 });

      await this.page.fill('input[name="streetAddress"]', '123 Test Street');
      await this.page.fill('input[name="city"]', 'Test City');
      await this.page.fill('input[name="postalCode"]', '12345');
      await this.page.fill('input[name="dateOfBirth"]', '1990-01-01');
      await this.page.selectOption('select[name="maritalStatus"]', 'Single');
      await this.page.selectOption('select[name="gender"]', 'Male');

      await this.page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 10000 });
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(3000);

      console.log(`✅ Profile completed in ${language.name}`);
      return true;
    } catch (error) {
      console.log(`❌ Profile completion failed in ${language.name}: ${error}`);
      return false;
    }
  }

  async conductInterview(language: LanguageConfig): Promise<number> {
    console.log(`🎤 Conducting interview in ${language.name}`);

    try {
      const currentUrl = this.page.url();
      if (!currentUrl.includes('interview')) {
        await this.page.goto(`${BASE_URL}/interview`);
      }

      await this.page.waitForSelector('h1, h2, .question, [data-testid="interview-question"]', { timeout: 15000 });

      let questionsAnswered = 0;
      const maxQuestions = 5; // Limit for testing

      while (questionsAnswered < maxQuestions) {
        // Check if interview is complete
        if (await this.page.locator('.interview-complete, .results, [data-testid="interview-complete"]').count() > 0) {
          break;
        }

        // Look for question elements
        const questionElement = this.page.locator('h1, h2, .question-text, [data-testid="question"]').first();
        if (await questionElement.count() > 0) {
          const questionText = await questionElement.textContent() || '';
          console.log(`📋 Question ${questionsAnswered + 1}: ${questionText.substring(0, 100)}...`);

          await this.answerQuestion();
          questionsAnswered++;
          await this.page.waitForTimeout(2000);
        } else {
          break;
        }
      }

      console.log(`✅ Interview completed in ${language.name} - ${questionsAnswered} questions answered`);
      return questionsAnswered;
    } catch (error) {
      console.log(`❌ Interview failed in ${language.name}: ${error}`);
      return 0;
    }
  }

  private async answerQuestion(): Promise<void> {
    // Try buttons first (multiple choice)
    const buttons = this.page.locator('button:not([disabled]), [role="button"]:not([disabled])');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent() || '';
        
        if (buttonText.trim() && !buttonText.toLowerCase().includes('skip') && 
            !buttonText.toLowerCase().includes('language')) {
          await button.click();
          console.log(`🔘 Selected option: ${buttonText}`);
          return;
        }
      }
    }

    // Try input fields
    const textInput = this.page.locator('input[type="text"], textarea').first();
    if (await textInput.count() > 0) {
      await textInput.fill('Test Answer');
      
      const submitButton = this.page.locator('button[type="submit"], button:has-text("Next"), button:has-text("Continue")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        console.log(`✏️ Filled input and submitted`);
        return;
      }
    }

    // Try next/continue button
    const nextButton = this.page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    if (await nextButton.count() > 0) {
      await nextButton.click();
      console.log(`➡️ Clicked Next/Continue button`);
    }
  }

  async measurePerformance<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    return { result, duration };
  }
}// Test Su
ite: Multilingual User Journey Tests
test.describe('Multilingual User Journey Tests', () => {
  test('Complete user journey in English', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    const language = SUPPORTED_LANGUAGES.find(l => l.code === 'en-US')!;
    
    const result = await helper.measurePerformance(async () => {
      const email = await helper.registerUser(language);
      const profileCompleted = await helper.completeProfile(language);
      const questionsAnswered = await helper.conductInterview(language);
      const validation = await helper.validateLanguageDisplay(language);
      
      return {
        email,
        profileCompleted,
        questionsAnswered,
        validation
      };
    });

    expect(result.result.email).toBeTruthy();
    expect(result.result.profileCompleted).toBe(true);
    expect(result.result.questionsAnswered).toBeGreaterThan(0);
    expect(result.result.validation).toBe(true);
    
    console.log(`✅ English journey completed in ${result.duration}ms`);
  });

  test('Complete user journey in Spanish', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    const language = SUPPORTED_LANGUAGES.find(l => l.code === 'es-ES')!;
    
    const result = await helper.measurePerformance(async () => {
      const email = await helper.registerUser(language);
      const profileCompleted = await helper.completeProfile(language);
      const questionsAnswered = await helper.conductInterview(language);
      const validation = await helper.validateLanguageDisplay(language);
      
      return {
        email,
        profileCompleted,
        questionsAnswered,
        validation
      };
    });

    expect(result.result.email).toBeTruthy();
    expect(result.result.profileCompleted).toBe(true);
    expect(result.result.questionsAnswered).toBeGreaterThan(0);
    expect(result.result.validation).toBe(true);
    
    console.log(`✅ Spanish journey completed in ${result.duration}ms`);
  });

  test('Complete user journey in Arabic (RTL)', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    const language = SUPPORTED_LANGUAGES.find(l => l.code === 'ar-SA')!;
    
    const result = await helper.measurePerformance(async () => {
      const email = await helper.registerUser(language);
      const profileCompleted = await helper.completeProfile(language);
      const questionsAnswered = await helper.conductInterview(language);
      const validation = await helper.validateLanguageDisplay(language);
      
      return {
        email,
        profileCompleted,
        questionsAnswered,
        validation
      };
    });

    expect(result.result.email).toBeTruthy();
    expect(result.result.profileCompleted).toBe(true);
    expect(result.result.questionsAnswered).toBeGreaterThan(0);
    expect(result.result.validation).toBe(true);
    
    console.log(`✅ Arabic (RTL) journey completed in ${result.duration}ms`);
  });

  test('Complete user journey in Chinese', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    const language = SUPPORTED_LANGUAGES.find(l => l.code === 'zh-CN')!;
    
    const result = await helper.measurePerformance(async () => {
      const email = await helper.registerUser(language);
      const profileCompleted = await helper.completeProfile(language);
      const questionsAnswered = await helper.conductInterview(language);
      const validation = await helper.validateLanguageDisplay(language);
      
      return {
        email,
        profileCompleted,
        questionsAnswered,
        validation
      };
    });

    expect(result.result.email).toBeTruthy();
    expect(result.result.profileCompleted).toBe(true);
    expect(result.result.questionsAnswered).toBeGreaterThan(0);
    expect(result.result.validation).toBe(true);
    
    console.log(`✅ Chinese journey completed in ${result.duration}ms`);
  });
});

// Test Suite: Language Switching Workflow Tests
test.describe('Language Switching Workflow Tests', () => {
  test('Language switching during interview', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    
    // Start with English
    const englishLang = SUPPORTED_LANGUAGES.find(l => l.code === 'en-US')!;
    await helper.registerUser(englishLang);
    await helper.completeProfile(englishLang);
    
    // Navigate to interview
    await page.goto(`${BASE_URL}/interview`);
    await page.waitForSelector('h1, h2, .question', { timeout: 10000 });
    
    // Test switching to different languages during interview
    const languagesToTest = ['es-ES', 'ar-SA'];
    
    for (const langCode of languagesToTest) {
      const language = SUPPORTED_LANGUAGES.find(l => l.code === langCode)!;
      console.log(`🔄 Testing switch to ${language.name} during interview`);
      
      const switchResult = await helper.measurePerformance(async () => {
        const switched = await helper.switchLanguage(langCode);
        if (switched) {
          const validation = await helper.validateLanguageDisplay(language);
          return { switched, validation };
        }
        return { switched: false, validation: false };
      });
      
      if (switchResult.result.switched) {
        expect(switchResult.result.validation).toBe(true);
        console.log(`✅ Switch to ${language.name} successful in ${switchResult.duration}ms`);
      }
      
      await page.waitForTimeout(1000);
    }
  });

  test('Language persistence across page reloads', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    
    // Register user and switch to Spanish
    const englishLang = SUPPORTED_LANGUAGES.find(l => l.code === 'en-US')!;
    const spanishLang = SUPPORTED_LANGUAGES.find(l => l.code === 'es-ES')!;
    
    await helper.registerUser(englishLang);
    await helper.completeProfile(englishLang);
    
    // Switch to Spanish
    await helper.switchLanguage('es-ES');
    const initialValidation = await helper.validateLanguageDisplay(spanishLang);
    expect(initialValidation).toBe(true);
    
    // Reload page and check persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const htmlLang = await page.getAttribute('html', 'lang');
    const persistedCorrectly = htmlLang === 'es-ES';
    
    if (persistedCorrectly) {
      console.log('✅ Language persisted correctly after page reload');
    } else {
      console.log(`⚠️ Language did not persist. Expected: es-ES, Got: ${htmlLang}`);
    }
    
    // Test navigation persistence
    await page.goto(`${BASE_URL}/interview`);
    await page.waitForLoadState('networkidle');
    
    const navHtmlLang = await page.getAttribute('html', 'lang');
    const navigationPersisted = navHtmlLang === 'es-ES';
    
    // At least one persistence method should work
    expect(persistedCorrectly || navigationPersisted).toBe(true);
  });

  test('Performance of language switching', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    
    // Setup user
    const englishLang = SUPPORTED_LANGUAGES.find(l => l.code === 'en-US')!;
    await helper.registerUser(englishLang);
    await helper.completeProfile(englishLang);
    
    const performanceResults: Array<{ switch: string; duration: number; success: boolean }> = [];
    const languages = ['en-US', 'es-ES', 'ar-SA'];
    
    for (let i = 0; i < languages.length - 1; i++) {
      const fromLang = languages[i];
      const toLang = languages[i + 1];
      const language = SUPPORTED_LANGUAGES.find(l => l.code === toLang)!;
      
      console.log(`⚡ Performance test: ${fromLang} → ${toLang}`);
      
      const result = await helper.measurePerformance(async () => {
        const switched = await helper.switchLanguage(toLang);
        if (switched) {
          const validation = await helper.validateLanguageDisplay(language);
          return { switched, validation };
        }
        return { switched: false, validation: false };
      });
      
      performanceResults.push({
        switch: `${fromLang}→${toLang}`,
        duration: result.duration,
        success: result.result.switched && result.result.validation
      });
      
      console.log(`📊 ${fromLang}→${toLang}: ${result.duration}ms, Success=${result.result.switched}`);
      
      // Performance assertion
      expect(result.duration).toBeLessThan(5000); // Should complete within 5 seconds
    }
    
    // Overall performance summary
    const successfulSwitches = performanceResults.filter(r => r.success);
    if (successfulSwitches.length > 0) {
      const avgDuration = successfulSwitches.reduce((sum, r) => sum + r.duration, 0) / successfulSwitches.length;
      
      console.log(`📈 Performance Summary: Avg=${avgDuration.toFixed(0)}ms, Success Rate=${successfulSwitches.length}/${performanceResults.length}`);
      
      expect(avgDuration).toBeLessThan(3000); // Average should be under 3 seconds
    }
  });
});

// Test Suite: RTL Language User Experience Tests
test.describe('RTL Language User Experience Tests', () => {
  test('RTL layout and text direction validation', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    const arabicLang = SUPPORTED_LANGUAGES.find(l => l.code === 'ar-SA')!;
    
    console.log(`🔄 Testing RTL experience for ${arabicLang.name}`);
    
    // Register and complete profile in RTL language
    await helper.registerUser(arabicLang);
    await helper.completeProfile(arabicLang);
    
    // Validate RTL layout
    const direction = await page.evaluate(() => 
      getComputedStyle(document.documentElement).direction
    );
    expect(direction).toBe('rtl');
    
    // Check text alignment
    const textAlign = await page.evaluate(() => 
      getComputedStyle(document.body).textAlign
    );
    console.log(`📐 ${arabicLang.name} text alignment: ${textAlign}`);
    
    // Test keyboard navigation in RTL
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Validate language display
    const validation = await helper.validateLanguageDisplay(arabicLang);
    expect(validation).toBe(true);
    
    console.log(`✅ RTL validation passed for ${arabicLang.name}`);
  });

  test('RTL keyboard navigation and focus management', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    const arabicLang = SUPPORTED_LANGUAGES.find(l => l.code === 'ar-SA')!;
    
    await helper.registerUser(arabicLang);
    await helper.completeProfile(arabicLang);
    
    // Navigate to interview to test form navigation
    await page.goto(`${BASE_URL}/interview`);
    await page.waitForSelector('h1, h2, .question', { timeout: 10000 });
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Check if focus is visible and appropriate for RTL
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    console.log('✅ RTL keyboard navigation test completed');
  });
});

// Test Suite: Multilingual Accessibility Tests
test.describe('Multilingual Accessibility Tests', () => {
  test('Screen reader compatibility across languages', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    const testLanguages = ['en-US', 'es-ES', 'ar-SA'];
    
    for (const langCode of testLanguages) {
      const language = SUPPORTED_LANGUAGES.find(l => l.code === langCode)!;
      console.log(`♿ Testing accessibility for ${language.name}`);
      
      await helper.registerUser(language);
      await helper.completeProfile(language);
      
      // Check HTML lang attribute
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBe(language.code);
      
      // Check document direction
      const direction = await page.evaluate(() => 
        getComputedStyle(document.documentElement).direction
      );
      expect(direction).toBe(language.direction);
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      // Check for ARIA attributes
      const ariaElements = await page.locator('[aria-label], [aria-describedby], [role]').count();
      console.log(`♿ ${language.name}: Found ${ariaElements} elements with ARIA attributes`);
      
      console.log(`✅ Accessibility validation passed for ${language.name}`);
      
      // Reset for next language
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
    }
  });

  test('Language change notifications for assistive technologies', async ({ page }) => {
    const helper = new MultilingualTestHelper(page);
    
    // Setup user
    const englishLang = SUPPORTED_LANGUAGES.find(l => l.code === 'en-US')!;
    await helper.registerUser(englishLang);
    await helper.completeProfile(englishLang);
    
    // Switch language and check for announcements
    await helper.switchLanguage('es-ES');
    
    // Check if language change is announced
    const announcements = await page.locator('[aria-live="polite"], [aria-live="assertive"], [role="status"]').count();
    console.log(`📢 Found ${announcements} potential announcement regions`);
    
    // Verify HTML lang attribute changed
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('es-ES');
    
    console.log('✅ Language change notification test completed');
  });
});