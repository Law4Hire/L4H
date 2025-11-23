import React, { useEffect, useRef } from 'react'
import { CULTURE_NAMES } from '../i18n-config'
import { useAccessibilityI18n } from '../hooks/useAccessibilityI18n'

export interface LanguageChangeNotifierProps {
  /**
   * Whether to show visual notification
   * @default false
   */
  showVisualNotification?: boolean
  
  /**
   * Duration to show visual notification (ms)
   * @default 3000
   */
  notificationDuration?: number
  
  /**
   * Custom message template for language change
   */
  messageTemplate?: (language: string, displayName: string) => string
  
  /**
   * Whether to announce to screen readers
   * @default true
   */
  announceToScreenReader?: boolean
  
  /**
   * Custom CSS class for visual notification
   */
  notificationClassName?: string
}

/**
 * Component that notifies users and assistive technologies about language changes
 */
export function LanguageChangeNotifier({
  showVisualNotification = false,
  notificationDuration = 3000,
  messageTemplate,
  announceToScreenReader = true,
  notificationClassName
}: LanguageChangeNotifierProps) {
  const { announceToScreenReader: announce } = useAccessibilityI18n({
    announceLanguageChanges: false // We'll handle this manually
  })
  
  const [showNotification, setShowNotification] = React.useState(false)
  const [notificationMessage, setNotificationMessage] = React.useState('')
  const previousLanguageRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    const currentLanguage = i18n.language
    const previousLanguage = previousLanguageRef.current
    
    if (previousLanguage && previousLanguage !== currentLanguage) {
      const displayName = CULTURE_NAMES[currentLanguage] || currentLanguage
      const message = messageTemplate
        ? messageTemplate(currentLanguage, displayName)
        : `Language changed to ${displayName}`
      
      // Announce to screen readers
      if (announceToScreenReader) {
        announce(message, 'polite')
        
        // Also dispatch a custom event for other components to listen to
        if (typeof document !== 'undefined') {
          const event = new CustomEvent('languageChangeAnnounced', {
            detail: {
              language: currentLanguage,
              displayName,
              message
            }
          })
          document.dispatchEvent(event)
        }
      }
      
      // Show visual notification if enabled
      if (showVisualNotification) {
        setNotificationMessage(message)
        setShowNotification(true)
        
        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        // Hide notification after duration
        timeoutRef.current = setTimeout(() => {
          setShowNotification(false)
        }, notificationDuration)
      }
    }
    
    previousLanguageRef.current = currentLanguage
  }, [i18n.language, messageTemplate, announceToScreenReader, announce, showVisualNotification, notificationDuration])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  if (!showVisualNotification || !showNotification) {
    return null
  }
  
  return (
    <div
      className={notificationClassName || `
        fixed top-4 right-4 z-50 
        bg-blue-600 text-white 
        px-4 py-2 rounded-md shadow-lg
        transition-opacity duration-300
        ${showNotification ? 'opacity-100' : 'opacity-0'}
      `}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {notificationMessage}
    </div>
  )
}

/**
 * Hook for listening to language change announcements
 */
export function useLanguageChangeListener(
  callback: (event: CustomEvent<{
    language: string
    displayName: string
    message: string
  }>) => void
) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    
    const handleLanguageChange = (event: Event) => {
      callback(event as CustomEvent)
    }
    
    document.addEventListener('languageChangeAnnounced', handleLanguageChange)
    
    return () => {
      document.removeEventListener('languageChangeAnnounced', handleLanguageChange)
    }
  }, [callback])
}

/**
 * Component that provides a live region specifically for language announcements
 */
export function LanguageAnnouncementRegion() {
  const [announcement, setAnnouncement] = React.useState('')
  
  useLanguageChangeListener((event) => {
    setAnnouncement(event.detail.message)
    
    // Clear announcement after it's been read
    setTimeout(() => {
      setAnnouncement('')
    }, 3000)
  })
  
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className="sr-only"
      id="language-announcement-region"
    >
      {announcement}
    </div>
  )
}