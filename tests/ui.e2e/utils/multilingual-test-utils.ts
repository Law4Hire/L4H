import { Page, expect } from '@playwright/test';

/**
 * Utility functions for multilingual e2e testing
 * 
 * This module provides reusable functions for:
 * - Language detection and validation
 * - Translation completeness checking
 * - RTL layout validation
 * - Performance measurement
 * - Accessibility testing
 */

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  hasNativeScript: boolean;
  scriptRange?: RegExp;
}

export interface TranslationValidationResult {
  isComplete: boolean;
  missingKeys: string[];
  fallbacksDetected: string[];
  nativeScriptPresent: boolean;
  characterEncodingCorrect: boolean;
}

export interface RTLValidationResult {
  directionCorrect: boolean;
  textAlignmentCorrect: boolean;
  layoutMirrored: boolean;
  keyboardNavigationCorrect: boolean;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  languageSwitchTime: number;
  translationLoadTime: number;
  renderTime: number;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { 
    code: 'en-US', 
    name: 'English', 
    nativeName: 'English', 
    isRTL: false, 
    direction: 'ltr', 
    hasNativeScript: true,
    scriptRange: /[a-zA-Z]/
  },
  { 
    code: 'es-ES', 
    name: 'Spanish', 
    nativeName: 'Español', 
    isRTL: false, 
    direction: 'ltr', 
    hasNativeScript: true,
    scriptRange: /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/
  },
  { 
    code: 'fr-FR', 
    name: 'French', 
    nativeName: 'Français', 
    isRTL: false, 
    direction: 'ltr', 
    hasNativeScript: true,
    scriptRange: /[a-zA-ZàâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/
  },
  { 
    code: 'de-DE', 
    name: 'German', 
    nativeName: 'Deutsch', 
    isRTL: false, 
    direction: 'ltr', 
    hasNativeScript: true,
    scriptRange: /[a-zA-ZäöüßÄÖÜ]/
  },
  { 
    code: 'ar-SA', 
    name: 'Arabic', 
    nativeName: 'العربية', 
    isRTL: true, 
    direction: 'rtl', 
    hasNativeScript: true,
    scriptRange: /[\u0600-\u06FF]/
  },
  { 
    code: 'zh-CN', 
    name: 'Chinese', 
    nativeName: '简体中文', 
    isRTL: false, 
    direction: 'ltr', 
    hasNativeScript: true,
    scriptRange: /[\u4E00-\u9FFF]/
  },
  { 
    code: 'hi-IN', 
    name: 'Hindi', 
    nativeName: 'हिन्दी', 
    isRTL: false, 
    direction: 'ltr', 
    hasNativeScript: true,
    scriptRange: /[\u0900-\u097F]/
  },
  { 
    code: 'ja-JP', 
    name: 'Japanese', 
    nativeName: '日本語', 
    isRTL: false, 
    direction: 'ltr', 
    hasNativeScript: true,
    scriptRange: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/
  },
  { 
    code: 'ur-PK', 
    name: 'Urdu', 
    nativeName: 'اردو', 
    isRTL: true, 
    direction: 'rtl', 
    hasNativeScript: true,
    scriptRange: /[\u0600-\u06FF]/
  },
  { 
    code: 'ru-RU', 
    name: 'Russian', 
    nativeName: 'Русский', 
    isRTL: false, 
    direction: 'ltr', 
    hasNativeScript: true,
    scriptRange: /[\u0400-\u04FF]/
  }
];

export class MultilingualTestUtils {
  constructor(private page: Page) {}

  /**
   * Switch the application language using various methods
   */
  async switchLanguage(languageCode: string): Promise<boolean> {
    console.log(`🔄 Switching to language: ${languageCode}`);
    
    const methods = [
      () => this.switchViaDataAttribute(languageCode),
      () => this.switchViaSelect(languageCode),
      () => this.switchViaButton(languageCode),
      () => this.switchViaJavaScript(languageCode)
    ];

    for (const method of methods) {
      try {
        const success = await method();
        if (success) {
          await this.page.waitForTimeout(2000); // Allow time for language change
          return true;
        }
      } catch (error) {
        console.log(`⚠️ Language switch method failed: ${error}`);
      }
    }

    console.log(`❌ Could not switch to language: ${languageCode}`);
    return false;
  }

