import i18next, { type i18n as I18nType } from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import { translationErrorHandler } from './translation-error-handler'
import { translationLoader } from './services/TranslationLoader'

// Singleton instance to prevent multiple i18n instances across applications
let i18nInstance: I18nType | null = null

// Create or get the shared i18n instance
function getI18nInstance(): I18nType {
  if (!i18nInstance) {
    i18nInstance = i18next.createInstance()
    // Note: Plugins will be registered in initI18n function
    // to use our custom enhanced backend
  }
  return i18nInstance
}

// Get the shared i18n instance
const i18n: I18nType = getI18nInstance()

// RTL languages that should flip layout
export const RTL_LANGUAGES = ['ar-SA', 'ur-PK']

// All supported languages (full locale codes only)
export const SUPPORTED_LANGUAGES = [
  'en-US', 'ar-SA', 'bn-BD', 'zh-CN', 'de-DE', 'es-ES', 'fr-FR', 'hi-IN',
  'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR',
  'ru-RU', 'ta-IN', 'te-IN', 'tr-TR', 'ur-PK', 'vi-VN', 'tl-PH'
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

// Application-specific namespace configuration
export const APPLICATION_NAMESPACES = {
  shared: ['common', 'errors', 'forms', 'auth'],
  l4h: ['interview', 'dashboard', 'visa-library', 'pricing'],
  cannlaw: ['legal', 'billing', 'clients', 'cases']
} as const

// All namespaces combined for backwards compatibility
export const NAMESPACES = [
  ...APPLICATION_NAMESPACES.shared,
  ...APPLICATION_NAMESPACES.l4h,
  ...APPLICATION_NAMESPACES.cannlaw
] as const

export type Namespace = typeof NAMESPACES[number]
export type SharedNamespace = typeof APPLICATION_NAMESPACES.shared[number]
export type L4HNamespace = typeof APPLICATION_NAMESPACES.l4h[number]
export type CannlawNamespace = typeof APPLICATION_NAMESPACES.cannlaw[number]

// Default namespace
export const DEFAULT_NAMESPACE = 'common'

// Fallback language
export const FALLBACK_LANGUAGE = 'en-US'

// Language mapping for common fallbacks
const LANGUAGE_MAPPING: Record<string, string> = {
  'en': 'en-US',
  'ar': 'ar-SA',
  'bn': 'bn-BD',
  'zh': 'zh-CN',
  'de': 'de-DE',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'hi': 'hi-IN',
  'id': 'id-ID',
  'it': 'it-IT',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'mr': 'mr-IN',
  'pl': 'pl-PL',
  'pt': 'pt-BR',
  'ru': 'ru-RU',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'tr': 'tr-TR',
  'ur': 'ur-PK',
  'vi': 'vi-VN'
}

// Get language from cookie or browser
function getInitialLanguage(): string {
  if (typeof document !== 'undefined') {
    // Try to get from cookie first
    const cookieMatch = document.cookie.match(/l4h-language=([^;]+)/)
    if (cookieMatch) {
      const cookieLang = cookieMatch[1]
      console.log('Found language in cookie:', cookieLang)
      if (SUPPORTED_LANGUAGES.includes(cookieLang)) {
        return cookieLang
      }
      // Check if it's a mapped language
      if (LANGUAGE_MAPPING[cookieLang]) {
        const mappedLang = LANGUAGE_MAPPING[cookieLang]
        console.log('Mapped cookie language:', cookieLang, '->', mappedLang)
        return mappedLang
      }
    }
  }

  // Fallback to browser language or default
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language
    console.log('Browser language:', browserLang)
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
      return browserLang
    }
    
    // Check if it's a mapped language
    if (LANGUAGE_MAPPING[browserLang]) {
      const mappedLang = LANGUAGE_MAPPING[browserLang]
      console.log('Mapped browser language:', browserLang, '->', mappedLang)
      return mappedLang
    }
    
    // Try to match language without region (e.g., 'en' matches 'en-US')
    const langCode = browserLang.split('-')[0]
    if (LANGUAGE_MAPPING[langCode]) {
      const mappedLang = LANGUAGE_MAPPING[langCode]
      console.log('Mapped language code:', langCode, '->', mappedLang)
      return mappedLang
    }
    
    const matchedLang = SUPPORTED_LANGUAGES.find(lang => lang.startsWith(langCode))
    if (matchedLang) {
      console.log('Found matching language:', matchedLang)
      return matchedLang
    }
  }

  console.log('Using fallback language:', FALLBACK_LANGUAGE)
  return FALLBACK_LANGUAGE
}

