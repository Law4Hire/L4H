import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

// RTL languages that should flip layout
const RTL_LANGUAGES = ['ar-SA', 'ur-PK', 'ar', 'ur'];

// Initialize i18next
i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    lng: 'en-US',
    fallbackLng: 'en-US',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales-new/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;

// Culture interface for API responses
export interface Culture {
  code: string;
  displayName: string;
}

// Load supported cultures from API
export async function loadSupportedCultures(): Promise<Culture[]> {
  try {
    const response = await fetch('/api/v1/i18n/supported');
    if (!response.ok) {
      throw new Error(`Failed to load cultures: ${response.status}`);
    }
    const cultures = await response.json();
    // Add the loaded languages to i18next
    cultures.forEach((culture: Culture) => {
      i18n.addResourceBundle(culture.code, 'translation', {});
    });
    return cultures;
  } catch (error) {
    console.warn('Failed to load supported cultures, using fallback:', error);
    return [
      { code: 'en-US', displayName: 'English' },
      { code: 'es-ES', displayName: 'Spanish' },
    ];
  }
}

// Set culture via API
export async function setCulture(cultureCode: string): Promise<void> {
  try {
    const response = await fetch('/api/v1/i18n/culture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ culture: cultureCode }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set culture: ${response.status}`);
    }

    // Update i18n language
    await i18n.changeLanguage(cultureCode);

    // Set RTL direction
    setRTLDirection(cultureCode);
  } catch (error) {
    console.error('Failed to set culture:', error);
    // Still try to change language locally
    await i18n.changeLanguage(cultureCode);
    setRTLDirection(cultureCode);
  }
}

// Set RTL direction based on language
export function setRTLDirection(languageCode: string): void {
  const htmlElement = document.documentElement;
  const isRTL = RTL_LANGUAGES.some((rtlLang) =>
    languageCode.toLowerCase().startsWith(rtlLang.toLowerCase())
  );

  htmlElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  htmlElement.setAttribute('lang', languageCode);
}

// Check if current language is RTL
export function isRTL(): boolean {
  const currentLang = i18n.language;
  return RTL_LANGUAGES.some((rtlLang) =>
    currentLang.toLowerCase().startsWith(rtlLang.toLowerCase())
  );
}

