import i18next, { type i18n as I18nType } from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'

// Simple, working i18n configuration
const i18n: I18nType = i18next.createInstance()

// All supported languages
export const SUPPORTED_LANGUAGES = [
  'en-US', 'ar-SA', 'bn-BD', 'zh-CN', 'de-DE', 'es-ES', 'fr-FR', 'hi-IN',
  'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR',
  'ru-RU', 'ta-IN', 'te-IN', 'tr-TR', 'ur-PK', 'vi-VN'
]

// Culture display names mapping
export const CULTURE_NAMES: Record<string, string> = {
  'en-US': 'English (United States)',
  'ar-SA': 'العربية (السعودية)',
  'bn-BD': 'বাংলা (বাংলাদেশ)',
  'de-DE': 'Deutsch (Deutschland)',
  'es-ES': 'Español (España)',
  'fr-FR': 'Français (France)',
  'hi-IN': 'हिन्दी (भारत)',
  'id-ID': 'Bahasa Indonesia (Indonesia)',
  'it-IT': 'Italiano (Italia)',
  'ja-JP': '日本語 (日本)',
  'ko-KR': '한국어 (대한민국)',
  'mr-IN': 'मराठी (भारत)',
  'pl-PL': 'Polski (Polska)',
  'pt-BR': 'Português (Brasil)',
  'ru-RU': 'Русский (Россия)',
  'ta-IN': 'தமிழ் (இந்தியா)',
  'te-IN': 'తెలుగు (భారతదేశం)',
  'tr-TR': 'Türkçe (Türkiye)',
  'ur-PK': 'اردو (پاکستان)',
  'vi-VN': 'Tiếng Việt (Việt Nam)',
  'zh-CN': '中文 (中国)',
}

// RTL languages
export const RTL_LANGUAGES = ['ar-SA', 'ur-PK']

export function isRTL(language: string): boolean {
  return RTL_LANGUAGES.includes(language)
}

// Get initial language from cookie or browser
function getInitialLanguage(): string {
  // Try cookie first
  if (typeof document !== 'undefined') {
    const cookieMatch = document.cookie.match(/l4h-language=([^;]+)/)
    if (cookieMatch && SUPPORTED_LANGUAGES.includes(cookieMatch[1])) {
      console.log('🍪 Using language from cookie:', cookieMatch[1])
      return cookieMatch[1]
    }
  }
  
  // Default to English
  console.log('🌐 Using default language: en-US')
  return 'en-US'
}

// Initialize i18n synchronously to ensure languages array is populated
i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    initImmediate: false, // Initialize synchronously to populate languages array immediately
    lng: getInitialLanguage(),
    fallbackLng: {
      'en': ['en-US'],
      'ar': ['ar-SA'],
      'bn': ['bn-BD'],
      'zh': ['zh-CN'],
      'de': ['de-DE'],
      'es': ['es-ES'],
      'fr': ['fr-FR'],
      'hi': ['hi-IN'],
      'id': ['id-ID'],
      'it': ['it-IT'],
      'ja': ['ja-JP'],
      'ko': ['ko-KR'],
      'mr': ['mr-IN'],
      'pl': ['pl-PL'],
      'pt': ['pt-BR'],
      'ru': ['ru-RU'],
      'ta': ['ta-IN'],
      'te': ['te-IN'],
      'tr': ['tr-TR'],
      'ur': ['ur-PK'],
      'vi': ['vi-VN'],
      'tl': ['tl-PH'],
      'default': ['en-US']
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true, // Allow short codes to fallback without warnings
    load: 'currentOnly', // Only load the current language, not all fallback languages

    ns: ['common', 'interview', 'errors'],
    defaultNS: 'common',

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    interpolation: {
      escapeValue: false,
      // Use +() syntax instead of {{}} for placeholders
      prefix: '+(',
      suffix: ')',
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },

    preload: [getInitialLanguage()], // Preload the initial language
    debug: false, // Disabled to reduce console noise
  })

// Language change handler
i18n.on('languageChanged', (lng) => {
  console.log('🔄 Language changed to:', lng)
  
  // Save to cookie
  if (typeof document !== 'undefined') {
    const expires = new Date()
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000))
    document.cookie = `l4h-language=${lng};expires=${expires.toUTCString()};path=/;SameSite=Strict`
    console.log('🍪 Saved language to cookie:', lng)
  }
  
  // Set RTL direction
  if (typeof document !== 'undefined') {
    document.documentElement.dir = isRTL(lng) ? 'rtl' : 'ltr'
    document.documentElement.lang = lng
  }
})

export default i18n