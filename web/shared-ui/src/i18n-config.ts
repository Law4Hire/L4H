import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import { translationErrorHandler } from './translation-error-handler'

// RTL languages that should flip layout
export const RTL_LANGUAGES = ['ar-SA', 'ur-PK', 'ar', 'ur']

// All supported languages
export const SUPPORTED_LANGUAGES = [
  'ar-SA', 'bn-BD', 'zh-CN', 'de-DE', 'es-ES', 'fr-FR', 'hi-IN', 
  'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR', 
  'ru-RU', 'ta-IN', 'te-IN', 'tr-TR', 'ur-PK', 'vi-VN', 'en-US'
]

// Culture display names mapping
export const CULTURE_NAMES: Record<string, string> = {
  'ar-SA': 'العربية (السعودية)',
  'bn-BD': 'বাংলা (বাংলাদেশ)',
  'de-DE': 'Deutsch (Deutschland)',
  'en-US': 'English (United States)',
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

// Namespaces for different parts of the application
export const NAMESPACES = ['common', 'interview', 'errors'] as const
export type Namespace = typeof NAMESPACES[number]

// Default namespace
export const DEFAULT_NAMESPACE = 'common'

// Fallback language
export const FALLBACK_LANGUAGE = 'en-US'

// Get language from cookie or browser
function getInitialLanguage(): string {
  if (typeof document !== 'undefined') {
    // Try to get from cookie first
    const cookieMatch = document.cookie.match(/l4h-language=([^;]+)/)
    if (cookieMatch) {
      const cookieLang = cookieMatch[1]
      if (SUPPORTED_LANGUAGES.includes(cookieLang)) {
        return cookieLang
      }
    }
  }

  // Fallback to browser language or default
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
      return browserLang
    }
    
    // Try to match language without region (e.g., 'en' matches 'en-US')
    const langCode = browserLang.split('-')[0]
    const matchedLang = SUPPORTED_LANGUAGES.find(lang => lang.startsWith(langCode))
    if (matchedLang) {
      return matchedLang
    }
  }

  return FALLBACK_LANGUAGE
}

// Set RTL direction based on language with enhanced detection
export function setRTLDirection(language: string): void {
  if (typeof document !== 'undefined') {
    const isRTLLang = isRTL(language)
    document.documentElement.dir = isRTLLang ? 'rtl' : 'ltr'
    document.documentElement.lang = language
    
    // Add/remove RTL class for CSS styling
    if (isRTLLang) {
      document.documentElement.classList.add('rtl')
      document.documentElement.setAttribute('data-direction', 'rtl')
    } else {
      document.documentElement.classList.remove('rtl')
      document.documentElement.setAttribute('data-direction', 'ltr')
    }
    
    // Set CSS custom properties for dynamic RTL support
    document.documentElement.style.setProperty('--text-align-start', isRTLLang ? 'right' : 'left')
    document.documentElement.style.setProperty('--text-align-end', isRTLLang ? 'left' : 'right')
    document.documentElement.style.setProperty('--margin-start', isRTLLang ? 'margin-right' : 'margin-left')
    document.documentElement.style.setProperty('--margin-end', isRTLLang ? 'margin-left' : 'margin-right')
    document.documentElement.style.setProperty('--padding-start', isRTLLang ? 'padding-right' : 'padding-left')
    document.documentElement.style.setProperty('--padding-end', isRTLLang ? 'padding-left' : 'padding-right')
    document.documentElement.style.setProperty('--border-start', isRTLLang ? 'border-right' : 'border-left')
    document.documentElement.style.setProperty('--border-end', isRTLLang ? 'border-left' : 'border-right')
    document.documentElement.style.setProperty('--inset-start', isRTLLang ? 'right' : 'left')
    document.documentElement.style.setProperty('--inset-end', isRTLLang ? 'left' : 'right')
    
    // Dispatch custom event for components to react to direction changes
    const directionChangeEvent = new CustomEvent('directionchange', {
      detail: { 
        language, 
        direction: isRTLLang ? 'rtl' : 'ltr',
        isRTL: isRTLLang 
      }
    })
    document.dispatchEvent(directionChangeEvent)
  }
}