  private async switchViaDataAttribute(languageCode: string): Promise<boolean> {
    const selectors = [
      `[data-language="${languageCode}"]`,
      `[data-lang="${languageCode}"]`,
      `[data-locale="${languageCode}"]`
    ];

    for (const selector of selectors) {
      const element = this.page.locator(selector).first();
      if (await element.count() > 0) {
        await element.click();
        console.log(`✅ Language switched via data attribute: ${selector}`);
        return true;
      }
    }
    return false;
  }

  private async switchViaSelect(languageCode: string): Promise<boolean> {
    const selectors = [
      '.language-selector select',
      '#language-select',
      'select[name="language"]',
      'select[aria-label*="language" i]'
    ];

    for (const selector of selectors) {
      const select = this.page.locator(selector).first();
      if (await select.count() > 0) {
        await select.selectOption(languageCode);
        console.log(`✅ Language switched via select: ${selector}`);
        return true;
      }
    }
    return false;
  }

  private async switchViaButton(languageCode: string): Promise<boolean> {
    const language = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    if (!language) return false;

    const buttonTexts = [language.nativeName, language.name, languageCode];
    
    for (const text of buttonTexts) {
      const button = this.page.locator(`button:has-text("${text}")`).first();
      if (await button.count() > 0) {
        await button.click();
        console.log(`✅ Language switched via button: ${text}`);
        return true;
      }
    }
    return false;
  }