// Set RTL direction based on language with enhanced detection and smooth transitions
export function setRTLDirection(language: string): void {
  if (typeof document !== 'undefined') {
    const isRTLLang = isRTL(language)
    const currentDirection = document.documentElement.dir
    const newDirection = isRTLLang ? 'rtl' : 'ltr'
    
    // Only update if direction actually changes to avoid unnecessary DOM updates
    if (currentDirection !== newDirection) {
      // Add transition class for smooth direction changes
      document.documentElement.classList.add('direction-transitioning')
      
      // Set basic direction attributes
      document.documentElement.dir = newDirection
      document.documentElement.lang = language
      
      // Add/remove RTL class and data attributes for CSS styling
      if (isRTLLang) {
        document.documentElement.classList.add('rtl')
        document.documentElement.classList.remove('ltr')
        document.documentElement.setAttribute('data-direction', 'rtl')
        document.documentElement.setAttribute('data-text-direction', 'rtl')
      } else {
        document.documentElement.classList.remove('rtl')
        document.documentElement.classList.add('ltr')
        document.documentElement.setAttribute('data-direction', 'ltr')
        document.documentElement.setAttribute('data-text-direction', 'ltr')
      }
      
      // Set comprehensive CSS custom properties for dynamic RTL support
      const properties = {
        // Text alignment
        '--text-align-start': isRTLLang ? 'right' : 'left',
        '--text-align-end': isRTLLang ? 'left' : 'right',
        
        // Margins
        '--margin-start': isRTLLang ? 'margin-right' : 'margin-left',
        '--margin-end': isRTLLang ? 'margin-left' : 'margin-right',
        '--margin-inline-start': isRTLLang ? 'margin-right' : 'margin-left',
        '--margin-inline-end': isRTLLang ? 'margin-left' : 'margin-right',
        
        // Padding
        '--padding-start': isRTLLang ? 'padding-right' : 'padding-left',
        '--padding-end': isRTLLang ? 'padding-left' : 'padding-right',
        '--padding-inline-start': isRTLLang ? 'padding-right' : 'padding-left',
        '--padding-inline-end': isRTLLang ? 'padding-left' : 'padding-right',
        
        // Borders
        '--border-start': isRTLLang ? 'border-right' : 'border-left',
        '--border-end': isRTLLang ? 'border-left' : 'border-right',
        '--border-inline-start': isRTLLang ? 'border-right' : 'border-left',
        '--border-inline-end': isRTLLang ? 'border-left' : 'border-right',
        
        // Border radius
        '--border-radius-start': isRTLLang ? 'border-top-right-radius border-bottom-right-radius' : 'border-top-left-radius border-bottom-left-radius',
        '--border-radius-end': isRTLLang ? 'border-top-left-radius border-bottom-left-radius' : 'border-top-right-radius border-bottom-right-radius',
        
        // Positioning
        '--inset-start': isRTLLang ? 'right' : 'left',
        '--inset-end': isRTLLang ? 'left' : 'right',
        '--inset-inline-start': isRTLLang ? 'right' : 'left',
        '--inset-inline-end': isRTLLang ? 'left' : 'right',
        
        // Transform values
        '--transform-translate-x-start': isRTLLang ? '100%' : '-100%',
        '--transform-translate-x-end': isRTLLang ? '-100%' : '100%',
        
        // Flexbox
        '--flex-direction-row': isRTLLang ? 'row-reverse' : 'row',
        '--flex-direction-row-reverse': isRTLLang ? 'row' : 'row-reverse',
        '--justify-content-start': isRTLLang ? 'flex-end' : 'flex-start',
        '--justify-content-end': isRTLLang ? 'flex-start' : 'flex-end',
        
        // Grid
        '--grid-column-start': isRTLLang ? 'grid-column-end' : 'grid-column-start',
        '--grid-column-end': isRTLLang ? 'grid-column-start' : 'grid-column-end',
        
        // Scroll behavior
        '--scroll-margin-start': isRTLLang ? 'scroll-margin-right' : 'scroll-margin-left',
        '--scroll-margin-end': isRTLLang ? 'scroll-margin-left' : 'scroll-margin-right',
        '--scroll-padding-start': isRTLLang ? 'scroll-padding-right' : 'scroll-padding-left',
        '--scroll-padding-end': isRTLLang ? 'scroll-padding-left' : 'scroll-padding-right',
        
        // Direction indicator
        '--direction-multiplier': isRTLLang ? '-1' : '1',
        '--direction-factor': isRTLLang ? '1' : '-1',
        
        // Language-specific properties
        '--is-rtl': isRTLLang ? '1' : '0',
        '--is-ltr': isRTLLang ? '0' : '1',
        '--text-direction': newDirection,
        
        // Animation direction
        '--slide-in-direction': isRTLLang ? 'translateX(100%)' : 'translateX(-100%)',
        '--slide-out-direction': isRTLLang ? 'translateX(-100%)' : 'translateX(100%)',
      }
      
      // Apply all CSS custom properties
      Object.entries(properties).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value)
      })
      
      // Remove transition class after a short delay to allow CSS transitions to complete
      setTimeout(() => {
        document.documentElement.classList.remove('direction-transitioning')
      }, 300)
    } else {
      // Even if direction doesn't change, update language attribute
      document.documentElement.lang = language
    }
    
    // Always dispatch custom event for components to react to language/direction changes
    const directionChangeEvent = new CustomEvent('directionchange', {
      detail: { 
        language, 
        direction: newDirection,
        isRTL: isRTLLang,
        previousDirection: currentDirection,
        changed: currentDirection !== newDirection
      }
    })
    document.dispatchEvent(directionChangeEvent)
    
    // Also dispatch a more specific RTL change event
    if (currentDirection !== newDirection) {
      const rtlChangeEvent = new CustomEvent('rtlchange', {
        detail: {
          language,
          isRTL: isRTLLang,
          direction: newDirection,
          previousDirection: currentDirection
        }
      })
      document.dispatchEvent(rtlChangeEvent)
    }
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