// Check if language is RTL with enhanced detection
export function isRTL(language: string): boolean {
  // Direct match for full language codes
  if (RTL_LANGUAGES.includes(language)) {
    return true
  }
  
  // Check language code without region (e.g., 'ar' from 'ar-SA')
  const langCode = language.split('-')[0].toLowerCase()
  return RTL_LANGUAGES.some(rtlLang => rtlLang.split('-')[0].toLowerCase() === langCode)
}

// Get text direction for a language
export function getTextDirection(language: string): 'ltr' | 'rtl' {
  return isRTL(language) ? 'rtl' : 'ltr'
}

// Get appropriate text alignment for RTL languages
export function getTextAlign(language: string, align: 'start' | 'end' | 'left' | 'right' | 'center' = 'start'): string {
  if (align === 'center') return 'center'
  
  const isRTLLang = isRTL(language)
  
  switch (align) {
    case 'start':
      return isRTLLang ? 'right' : 'left'
    case 'end':
      return isRTLLang ? 'left' : 'right'
    case 'left':
      return 'left'
    case 'right':
      return 'right'
    default:
      return isRTLLang ? 'right' : 'left'
  }
}

// Format numbers appropriately for RTL languages
export function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(language, options).format(value)
  } catch (error) {
    // Fallback to English formatting if language is not supported
    console.warn(`Number formatting failed for language ${language}, falling back to en-US`)
    return new Intl.NumberFormat('en-US', options).format(value)
  }
}

// Format dates appropriately for RTL languages
export function formatDate(date: Date, language: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(language, options).format(date)
  } catch (error) {
    // Fallback to English formatting if language is not supported
    console.warn(`Date formatting failed for language ${language}, falling back to en-US`)
    return new Intl.DateTimeFormat('en-US', options).format(date)
  }
}

// Save language preference to cookie
function saveLanguagePreference(language: string): void {
  if (typeof document !== 'undefined') {
    const expires = new Date()
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000)) // 1 year
    document.cookie = `l4h-language=${language};expires=${expires.toUTCString()};path=/;SameSite=Strict`
  }
}

