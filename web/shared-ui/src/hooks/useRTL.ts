import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isRTL, getTextDirection, getTextAlign, formatNumber, formatDate } from '../i18n-config'

export interface RTLUtils {
  isRTL: boolean
  direction: 'ltr' | 'rtl'
  textAlign: (align?: 'start' | 'end' | 'left' | 'right' | 'center') => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string
  getClassName: (ltrClass: string, rtlClass?: string) => string
  getStyle: (ltrStyle: React.CSSProperties, rtlStyle?: React.CSSProperties) => React.CSSProperties
}

/**
 * Hook for RTL language support
 * Provides utilities for handling right-to-left languages
 */
export function useRTL(): RTLUtils {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language)

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng)
    }

    i18n.on('languageChanged', handleLanguageChange)
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  // Listen for custom direction change events
  useEffect(() => {
    const handleDirectionChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language)
    }

    document.addEventListener('directionchange', handleDirectionChange as EventListener)
    
    return () => {
      document.removeEventListener('directionchange', handleDirectionChange as EventListener)
    }
  }, [])

  const isCurrentRTL = isRTL(currentLanguage)
  const currentDirection = getTextDirection(currentLanguage)

  return {
    isRTL: isCurrentRTL,
    direction: currentDirection,
    
    textAlign: (align = 'start') => getTextAlign(currentLanguage, align),
    
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => 
      formatNumber(value, currentLanguage, options),
    
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => 
      formatDate(date, currentLanguage, options),
    
    getClassName: (ltrClass: string, rtlClass?: string) => {
      if (!rtlClass) return ltrClass
      return isCurrentRTL ? rtlClass : ltrClass
    },
    
    getStyle: (ltrStyle: React.CSSProperties, rtlStyle?: React.CSSProperties) => {
      if (!rtlStyle) return ltrStyle
      return isCurrentRTL ? { ...ltrStyle, ...rtlStyle } : ltrStyle
    }
  }
}

/**
 * Hook for getting RTL-aware CSS classes
 * Automatically applies RTL classes based on current language
 */
export function useRTLClasses(baseClasses: string, rtlClasses?: string): string {
  const { isRTL: isCurrentRTL } = useRTL()
  
  if (!rtlClasses) return baseClasses
  
  return isCurrentRTL ? `${baseClasses} ${rtlClasses}` : baseClasses
}

/**
 * Hook for getting RTL-aware inline styles
 * Automatically applies RTL styles based on current language
 */
export function useRTLStyles(
  baseStyles: React.CSSProperties, 
  rtlStyles?: React.CSSProperties
): React.CSSProperties {
  const { isRTL: isCurrentRTL } = useRTL()
  
  if (!rtlStyles) return baseStyles
  
  return isCurrentRTL ? { ...baseStyles, ...rtlStyles } : baseStyles
}