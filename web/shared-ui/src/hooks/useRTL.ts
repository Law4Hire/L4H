import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  isRTL, 
  getTextDirection, 
  getTextAlign, 
  formatNumber, 
  formatDate, 
  formatCurrency, 
  formatPercentage, 
  formatRelativeTime, 
  formatDuration, 
  formatFileSize 
} from '../i18n-config'

export interface RTLUtils {
  isRTL: boolean
  direction: 'ltr' | 'rtl'
  textAlign: (align?: 'start' | 'end' | 'left' | 'right' | 'center') => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string
  formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string
  formatPercentage: (value: number, options?: Intl.NumberFormatOptions) => string
  formatRelativeTime: (date: Date, options?: Intl.RelativeTimeFormatOptions) => string
  formatDuration: (seconds: number, options?: { style?: 'long' | 'short' | 'narrow' }) => string
  formatFileSize: (bytes: number, options?: { binary?: boolean }) => string
  getClassName: (ltrClass: string, rtlClass?: string) => string
  getStyle: (ltrStyle: React.CSSProperties, rtlStyle?: React.CSSProperties) => React.CSSProperties
  getFlexDirection: (direction: 'row' | 'row-reverse' | 'column' | 'column-reverse') => string
  getJustifyContent: (justify: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly') => string
  getMarginStart: (value: string | number) => React.CSSProperties
  getMarginEnd: (value: string | number) => React.CSSProperties
  getPaddingStart: (value: string | number) => React.CSSProperties
  getPaddingEnd: (value: string | number) => React.CSSProperties
  getBorderRadius: (position: 'start' | 'end', value: string) => React.CSSProperties
  getTransform: (direction: 'start' | 'end', value: string) => React.CSSProperties
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

    formatCurrency: (value: number, currency = 'USD', options?: Intl.NumberFormatOptions) => 
      formatCurrency(value, currentLanguage, currency, options),

    formatPercentage: (value: number, options?: Intl.NumberFormatOptions) => 
      formatPercentage(value, currentLanguage, options),

    formatRelativeTime: (date: Date, options?: Intl.RelativeTimeFormatOptions) => 
      formatRelativeTime(date, currentLanguage, options),

    formatDuration: (seconds: number, options?: { style?: 'long' | 'short' | 'narrow' }) => 
      formatDuration(seconds, currentLanguage, options),

    formatFileSize: (bytes: number, options?: { binary?: boolean }) => 
      formatFileSize(bytes, currentLanguage, options),
    
    getClassName: (ltrClass: string, rtlClass?: string) => {
      if (!rtlClass) return ltrClass
      return isCurrentRTL ? rtlClass : ltrClass
    },
    
    getStyle: (ltrStyle: React.CSSProperties, rtlStyle?: React.CSSProperties) => {
      if (!rtlStyle) return ltrStyle
      return isCurrentRTL ? { ...ltrStyle, ...rtlStyle } : ltrStyle
    },

    getFlexDirection: (direction: 'row' | 'row-reverse' | 'column' | 'column-reverse') => {
      if (direction === 'column' || direction === 'column-reverse') return direction
      if (direction === 'row') return isCurrentRTL ? 'row-reverse' : 'row'
      if (direction === 'row-reverse') return isCurrentRTL ? 'row' : 'row-reverse'
      return direction
    },

    getJustifyContent: (justify: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly') => {
      if (justify === 'center' || justify === 'between' || justify === 'around' || justify === 'evenly') {
        return `justify-${justify}`
      }
      if (justify === 'start') return isCurrentRTL ? 'justify-end' : 'justify-start'
      if (justify === 'end') return isCurrentRTL ? 'justify-start' : 'justify-end'
      return `justify-${justify}`
    },

    getMarginStart: (value: string | number) => {
      const marginValue = typeof value === 'number' ? `${value}px` : value
      return isCurrentRTL ? { marginRight: marginValue } : { marginLeft: marginValue }
    },

    getMarginEnd: (value: string | number) => {
      const marginValue = typeof value === 'number' ? `${value}px` : value
      return isCurrentRTL ? { marginLeft: marginValue } : { marginRight: marginValue }
    },

    getPaddingStart: (value: string | number) => {
      const paddingValue = typeof value === 'number' ? `${value}px` : value
      return isCurrentRTL ? { paddingRight: paddingValue } : { paddingLeft: paddingValue }
    },

    getPaddingEnd: (value: string | number) => {
      const paddingValue = typeof value === 'number' ? `${value}px` : value
      return isCurrentRTL ? { paddingLeft: paddingValue } : { paddingRight: paddingValue }
    },

    getBorderRadius: (position: 'start' | 'end', value: string) => {
      if (position === 'start') {
        return isCurrentRTL 
          ? { borderTopRightRadius: value, borderBottomRightRadius: value }
          : { borderTopLeftRadius: value, borderBottomLeftRadius: value }
      } else {
        return isCurrentRTL 
          ? { borderTopLeftRadius: value, borderBottomLeftRadius: value }
          : { borderTopRightRadius: value, borderBottomRightRadius: value }
      }
    },

    getTransform: (direction: 'start' | 'end', value: string) => {
      if (direction === 'start') {
        return { transform: isCurrentRTL ? `translateX(${value})` : `translateX(-${value})` }
      } else {
        return { transform: isCurrentRTL ? `translateX(-${value})` : `translateX(${value})` }
      }
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