// Initialize i18next with enhanced configuration
const initI18n = () => {
  const initialLanguage = getInitialLanguage()

  return i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
      // Language settings
      lng: initialLanguage,
      fallbackLng: FALLBACK_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES,
      
      // Namespace settings
      ns: NAMESPACES,
      defaultNS: DEFAULT_NAMESPACE,
      fallbackNS: DEFAULT_NAMESPACE,
      
      // Backend configuration for lazy loading
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        
        // Retry configuration
        requestOptions: {
          cache: 'default',
        },
        
        // Custom load function with enhanced error handling and retry logic
        customLoad: (language: string, namespace: string, callback: (error: any, data?: any) => void) => {
          const url = `/locales/${language}/${namespace}.json`
          
          // Record loading start
          translationErrorHandler.startLoading(language, namespace)
          
          const attemptLoad = async (retryCount = 0): Promise<void> => {
            try {
              const response = await fetch(url, {
                cache: 'default',
                headers: {
                  'Accept': 'application/json',
                  'Cache-Control': 'no-cache'
                }
              })
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
              }
              
              const data = await response.json()
              
              // Record successful loading
              translationErrorHandler.recordSuccess(language, namespace)
              callback(null, data)
              
            } catch (error) {
              const errorObj = error instanceof Error ? error : new Error(String(error))
              
              // Record the error
              translationErrorHandler.recordError(language, namespace, errorObj)
              
              // If not the fallback language, try fallback
              if (language !== FALLBACK_LANGUAGE) {
                try {
                  const fallbackUrl = `/locales/${FALLBACK_LANGUAGE}/${namespace}.json`
                  const fallbackResponse = await fetch(fallbackUrl, {
                    cache: 'default',
                    headers: {
                      'Accept': 'application/json'
                    }
                  })
                  
                  if (!fallbackResponse.ok) {
                    throw new Error(`Fallback HTTP ${fallbackResponse.status}: ${fallbackResponse.statusText}`)
                  }
                  
                  const fallbackData = await fallbackResponse.json()
                  
                  console.info(`Loaded fallback translations for ${namespace} from ${FALLBACK_LANGUAGE}`)
                  callback(null, fallbackData)
                  
                } catch (fallbackError) {
                  const fallbackErrorObj = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
                  translationErrorHandler.recordError(FALLBACK_LANGUAGE, namespace, fallbackErrorObj)
                  
                  console.error(`Failed to load fallback translations:`, fallbackError)
                  
                  // Return minimal fallback object to prevent complete failure
                  const minimalFallback = {
                    loading: 'Loading...',
                    error: 'Error',
                    retry: 'Retry',
                    dismiss: 'Dismiss'
                  }
                  callback(null, minimalFallback)
                }
              } else {
                // Already trying fallback language, return minimal fallback
                console.error(`Failed to load fallback language translations:`, error)
                const minimalFallback = {
                  loading: 'Loading...',
                  error: 'Error',
                  retry: 'Retry',
                  dismiss: 'Dismiss'
                }
                callback(null, minimalFallback)
              }
            }
          }
          
          // Start the loading attempt
          attemptLoad()
        }
      },
      
      // Loading behavior
      load: 'languageOnly', // Load only the language part (e.g., 'en' from 'en-US')
      preload: [initialLanguage, FALLBACK_LANGUAGE], // Preload current and fallback languages
      
      // Interpolation settings
      interpolation: {
        escapeValue: false, // React already escapes values
        format: (value, format, lng) => {
          // Custom formatting for numbers, dates, etc.
          if (format === 'number') {
            return new Intl.NumberFormat(lng).format(value)
          }
          if (format === 'currency') {
            return new Intl.NumberFormat(lng, { style: 'currency', currency: 'USD' }).format(value)
          }
          if (format === 'date') {
            return new Intl.DateTimeFormat(lng).format(new Date(value))
          }
          return value
        }
      },
      
      // React specific settings
      react: {
        useSuspense: false, // Disable suspense to handle loading states manually
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
        transEmptyNodeValue: '', // Return empty string for empty nodes
        transSupportBasicHtmlNodes: true, // Support basic HTML in translations
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'], // Allowed HTML tags
      },
      
      // Debug settings (disable in production)
      debug: process.env.NODE_ENV === 'development',
      
      // Missing key handling
      saveMissing: process.env.NODE_ENV === 'development',
      missingKeyHandler: (lng, ns, key) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`)
        }
      },
      
      // Parsing settings
      parseMissingKeyHandler: (key) => {
        // Return the key itself as fallback
        return key.split('.').pop() || key
      }
    })
    .then(() => {
      // Set initial RTL direction
      setRTLDirection(initialLanguage)
      
      // Save initial language preference
      saveLanguagePreference(initialLanguage)
      
      console.info(`i18next initialized with language: ${initialLanguage}`)
      return i18n
    })
    .catch(error => {
      console.error('Failed to initialize i18next:', error)
      throw error
    })
}

// Language change handler
i18n.on('languageChanged', (lng) => {
  setRTLDirection(lng)
  saveLanguagePreference(lng)
  console.info(`Language changed to: ${lng}`)
})

// Enhanced loading state handlers with error tracking
i18n.on('loaded', (loaded) => {
  console.info('Translations loaded:', Object.keys(loaded))
  
  // Record successful loads for each language/namespace combination
  Object.keys(loaded).forEach(key => {
    const [lng, ns] = key.split('|')
    if (lng && ns) {
      translationErrorHandler.recordSuccess(lng, ns)
    }
  })
})

i18n.on('failedLoading', (lng, ns, msg) => {
  console.warn(`Failed loading translation: ${lng}/${ns}`, msg)
  
  // Record the error with detailed information
  const error = new Error(msg || `Failed to load ${lng}/${ns}`)
  translationErrorHandler.recordError(lng, ns, error)
})

// Additional event handlers for better error tracking
i18n.on('languageChanged', (lng) => {
  setRTLDirection(lng)
  saveLanguagePreference(lng)
  console.info(`Language changed to: ${lng}`)
  
  // Clear previous error state when language changes successfully
  // This helps reset the error state for the new language
})

i18n.on('initialized', (options) => {
  console.info('i18next initialized with options:', options)
})

i18n.on('added', (lng, ns) => {
  console.info(`Translation namespace added: ${lng}/${ns}`)
  translationErrorHandler.recordSuccess(lng, ns)
})

i18n.on('removed', (lng, ns) => {
  console.info(`Translation namespace removed: ${lng}/${ns}`)
})

// Export the initialization promise
export const i18nReady = initI18n()

export default i18n