// Enhanced number formatting with RTL and locale-specific support
export function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string {
  try {
    // Enhanced options for better RTL and locale support
    const enhancedOptions: Intl.NumberFormatOptions = {
      ...options
    }

    // Special handling for RTL languages
    if (isRTL(language)) {
      // For RTL languages, ensure proper number formatting
      // Arabic and Urdu use different number systems
      if (language.startsWith('ar')) {
        // Arabic uses Arabic-Indic numerals in some contexts
        enhancedOptions.numberingSystem = enhancedOptions.numberingSystem || 'latn' // Use Latin numerals for consistency
      } else if (language.startsWith('ur')) {
        // Urdu typically uses Latin numerals
        enhancedOptions.numberingSystem = 'latn'
      }
    }

    const formatter = new Intl.NumberFormat(language, enhancedOptions)
    return formatter.format(value)
  } catch (error) {
    // Fallback to English formatting if language is not supported
    console.warn(`Number formatting failed for language ${language}, falling back to en-US`)
    return new Intl.NumberFormat('en-US', options).format(value)
  }
}

// Enhanced date formatting with RTL and locale-specific support
export function formatDate(date: Date, language: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    // Enhanced options for better RTL and locale support
    const enhancedOptions: Intl.DateTimeFormatOptions = {
      ...options
    }

    // Special handling for RTL languages
    if (isRTL(language)) {
      // For RTL languages, ensure proper calendar and numbering system
      if (language.startsWith('ar')) {
        // Arabic may use different calendars, but default to Gregorian for consistency
        enhancedOptions.calendar = enhancedOptions.calendar || 'gregory'
        enhancedOptions.numberingSystem = enhancedOptions.numberingSystem || 'latn'
      } else if (language.startsWith('ur')) {
        // Urdu uses Gregorian calendar with Latin numerals
        enhancedOptions.calendar = 'gregory'
        enhancedOptions.numberingSystem = 'latn'
      }
    }

    const formatter = new Intl.DateTimeFormat(language, enhancedOptions)
    return formatter.format(date)
  } catch (error) {
    // Fallback to English formatting if language is not supported
    console.warn(`Date formatting failed for language ${language}, falling back to en-US`)
    return new Intl.DateTimeFormat('en-US', options).format(date)
  }
}

