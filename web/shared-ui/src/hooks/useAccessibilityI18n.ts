import { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { isRTL, getTextDirection, CULTURE_NAMES } from '../i18n-config'

export interface AccessibilityI18nOptions {
  /**
   * Whether to announce language changes to screen readers
   * @default true
   */
  announceLanguageChanges?: boolean
  
  /**
   * Whether to update HTML lang attributes automatically
   * @default true
   */
  updateLangAttributes?: boolean
  
  /**
   * Whether to announce translation loading states
   * @default false
   */
  announceLoadingStates?: boolean
  
  /**
   * Custom announcement messages
   */
  customMessages?: {
    languageChanged?: (language: string, displayName: string) => string
    translationsLoaded?: (language: string) => string
    translationsFailed?: (language: string) => string
  }
}

export interface AccessibilityI18nReturn {
  /**
   * Current language code
   */
  currentLanguage: string
  
  /**
   * Whether current language is RTL
   */
  isRTL: boolean
  
  /**
   * Text direction for current language
   */
  textDirection: 'ltr' | 'rtl'
  
  /**
   * Announce a message to screen readers
   */
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
  
  /**
   * Set language attribute on an element
   */
  setElementLanguage: (element: HTMLElement, language?: string) => void
  
  /**
   * Get appropriate ARIA attributes for current language
   */
  getAriaAttributes: () => {
    lang: string
    dir: 'ltr' | 'rtl'
  }
  
  /**
   * Get language-appropriate text alignment
   */
  getTextAlign: (align?: 'start' | 'end' | 'left' | 'right' | 'center') => string
}

/**
 * Hook for managing accessibility features in multilingual context
 */
export function useAccessibilityI18n(options: AccessibilityI18nOptions = {}): AccessibilityI18nReturn {
  const {
    announceLanguageChanges = true,
    updateLangAttributes = true,
    announceLoadingStates = false,
    customMessages = {}
  } = options
  
  const { i18n } = useTranslation()
  const announcementRef = useRef<HTMLDivElement | null>(null)
  const previousLanguageRef = useRef<string>('')
  
  const currentLanguage = i18n.language
  const currentIsRTL = isRTL(currentLanguage)
  const textDirection = getTextDirection(currentLanguage)
  
  // Create or get the screen reader announcement element
  const getAnnouncementElement = useCallback(() => {
    if (!announcementRef.current) {
      // Create a live region for screen reader announcements
      const element = document.createElement('div')
      element.setAttribute('aria-live', 'polite')
      element.setAttribute('aria-atomic', 'true')
      element.setAttribute('role', 'status')
      element.style.position = 'absolute'
      element.style.left = '-10000px'
      element.style.width = '1px'
      element.style.height = '1px'
      element.style.overflow = 'hidden'
      element.style.clipPath = 'inset(50%)'
      element.style.whiteSpace = 'nowrap'
      element.id = 'i18n-screen-reader-announcements'
      
      document.body.appendChild(element)
      announcementRef.current = element
    }
    return announcementRef.current
  }, [])
  
  // Function to announce messages to screen readers
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof document === 'undefined') return
    
    const element = getAnnouncementElement()
    element.setAttribute('aria-live', priority)
    
    // Clear previous message first
    element.textContent = ''
    
    // Set new message after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      element.textContent = message
    }, 100)
    
    // Clear the message after it's been announced
    setTimeout(() => {
      element.textContent = ''
    }, 3000)
  }, [getAnnouncementElement])
  
  // Function to set language attribute on elements
  const setElementLanguage = useCallback((element: HTMLElement, language?: string) => {
    const lang = language || currentLanguage
    element.setAttribute('lang', lang)
    element.setAttribute('dir', getTextDirection(lang))
  }, [currentLanguage])
  
  // Function to get ARIA attributes for current language
  const getAriaAttributes = useCallback(() => ({
    lang: currentLanguage,
    dir: textDirection
  }), [currentLanguage, textDirection])
  
  // Function to get appropriate text alignment
  const getTextAlign = useCallback((align: 'start' | 'end' | 'left' | 'right' | 'center' = 'start') => {
    if (align === 'center') return 'center'
    
    switch (align) {
      case 'start':
        return currentIsRTL ? 'right' : 'left'
      case 'end':
        return currentIsRTL ? 'left' : 'right'
      case 'left':
        return 'left'
      case 'right':
        return 'right'
      default:
        return currentIsRTL ? 'right' : 'left'
    }
  }, [currentIsRTL])
  
  // Update HTML lang attributes when language changes
  useEffect(() => {
    if (!updateLangAttributes || typeof document === 'undefined') return
    
    const html = document.documentElement
    const previousLang = html.getAttribute('lang')
    
    if (previousLang !== currentLanguage) {
      html.setAttribute('lang', currentLanguage)
      html.setAttribute('dir', textDirection)
      
      // Also update any existing content with lang attributes
      const elementsWithLang = document.querySelectorAll('[lang]')
      elementsWithLang.forEach(element => {
        if (element !== html && element.getAttribute('lang') === previousLang) {
          element.setAttribute('lang', currentLanguage)
          element.setAttribute('dir', textDirection)
        }
      })
    }
  }, [currentLanguage, textDirection, updateLangAttributes])
  
  // Announce language changes to screen readers
  useEffect(() => {
    if (!announceLanguageChanges || typeof document === 'undefined') return
    
    const previousLanguage = previousLanguageRef.current
    
    if (previousLanguage && previousLanguage !== currentLanguage) {
      // Get display name from CULTURE_NAMES mapping or fallback to language code
      const displayName = (() => {
        try {
          // Try to get from i18n data first
          const i18nData = i18n.getDataByLanguage(currentLanguage)
          if (i18nData && typeof i18nData.displayName === 'string') {
            return i18nData.displayName
          }
        } catch (error) {
          // Ignore errors and fall back to other methods
        }
        
        // Use CULTURE_NAMES mapping or fallback to language code
        return CULTURE_NAMES[currentLanguage] || currentLanguage
      })()
      
      const messageResult = customMessages.languageChanged
        ? customMessages.languageChanged(currentLanguage, displayName)
        : `Language changed to ${displayName}`
      
      const message = typeof messageResult === 'string' ? messageResult : `Language changed to ${displayName}`
      
      announceToScreenReader(message, 'polite')
    }
    
    previousLanguageRef.current = currentLanguage
  }, [currentLanguage, announceLanguageChanges, customMessages, announceToScreenReader, i18n])
  
  // Listen for i18n events and announce loading states
  useEffect(() => {
    if (!announceLoadingStates) return
    
    const handleLoaded = (_loaded: any) => {
      const messageResult = customMessages.translationsLoaded
        ? customMessages.translationsLoaded(currentLanguage)
        : `Translations loaded for ${currentLanguage}`
      
      const message = typeof messageResult === 'string' ? messageResult : `Translations loaded for ${currentLanguage}`
      announceToScreenReader(message, 'polite')
    }
    
    const handleFailedLoading = (lng: string, _ns: string, _msg: string) => {
      if (lng === currentLanguage) {
        const messageResult = customMessages.translationsFailed
          ? customMessages.translationsFailed(lng)
          : `Failed to load translations for ${lng}`
        
        const message = typeof messageResult === 'string' ? messageResult : `Failed to load translations for ${lng}`
        announceToScreenReader(message, 'assertive')
      }
    }
    
    i18n.on('loaded', handleLoaded)
    i18n.on('failedLoading', handleFailedLoading)
    
    return () => {
      i18n.off('loaded', handleLoaded)
      i18n.off('failedLoading', handleFailedLoading)
    }
  }, [announceLoadingStates, currentLanguage, customMessages, announceToScreenReader, i18n])
  
  // Cleanup announcement element on unmount
  useEffect(() => {
    return () => {
      if (announcementRef.current && announcementRef.current.parentNode) {
        announcementRef.current.parentNode.removeChild(announcementRef.current)
      }
    }
  }, [])
  
  return {
    currentLanguage,
    isRTL: currentIsRTL,
    textDirection,
    announceToScreenReader,
    setElementLanguage,
    getAriaAttributes,
    getTextAlign
  }
}