  private async switchViaJavaScript(languageCode: string): Promise<boolean> {
    try {
      await this.page.evaluate((lang) => {
        const i18n = (window as any).i18n;
        if (i18n && typeof i18n.changeLanguage === 'function') {
          i18n.changeLanguage(lang);
          return true;
        }
        return false;
      }, languageCode);
      
      console.log(`✅ Language switched via JavaScript API`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate that the page is displaying in the correct language
   */
  async validateLanguageDisplay(language: LanguageConfig): Promise<TranslationValidationResult> {
    const result: TranslationValidationResult = {
      isComplete: false,
      missingKeys: [],
      fallbacksDetected: [],
      nativeScriptPresent: false,
      characterEncodingCorrect: false
    };

    try {
      // Check HTML lang attribute
      const htmlLang = await this.page.getAttribute('html', 'lang');
      const langCorrect = htmlLang === language.code;

      // Check document direction
      const direction = await this.page.evaluate(() => 
        getComputedStyle(document.documentElement).direction
      );
      const directionCorrect = direction === language.direction;

      // Get page text content
      const pageText = await this.page.textContent('body') || '';
      
      // Check character encoding
      result.characterEncodingCorrect = !pageText.includes('�') && !pageText.includes('?');

      // Check for native script
      if (language.scriptRange) {
        result.nativeScriptPresent = language.scriptRange.test(pageText);
      } else {
        result.nativeScriptPresent = true; // Assume true for languages without specific script ranges
      }

      // Check for English fallbacks (for non-English languages)
      if (language.code !== 'en-US') {
        const commonEnglishWords = [
          'Loading', 'Error', 'Submit', 'Cancel', 'Next', 'Previous',
          'Save', 'Delete', 'Edit', 'Create', 'Update', 'Search'
        ];
        
        result.fallbacksDetected = commonEnglishWords.filter(word => 
          pageText.toLowerCase().includes(word.toLowerCase())
        );
      }

      // Check for missing translation keys (keys that look like "common.button.submit")
      const keyPattern = /\b[a-z]+\.[a-z]+\.[a-zA-Z]+\b/g;
      const potentialKeys = pageText.match(keyPattern) || [];
      result.missingKeys = potentialKeys.filter(key => 
        key.includes('.') && key.length > 5
      );

      result.isComplete = langCorrect && directionCorrect && 
                         result.characterEncodingCorrect && 
                         result.nativeScriptPresent &&
                         result.fallbacksDetected.length === 0 &&
                         result.missingKeys.length === 0;

      console.log(`🔍 Language validation for ${language.name}: ` +
        `Complete=${result.isComplete}, ` +
        `Script=${result.nativeScriptPresent}, ` +
        `Encoding=${result.characterEncodingCorrect}, ` +
        `Fallbacks=${result.fallbacksDetected.length}, ` +
        `MissingKeys=${result.missingKeys.length}`);

    } catch (error) {
      console.log(`❌ Language validation error for ${language.name}: ${error}`);
    }

    return result;
  }

  /**
   * Validate RTL layout and behavior
   */
  async validateRTLLayout(language: LanguageConfig): Promise<RTLValidationResult> {
    const result: RTLValidationResult = {
      directionCorrect: false,
      textAlignmentCorrect: false,
      layoutMirrored: false,
      keyboardNavigationCorrect: false
    };

    if (!language.isRTL) {
      // For LTR languages, just check that direction is not RTL
      const direction = await this.page.evaluate(() => 
        getComputedStyle(document.documentElement).direction
      );
      result.directionCorrect = direction !== 'rtl';
      result.textAlignmentCorrect = true;
      result.layoutMirrored = true;
      result.keyboardNavigationCorrect = true;
      return result;
    }

    try {
      // Check document direction
      const direction = await this.page.evaluate(() => 
        getComputedStyle(document.documentElement).direction
      );
      result.directionCorrect = direction === 'rtl';

      // Check text alignment
      const bodyTextAlign = await this.page.evaluate(() => 
        getComputedStyle(document.body).textAlign
      );
      result.textAlignmentCorrect = bodyTextAlign === 'right' || bodyTextAlign === 'start';

      // Check layout mirroring by examining margin/padding
      const layoutMirrored = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let mirroredCount = 0;
        let totalCount = 0;

        for (const element of elements) {
          const style = getComputedStyle(element);
          const marginLeft = parseFloat(style.marginLeft);
          const marginRight = parseFloat(style.marginRight);
          const paddingLeft = parseFloat(style.paddingLeft);
          const paddingRight = parseFloat(style.paddingRight);

          if (marginLeft !== marginRight || paddingLeft !== paddingRight) {
            totalCount++;
            // In RTL, we expect right margins/padding to be larger in many cases
            if (marginRight > marginLeft || paddingRight > paddingLeft) {
              mirroredCount++;
            }
          }
        }

        return totalCount === 0 ? true : (mirroredCount / totalCount) > 0.3;
      });
      result.layoutMirrored = layoutMirrored;

      // Test keyboard navigation (basic check)
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(500);
      
      const focusedElement = await this.page.evaluate(() => {
        const active = document.activeElement;
        if (active) {
          const rect = active.getBoundingClientRect();
          return {
            tagName: active.tagName,
            x: rect.x,
            width: rect.width
          };
        }
        return null;
      });

      result.keyboardNavigationCorrect = focusedElement !== null;

      console.log(`🔍 RTL validation for ${language.name}: ` +
        `Direction=${result.directionCorrect}, ` +
        `TextAlign=${result.textAlignmentCorrect}, ` +
        `Layout=${result.layoutMirrored}, ` +
        `Keyboard=${result.keyboardNavigationCorrect}`);

    } catch (error) {
      console.log(`❌ RTL validation error for ${language.name}: ${error}`);
    }

    return result;
  }

  /**
   * Measure performance of language-related operations
   */
  async measurePerformance<T>(operation: () => Promise<T>): Promise<{ result: T; metrics: PerformanceMetrics }> {
    const startTime = Date.now();
    
    // Start performance measurement
    await this.page.evaluate(() => {
      (window as any).performanceStart = performance.now();
    });

    const result = await operation();

    // End performance measurement
    const endTime = Date.now();
    const clientMetrics = await this.page.evaluate(() => {
      const end = performance.now();
      const start = (window as any).performanceStart || end;
      return {
        clientDuration: end - start,
        navigationTiming: performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming,
        paintTiming: performance.getEntriesByType('paint')
      };
    });

    const metrics: PerformanceMetrics = {
      pageLoadTime: endTime - startTime,
      languageSwitchTime: clientMetrics.clientDuration,
      translationLoadTime: clientMetrics.navigationTiming?.loadEventEnd - clientMetrics.navigationTiming?.loadEventStart || 0,
      renderTime: clientMetrics.paintTiming.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    };

    console.log(`⚡ Performance metrics: ` +
      `Total=${metrics.pageLoadTime}ms, ` +
      `Switch=${metrics.languageSwitchTime.toFixed(1)}ms, ` +
      `Translation=${metrics.translationLoadTime.toFixed(1)}ms, ` +
      `Render=${metrics.renderTime.toFixed(1)}ms`);

    return { result, metrics };
  }

  /**
   * Test accessibility features for multilingual content
   */
  async validateAccessibility(language: LanguageConfig): Promise<boolean> {
    try {
      // Check HTML lang attribute
      const htmlLang = await this.page.getAttribute('html', 'lang');
      if (htmlLang !== language.code) {
        console.log(`❌ HTML lang attribute incorrect: expected ${language.code}, got ${htmlLang}`);
        return false;
      }

      // Check for ARIA attributes
      const ariaElements = await this.page.locator('[aria-label], [aria-describedby], [role]').count();
      console.log(`♿ Found ${ariaElements} elements with ARIA attributes`);

      // Check for live regions (for dynamic content announcements)
      const liveRegions = await this.page.locator('[aria-live], [role="status"], [role="alert"]').count();
      console.log(`📢 Found ${liveRegions} live regions for announcements`);

      // Test keyboard navigation
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(500);
      
      const focusVisible = await this.page.evaluate(() => {
        const active = document.activeElement;
        if (active) {
          const style = getComputedStyle(active);
          return style.outline !== 'none' || style.boxShadow.includes('focus') || 
                 active.classList.contains('focus-visible');
        }
        return false;
      });

      if (!focusVisible) {
        console.log(`⚠️ Focus indicators may not be visible`);
      }

      // Check color contrast (basic check)
      const contrastIssues = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let issues = 0;
        
        for (const element of elements) {
          const style = getComputedStyle(element);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          
          // Basic check - if both are very light or very dark, flag as potential issue
          if (color === 'rgb(255, 255, 255)' && backgroundColor === 'rgb(255, 255, 255)') {
            issues++;
          }
          if (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(0, 0, 0)') {
            issues++;
          }
        }
        
        return issues;
      });

      if (contrastIssues > 0) {
        console.log(`⚠️ Potential contrast issues found: ${contrastIssues}`);
      }

      console.log(`✅ Accessibility validation completed for ${language.name}`);
      return true;

    } catch (error) {
      console.log(`❌ Accessibility validation failed for ${language.name}: ${error}`);
      return false;
    }
  }

