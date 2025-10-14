import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useTranslation, I18nextProvider } from 'react-i18next'
import i18n, { CULTURE_NAMES, SUPPORTED_LANGUAGES, isRTL, i18nReady } from './i18n-config'
import { i18n as i18nApi } from './api-client'
import { useTranslationErrorHandling } from './hooks/useTranslationErrorHandling'
import TranslationErrorNotification from './components/TranslationErrorNotification'

export interface Culture {
  code: string
  displayName: string
}

interface I18nContextType {
  cultures: Culture[]
  currentCulture: string
  setCurrentCulture: (culture: string) => Promise<void>
  isLoading: boolean
  isRTL: boolean
  supportedLanguages: string[]
  hasTranslationErrors: boolean
  isFallbackActive: boolean
  retryTranslations: () => Promise<boolean>
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [cultures, setCultures] = useState<Culture[]>([])
  const [currentCulture, setCurrentCultureState] = useState(i18n.language)
  const [isLoading, setIsLoading] = useState(true)
  const [i18nInitialized, setI18nInitialized] = useState(false)
  const [currentIsRTL, setCurrentIsRTL] = useState(false)
  
  // Use translation error handling
  const {
    hasErrors,
    isFallbackActive,
    retry,
    showNotification,
    dismissNotification
  } = useTranslationErrorHandling(currentCulture, undefined, {
    enableNotifications: true,
    enableAutoRetry: true
  })

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        // Wait for i18n to be ready
        await i18nReady
        setI18nInitialized(true)
        
        // Use local culture definitions instead of API calls
        const supportedCultures = Object.entries(CULTURE_NAMES).map(([code, displayName]) => ({
          code,
          displayName
        }))
        setCultures(supportedCultures)
        
        // Set initial RTL state
        setCurrentIsRTL(isRTL(i18n.language))
      } catch (error) {
        console.error('Failed to initialize i18n:', error)
        // Fallback to basic cultures
        setCultures([
          { code: 'en-US', displayName: 'English (United States)' },
          { code: 'es-ES', displayName: 'Español (España)' },
          { code: 'fr-FR', displayName: 'Français (France)' },
          { code: 'ar-SA', displayName: 'العربية (السعودية)' }
        ])
        setCurrentIsRTL(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeI18n()
  }, [])

  // Listen for language changes and update currentCulture state
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentCultureState(lng)
      setCurrentIsRTL(isRTL(lng))
    }

    i18n.on('languageChanged', handleLanguageChange)
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [])

  const setCurrentCulture = async (culture: string) => {
    try {
      // Change language locally first (this will also save to cookie via setCulture)
      await i18n.changeLanguage(culture)

      // Save to cookie explicitly for consistency
      const setCookie = (name: string, value: string, days = 365): void => {
        if (typeof document === 'undefined') return
        const expires = new Date()
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
      }
      setCookie('l4h-language', culture)

      // Also persist to server for logged-in users
      try {
        await i18nApi.setCulture(culture)
      } catch (apiError) {
        // API call failed, but local change succeeded - continue gracefully
        console.warn('Failed to persist language preference to server:', apiError)
      }
    } catch (error) {
      console.error('Failed to set culture:', error)
    }
  }

  const value = {
    cultures,
    currentCulture,
    setCurrentCulture,
    isLoading,
    isRTL: currentIsRTL,
    supportedLanguages: SUPPORTED_LANGUAGES,
    hasTranslationErrors: hasErrors,
    isFallbackActive,
    retryTranslations: retry
  }

  // Don't render children until i18n is initialized
  if (!i18nInitialized) {
    return <div>Loading translations...</div>
  }

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>
        {children}
        {showNotification && (
          <TranslationErrorNotification
            language={currentCulture}
            onRetry={retry}
            onDismiss={dismissNotification}
          />
        )}
      </I18nContext.Provider>
    </I18nextProvider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Hook for using translations with namespace support
export function useT(namespace?: string) {
  const { t } = useTranslation(namespace)
  return t
}

// Re-export useTranslation that's properly connected to our shared i18n instance
export { useTranslation } from 'react-i18next'
