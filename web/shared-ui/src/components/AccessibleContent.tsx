import React, { forwardRef, useEffect, useRef, useCallback } from 'react'
import { useAccessibilityI18n } from '../hooks/useAccessibilityI18n'
import { useTranslation } from 'react-i18next'

export interface AccessibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Content to render
   */
  children: React.ReactNode
  
  /**
   * Override the language for this content
   */
  language?: string
  
  /**
   * Whether to announce content changes to screen readers
   * @default false
   */
  announceChanges?: boolean
  
  /**
   * Priority for screen reader announcements
   * @default 'polite'
   */
  announcementPriority?: 'polite' | 'assertive'
  
  /**
   * Whether to set lang attribute on the element
   * @default true
   */
  setLangAttribute?: boolean
  
  /**
   * Whether to set dir attribute on the element
   * @default true
   */
  setDirAttribute?: boolean
  
  /**
   * Custom text alignment based on language direction
   */
  textAlign?: 'start' | 'end' | 'left' | 'right' | 'center'
  
  /**
   * HTML element type to render
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements
}

/**
 * Component that provides accessibility features for multilingual content
 */
export const AccessibleContent = forwardRef<HTMLElement, AccessibleContentProps>(({
  children,
  language,
  announceChanges = false,
  announcementPriority = 'polite',
  setLangAttribute = true,
  setDirAttribute = true,
  textAlign,
  as: Component = 'div',
  className,
  style,
  ...props
}, ref) => {
  const { i18n } = useTranslation()
  const {
    currentLanguage,
    textDirection,
    announceToScreenReader,
    getAriaAttributes,
    getTextAlign
  } = useAccessibilityI18n()
  
  const elementRef = useRef<HTMLElement>(null)
  const previousContentRef = useRef<string>('')
  
  // Use provided language or current language
  const effectiveLanguage = language || currentLanguage
  const effectiveDirection = language ? (language.startsWith('ar') || language.startsWith('ur') ? 'rtl' : 'ltr') : textDirection
  
  // Get text alignment based on language direction
  const computedTextAlign = textAlign ? getTextAlign(textAlign) : undefined
  
  // Announce content changes if enabled
  useEffect(() => {
    if (!announceChanges || typeof children !== 'string') return
    
    const currentContent = children as string
    const previousContent = previousContentRef.current
    
    if (previousContent && previousContent !== currentContent) {
      announceToScreenReader(currentContent, announcementPriority)
    }
    
    previousContentRef.current = currentContent
  }, [children, announceChanges, announcementPriority, announceToScreenReader])
  
  // Set language and direction attributes on the element
  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    
    if (setLangAttribute) {
      element.setAttribute('lang', effectiveLanguage)
    }
    
    if (setDirAttribute) {
      element.setAttribute('dir', effectiveDirection)
    }
  }, [effectiveLanguage, effectiveDirection, setLangAttribute, setDirAttribute])
  
  // Combine refs
  const combinedRef = useCallback((node: HTMLElement | null) => {
    // Update our internal ref
    if (elementRef.current !== node) {
      (elementRef as React.MutableRefObject<HTMLElement | null>).current = node
    }
    
    // Forward to external ref
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }, [ref])
  
  // Prepare attributes
  const ariaAttributes = getAriaAttributes()
  const elementProps = {
    ...props,
    ref: combinedRef,
    className,
    style: {
      ...style,
      ...(computedTextAlign && { textAlign: computedTextAlign as any }),
      // Ensure proper text direction for the content
      direction: effectiveDirection,
    },
    // Set ARIA attributes if not overridden
    ...(setLangAttribute && !props.lang && { lang: ariaAttributes.lang }),
    ...(setDirAttribute && !props.dir && { dir: ariaAttributes.dir }),
  }
  
  return React.createElement(Component, elementProps, children)
})

AccessibleContent.displayName = 'AccessibleContent'

/**
 * Specialized component for accessible text content
 */
export const AccessibleText = forwardRef<HTMLElement, Omit<AccessibleContentProps, 'as'> & { as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }>(
  (props, ref) => <AccessibleContent {...props} as={props.as || 'p'} ref={ref} />
)

AccessibleText.displayName = 'AccessibleText'

/**
 * Specialized component for accessible headings
 */
export const AccessibleHeading = forwardRef<HTMLHeadingElement, Omit<AccessibleContentProps, 'as'> & { 
  level: 1 | 2 | 3 | 4 | 5 | 6
}>(({ level, ...props }, ref) => (
  <AccessibleContent {...props} as={`h${level}` as keyof JSX.IntrinsicElements} ref={ref} />
))

AccessibleHeading.displayName = 'AccessibleHeading'

/**
 * Component for live regions that announce content changes
 */
export const AccessibleLiveRegion = forwardRef<HTMLDivElement, Omit<AccessibleContentProps, 'announceChanges' | 'as'> & {
  /**
   * Live region politeness level
   * @default 'polite'
   */
  live?: 'off' | 'polite' | 'assertive'
  
  /**
   * Whether the entire live region should be announced when any part changes
   * @default true
   */
  atomic?: boolean
}>(({
  live = 'polite',
  atomic = true,
  ...props
}, ref) => (
  <AccessibleContent
    {...props}
    as="div"
    announceChanges={false} // Handled by aria-live
    aria-live={live}
    aria-atomic={atomic}
    role="status"
    ref={ref}
  />
))

AccessibleLiveRegion.displayName = 'AccessibleLiveRegion'