  /**
   * Generate localized test data for forms
   */
  getLocalizedTestData(language: LanguageConfig) {
    const testData = {
      'en-US': {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main Street',
        city: 'New York',
        postalCode: '10001',
        country: 'United States'
      },
      'es-ES': {
        firstName: 'María',
        lastName: 'García',
        street: 'Calle Mayor 123',
        city: 'Madrid',
        postalCode: '28001',
        country: 'Spain'
      },
      'fr-FR': {
        firstName: 'Pierre',
        lastName: 'Dubois',
        street: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      },
      'de-DE': {
        firstName: 'Hans',
        lastName: 'Müller',
        street: 'Hauptstraße 123',
        city: 'Berlin',
        postalCode: '10115',
        country: 'Germany'
      },
      'ar-SA': {
        firstName: 'أحمد',
        lastName: 'العلي',
        street: 'شارع الملك فهد 123',
        city: 'الرياض',
        postalCode: '11564',
        country: 'Saudi Arabia'
      },
      'zh-CN': {
        firstName: '李',
        lastName: '明',
        street: '中山路123号',
        city: '北京',
        postalCode: '100000',
        country: 'China'
      },
      'hi-IN': {
        firstName: 'राज',
        lastName: 'शर्मा',
        street: 'राजपथ 123',
        city: 'नई दिल्ली',
        postalCode: '110001',
        country: 'India'
      },
      'ja-JP': {
        firstName: '田中',
        lastName: '太郎',
        street: '新宿区123番地',
        city: '東京',
        postalCode: '160-0022',
        country: 'Japan'
      },
      'ur-PK': {
        firstName: 'احمد',
        lastName: 'خان',
        street: 'شاہراہ قائداعظم 123',
        city: 'کراچی',
        postalCode: '75600',
        country: 'Pakistan'
      },
      'ru-RU': {
        firstName: 'Иван',
        lastName: 'Петров',
        street: 'Красная площадь 123',
        city: 'Москва',
        postalCode: '101000',
        country: 'Russia'
      }
    };

    return testData[language.code as keyof typeof testData] || testData['en-US'];
  }
}

/**
 * Helper function to get language configuration by code
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Helper function to get all RTL languages
 */
export function getRTLLanguages(): LanguageConfig[] {
  return SUPPORTED_LANGUAGES.filter(lang => lang.isRTL);
}

/**
 * Helper function to get all LTR languages
 */
export function getLTRLanguages(): LanguageConfig[] {
  return SUPPORTED_LANGUAGES.filter(lang => !lang.isRTL);
}

/**
 * Helper function to get high-priority languages for testing
 */
export function getHighPriorityLanguages(): LanguageConfig[] {
  // Return a subset of languages that are most critical for testing
  return SUPPORTED_LANGUAGES.filter(lang => 
    ['en-US', 'es-ES', 'ar-SA', 'zh-CN'].includes(lang.code)
  );
}