// Format currency with locale-specific support
export function formatCurrency(value: number, language: string, currency: string = 'USD', options?: Intl.NumberFormatOptions): string {
  try {
    const currencyOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
      ...options
    }

    // Special handling for RTL languages
    if (isRTL(language)) {
      currencyOptions.numberingSystem = currencyOptions.numberingSystem || 'latn'
    }

    return formatNumber(value, language, currencyOptions)
  } catch (error) {
    console.warn(`Currency formatting failed for language ${language}, falling back to en-US`)
    return formatNumber(value, 'en-US', { style: 'currency', currency, ...options })
  }
}

// Format percentage with locale-specific support
export function formatPercentage(value: number, language: string, options?: Intl.NumberFormatOptions): string {
  try {
    const percentOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      ...options
    }

    // Special handling for RTL languages
    if (isRTL(language)) {
      percentOptions.numberingSystem = percentOptions.numberingSystem || 'latn'
    }

    return formatNumber(value, language, percentOptions)
  } catch (error) {
    console.warn(`Percentage formatting failed for language ${language}, falling back to en-US`)
    return formatNumber(value, 'en-US', { style: 'percent', ...options })
  }
}

// Format relative time (e.g., "2 hours ago", "in 3 days")
export function formatRelativeTime(date: Date, language: string, options?: Intl.RelativeTimeFormatOptions): string {
  try {
    const now = new Date()
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000)
    
    // Determine the appropriate unit and value
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
      ['year', 365 * 24 * 60 * 60],
      ['month', 30 * 24 * 60 * 60],
      ['week', 7 * 24 * 60 * 60],
      ['day', 24 * 60 * 60],
      ['hour', 60 * 60],
      ['minute', 60],
      ['second', 1]
    ]

    for (const [unit, secondsInUnit] of units) {
      const value = Math.floor(Math.abs(diffInSeconds) / secondsInUnit)
      if (value >= 1) {
        const formatter = new Intl.RelativeTimeFormat(language, {
          numeric: 'auto',
          style: 'long',
          ...options
        })
        return formatter.format(diffInSeconds < 0 ? -value : value, unit)
      }
    }

    // If less than a second, return "now"
    const formatter = new Intl.RelativeTimeFormat(language, options)
    return formatter.format(0, 'second')
  } catch (error) {
    console.warn(`Relative time formatting failed for language ${language}, falling back to en-US`)
    return formatRelativeTime(date, 'en-US', options)
  }
}

// Format time duration (e.g., "2h 30m", "1d 5h")
export function formatDuration(seconds: number, language: string, options?: { style?: 'long' | 'short' | 'narrow' }): string {
  try {
    const { style = 'short' } = options || {}
    
    const units = [
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 }
    ]

    const parts: string[] = []
    let remainingSeconds = Math.abs(seconds)

    for (const { unit, seconds: unitSeconds } of units) {
      const value = Math.floor(remainingSeconds / unitSeconds)
      if (value > 0) {
        const formatter = new Intl.NumberFormat(language)
        const formattedValue = formatter.format(value)
        
        // Create unit formatter for proper localization
        const unitFormatter = new Intl.RelativeTimeFormat(language, { style })
        const unitLabel = unitFormatter.formatToParts(1, unit as Intl.RelativeTimeFormatUnit)
          .find(part => part.type === 'unit')?.value || unit

        parts.push(`${formattedValue}${style === 'short' ? unitLabel.charAt(0) : ` ${unitLabel}`}`)
        remainingSeconds %= unitSeconds
      }
    }

    return parts.length > 0 ? parts.join(' ') : '0s'
  } catch (error) {
    console.warn(`Duration formatting failed for language ${language}, falling back to en-US`)
    return formatDuration(seconds, 'en-US', options)
  }
}

