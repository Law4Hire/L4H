import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

const RTL_LANGUAGES = ['ar-SA', 'ur-PK', 'ar', 'ur']

export function useRTL() {
  const { i18n } = useTranslation()
  const [isRTL, setIsRTL] = useState(false)

  useEffect(() => {
    const checkRTL = () => {
      const currentLang = i18n.language || 'en-US'
      const rtl = RTL_LANGUAGES.some(rtlLang => 
        currentLang.toLowerCase().startsWith(rtlLang.toLowerCase())
      )
      setIsRTL(rtl)
      
      // Also update document direction
      document.documentElement.dir = rtl ? 'rtl' : 'ltr'
      document.documentElement.lang = currentLang
    }

    checkRTL()
    i18n.on('languageChanged', checkRTL)
    
    return () => {
      i18n.off('languageChanged', checkRTL)
    }
  }, [i18n])

  const getClassName = (className: string) => {
    return isRTL ? `${className} rtl` : className
  }

  return {
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
    getClassName
  }
}
