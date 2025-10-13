import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isRTL, getTextDirection, getTextAlign, formatNumber, formatDate } from '../i18n-config';
/**
 * Hook for RTL language support
 * Provides utilities for handling right-to-left languages
 */
export function useRTL() {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
    // Listen for language changes
    useEffect(() => {
        const handleLanguageChange = (lng) => {
            setCurrentLanguage(lng);
        };
        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [i18n]);
    // Listen for custom direction change events
    useEffect(() => {
        const handleDirectionChange = (event) => {
            setCurrentLanguage(event.detail.language);
        };
        document.addEventListener('directionchange', handleDirectionChange);
        return () => {
            document.removeEventListener('directionchange', handleDirectionChange);
        };
    }, []);
    const isCurrentRTL = isRTL(currentLanguage);
    const currentDirection = getTextDirection(currentLanguage);
    return {
        isRTL: isCurrentRTL,
        direction: currentDirection,
        textAlign: (align = 'start') => getTextAlign(currentLanguage, align),
        formatNumber: (value, options) => formatNumber(value, currentLanguage, options),
        formatDate: (date, options) => formatDate(date, currentLanguage, options),
        getClassName: (ltrClass, rtlClass) => {
            if (!rtlClass)
                return ltrClass;
            return isCurrentRTL ? rtlClass : ltrClass;
        },
        getStyle: (ltrStyle, rtlStyle) => {
            if (!rtlStyle)
                return ltrStyle;
            return isCurrentRTL ? { ...ltrStyle, ...rtlStyle } : ltrStyle;
        }
    };
}
/**
 * Hook for getting RTL-aware CSS classes
 * Automatically applies RTL classes based on current language
 */
export function useRTLClasses(baseClasses, rtlClasses) {
    const { isRTL: isCurrentRTL } = useRTL();
    if (!rtlClasses)
        return baseClasses;
    return isCurrentRTL ? `${baseClasses} ${rtlClasses}` : baseClasses;
}
/**
 * Hook for getting RTL-aware inline styles
 * Automatically applies RTL styles based on current language
 */
export function useRTLStyles(baseStyles, rtlStyles) {
    const { isRTL: isCurrentRTL } = useRTL();
    if (!rtlStyles)
        return baseStyles;
    return isCurrentRTL ? { ...baseStyles, ...rtlStyles } : baseStyles;
}
