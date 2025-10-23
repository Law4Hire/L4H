import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useTranslation, I18nextProvider } from 'react-i18next'
import i18n, { CULTURE_NAMES, SUPPORTED_LANGUAGES, isRTL } from './i18n-simple'

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
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [currentCulture, setCurrentCultureState] = useState(i18n.language)
  const [isLoading, setIsLoading] = useState(false)
  const [currentIsRTL, setCurrentIsRTL] = useState(isRTL(i18n.language))

  // Create cultures list
  const cultures = Object.entries(CULTURE_NAMES).map(([code, displayName]) => ({
    code,
    displayName
  }))

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      console.log('📱 Provider received language change:', lng)
      setCurrentCultureState(lng)
      setCurrentIsRTL(isRTL(lng))
    }

    i18n.on('languageChanged', handleLanguageChange)
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [])

  const setCurrentCulture = async (culture: string) => {
    console.log('🎯 Setting culture to:', culture)
    setIsLoading(true)
    
    try {
      await i18n.changeLanguage(culture)
      console.log('✅ Language change successful')
    } catch (error) {
      console.error('❌ Failed to change language:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    cultures,
    currentCulture,
    setCurrentCulture,
    isLoading,
    isRTL: currentIsRTL,
    supportedLanguages: SUPPORTED_LANGUAGES,
  }

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>
        {children}
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

// Re-export useTranslation
export { useTranslation } from 'react-i18next'