// Format file size with locale-specific support
export function formatFileSize(bytes: number, language: string, options?: { binary?: boolean }): string {
  try {
    const { binary = false } = options || {}
    const base = binary ? 1024 : 1000
    const units = binary 
      ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
      : ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

    if (bytes === 0) return `0 ${units[0]}`

    const exponent = Math.floor(Math.log(Math.abs(bytes)) / Math.log(base))
    const value = bytes / Math.pow(base, exponent)
    const unit = units[Math.min(exponent, units.length - 1)]

    const formatter = new Intl.NumberFormat(language, {
      maximumFractionDigits: exponent === 0 ? 0 : 1,
      numberingSystem: isRTL(language) ? 'latn' : undefined
    })

    return `${formatter.format(value)} ${unit}`
  } catch (error) {
    console.warn(`File size formatting failed for language ${language}, falling back to en-US`)
    return formatFileSize(bytes, 'en-US', options)
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

// Application-specific configuration interface
export interface I18nApplicationConfig {
  application: 'l4h' | 'cannlaw' | 'shared'
  namespaces: string[]
  preloadNamespaces?: string[]
  loadPath?: string
  additionalBackendOptions?: Record<string, any>
}

// Default configurations for each application
export const APPLICATION_CONFIGS: Record<string, I18nApplicationConfig> = {
  l4h: {
    application: 'l4h',
    namespaces: [...APPLICATION_NAMESPACES.shared, ...APPLICATION_NAMESPACES.l4h],
    preloadNamespaces: ['common', 'errors'],
    loadPath: '/locales/{{lng}}/{{ns}}.json'
  },
  cannlaw: {
    application: 'cannlaw',
    namespaces: [...APPLICATION_NAMESPACES.shared, ...APPLICATION_NAMESPACES.cannlaw],
    preloadNamespaces: ['common', 'errors', 'auth'],
    loadPath: '/locales/{{lng}}/{{ns}}.json'
  },
  shared: {
    application: 'shared',
    namespaces: [...APPLICATION_NAMESPACES.shared],
    preloadNamespaces: ['common', 'errors'],
    loadPath: '/locales/{{lng}}/{{ns}}.json'
  }
}

// Custom backend that uses our enhanced TranslationLoader
class EnhancedBackend {
  static type = 'backend' as const
  
  private loadPaths: string[] = []
  
  init(services: any, backendOptions: any) {
    this.loadPaths = Array.isArray(backendOptions.loadPath) 
      ? backendOptions.loadPath 
      : [backendOptions.loadPath]
  }
  
  async read(language: string, namespace: string, callback: (error: any, data?: any) => void) {
    try {
      // Try each load path until one succeeds
      let lastError: Error | null = null
      
      for (const loadPath of this.loadPaths) {
        try {
          const result = await translationLoader.loadTranslation({
            language,
            namespace,
            loadPath,
            cache: true,
            maxRetries: 3,
            retryDelay: 1000
          })
          
          if (result.success) {
            callback(null, result.data)
            return
          } else if (result.error) {
            lastError = result.error
          }
        } catch (error) {
          lastError = error as Error
          continue // Try next load path
        }
      }
      
      // All load paths failed
      callback(lastError || new Error(`Failed to load ${language}/${namespace}`))
    } catch (error) {
      callback(error)
    }
  }
}

// Initialize i18next with application-specific configuration
const initI18n = (config?: Partial<I18nApplicationConfig>) => {
  const initialLanguage = getInitialLanguage()
  
  // Use provided config or default to shared config
  const appConfig = config ? { ...APPLICATION_CONFIGS.shared, ...config } : APPLICATION_CONFIGS.shared
  
  // Determine load paths based on application
  const loadPaths: string[] = []

  // Primary path: root locales directory (where files actually exist)
  loadPaths.push('/locales/{{lng}}/{{ns}}.json')

  // Application-specific paths for future organization
  if (appConfig.application === 'l4h') {
    loadPaths.push('/locales/l4h/{{lng}}/{{ns}}.json')
  } else if (appConfig.application === 'cannlaw') {
    loadPaths.push('/locales/cannlaw/{{lng}}/{{ns}}.json')
  }

  // Shared translations path (for future organization)
  loadPaths.push('/locales/shared/{{lng}}/{{ns}}.json')

  // Use our enhanced backend instead of the default one
  i18n.use(EnhancedBackend).use(initReactI18next)

  return i18n.init({
      // Language settings
      lng: initialLanguage,
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
        'default': [FALLBACK_LANGUAGE]
      },
      supportedLngs: SUPPORTED_LANGUAGES,
      nonExplicitSupportedLngs: false,
      
      // Namespace settings
      ns: appConfig.namespaces,
      defaultNS: DEFAULT_NAMESPACE,
      fallbackNS: DEFAULT_NAMESPACE,
      
      // Backend configuration for lazy loading with multiple load paths
      backend: {
        loadPath: loadPaths,
        requestOptions: {
          cache: 'default',
        },
        ...appConfig.additionalBackendOptions
      },
      
      // Loading behavior - use 'all' to load both 'en-US' and 'en'
      load: 'all',
      preload: [initialLanguage, FALLBACK_LANGUAGE],
      updateMissing: false,
      
      // Interpolation settings
      interpolation: {
        escapeValue: false, // React already escapes values
        format: (value: any, format: any, lng: any) => {
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
      
      // Debug settings (disabled to reduce console noise)
      debug: false,
      
      // Missing key handling
      saveMissing: process.env.NODE_ENV === 'development',
      missingKeyHandler: (lngs: readonly string[], ns: string, key: string, fallbackValue: string) => {
        const lng = lngs[0] || FALLBACK_LANGUAGE
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`)
        }
        // Record missing key for error tracking
        translationErrorHandler.recordMissingKey(lng, ns, key)
      },
      
      // Parsing settings
      parseMissingKeyHandler: (key: string) => {
        // Return the key itself as fallback
        return key.split('.').pop() || key
      }
    })
    .then(async () => {
      // Set initial RTL direction
      setRTLDirection(initialLanguage)
      
      // Save initial language preference
      saveLanguagePreference(initialLanguage)
      
      // Preload critical namespaces if specified
      if (appConfig.preloadNamespaces && appConfig.preloadNamespaces.length > 0) {
        try {
          const loadPath = loadPaths[0] // Use first load path for preloading
          await translationLoader.preloadNamespaces(
            initialLanguage,
            appConfig.preloadNamespaces,
            loadPath
          )
          console.info(`Preloaded critical namespaces: ${appConfig.preloadNamespaces.join(', ')}`)
        } catch (error) {
          console.warn('Failed to preload critical namespaces:', error)
          // Don't fail initialization if preloading fails
        }
      }
      
      console.info(`i18next initialized for ${appConfig.application} with language: ${initialLanguage}`)
      console.info(`Loaded namespaces: ${appConfig.namespaces.join(', ')}`)
      return i18n
    })
    .catch(error => {
      console.error('Failed to initialize i18next:', error)
      throw error
    })
}

// Language change handler
i18n.on('languageChanged', (lng) => {
  console.log('🌐 Language changed event fired:', lng)
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
  // Always log translation loading failures so we know what needs to be fixed
  if (lng === FALLBACK_LANGUAGE) {
    console.error(`🚨 CRITICAL: Failed loading FALLBACK translation: ${lng}/${ns}`, msg)
  } else {
    console.error(`❌ Failed loading translation: ${lng}/${ns}`, msg)
  }

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

// Application-specific initialization functions
export const initL4HI18n = () => initI18n(APPLICATION_CONFIGS.l4h)
export const initCannlawI18n = () => initI18n(APPLICATION_CONFIGS.cannlaw)
export const initSharedI18n = () => initI18n(APPLICATION_CONFIGS.shared)

// Generic initialization with custom config
export const initI18nWithConfig = (config: Partial<I18nApplicationConfig>) => initI18n(config)

// Default initialization (shared config) - for backwards compatibility
export const i18nReady = initI18n()

// Export the shared i18n instance
export default i18n

// Export the instance getter for advanced use cases
export { getI18nInstance }