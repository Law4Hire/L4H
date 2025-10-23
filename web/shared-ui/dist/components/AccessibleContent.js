import { jsx as _jsx } from "react/jsx-runtime";
import React, { forwardRef, useEffect, useRef, useCallback } from 'react';
import { useAccessibilityI18n } from '../hooks/useAccessibilityI18n';
import { useTranslation } from 'react-i18next';
/**
 * Component that provides accessibility features for multilingual content
 */
export const AccessibleContent = forwardRef(({ children, language, announceChanges = false, announcementPriority = 'polite', setLangAttribute = true, setDirAttribute = true, textAlign, as: Component = 'div', className, style, ...props }, ref) => {
    const { i18n } = useTranslation();
    const { currentLanguage, textDirection, announceToScreenReader, getAriaAttributes, getTextAlign } = useAccessibilityI18n();
    const elementRef = useRef(null);
    const previousContentRef = useRef('');
    // Use provided language or current language
    const effectiveLanguage = language || currentLanguage;
    const effectiveDirection = language ? (language.startsWith('ar') || language.startsWith('ur') ? 'rtl' : 'ltr') : textDirection;
    // Get text alignment based on language direction
    const computedTextAlign = textAlign ? getTextAlign(textAlign) : undefined;
    // Announce content changes if enabled
    useEffect(() => {
        if (!announceChanges || typeof children !== 'string')
            return;
        const currentContent = children;
        const previousContent = previousContentRef.current;
        if (previousContent && previousContent !== currentContent) {
            announceToScreenReader(currentContent, announcementPriority);
        }
        previousContentRef.current = currentContent;
    }, [children, announceChanges, announcementPriority, announceToScreenReader]);
    // Set language and direction attributes on the element
    useEffect(() => {
        const element = elementRef.current;
        if (!element)
            return;
        if (setLangAttribute) {
            element.setAttribute('lang', effectiveLanguage);
        }
        if (setDirAttribute) {
            element.setAttribute('dir', effectiveDirection);
        }
    }, [effectiveLanguage, effectiveDirection, setLangAttribute, setDirAttribute]);
    // Combine refs
    const combinedRef = useCallback((node) => {
        // Update our internal ref
        if (elementRef.current !== node) {
            elementRef.current = node;
        }
        // Forward to external ref
        if (typeof ref === 'function') {
            ref(node);
        }
        else if (ref) {
            ref.current = node;
        }
    }, [ref]);
    // Prepare attributes
    const ariaAttributes = getAriaAttributes();
    const elementProps = {
        ...props,
        ref: combinedRef,
        className,
        style: {
            ...style,
            ...(computedTextAlign && { textAlign: computedTextAlign }),
            // Ensure proper text direction for the content
            direction: effectiveDirection,
        },
        // Set ARIA attributes if not overridden
        ...(setLangAttribute && !props.lang && { lang: ariaAttributes.lang }),
        ...(setDirAttribute && !props.dir && { dir: ariaAttributes.dir }),
    };
    return React.createElement(Component, elementProps, children);
});
AccessibleContent.displayName = 'AccessibleContent';
/**
 * Specialized component for accessible text content
 */
export const AccessibleText = forwardRef((props, ref) => _jsx(AccessibleContent, { ...props, as: props.as || 'p', ref: ref }));
AccessibleText.displayName = 'AccessibleText';
/**
 * Specialized component for accessible headings
 */
export const AccessibleHeading = forwardRef(({ level, ...props }, ref) => (_jsx(AccessibleContent, { ...props, as: `h${level}`, ref: ref })));
AccessibleHeading.displayName = 'AccessibleHeading';
/**
 * Component for live regions that announce content changes
 */
export const AccessibleLiveRegion = forwardRef(({ live = 'polite', atomic = true, ...props }, ref) => (_jsx(AccessibleContent, { ...props, as: "div", announceChanges: false, "aria-live": live, "aria-atomic": atomic, role: "status", ref: ref })));
AccessibleLiveRegion.displayName = 'AccessibleLiveRegion';
