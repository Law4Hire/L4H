import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isRTL, getTextDirection, getTextAlign, formatNumber, formatDate, formatCurrency, formatPercentage, formatRelativeTime, formatDuration, formatFileSize } from '../i18n-config';
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
        formatCurrency: (value, currency = 'USD', options) => formatCurrency(value, currentLanguage, currency, options),
        formatPercentage: (value, options) => formatPercentage(value, currentLanguage, options),
        formatRelativeTime: (date, options) => formatRelativeTime(date, currentLanguage, options),
        formatDuration: (seconds, options) => formatDuration(seconds, currentLanguage, options),
        formatFileSize: (bytes, options) => formatFileSize(bytes, currentLanguage, options),
        getClassName: (ltrClass, rtlClass) => {
            if (!rtlClass)
                return ltrClass;
            return isCurrentRTL ? rtlClass : ltrClass;
        },
        getStyle: (ltrStyle, rtlStyle) => {
            if (!rtlStyle)
                return ltrStyle;
            return isCurrentRTL ? { ...ltrStyle, ...rtlStyle } : ltrStyle;
        },
        getFlexDirection: (direction) => {
            if (direction === 'column' || direction === 'column-reverse')
                return direction;
            if (direction === 'row')
                return isCurrentRTL ? 'row-reverse' : 'row';
            if (direction === 'row-reverse')
                return isCurrentRTL ? 'row' : 'row-reverse';
            return direction;
        },
        getJustifyContent: (justify) => {
            if (justify === 'center' || justify === 'between' || justify === 'around' || justify === 'evenly') {
                return `justify-${justify}`;
            }
            if (justify === 'start')
                return isCurrentRTL ? 'justify-end' : 'justify-start';
            if (justify === 'end')
                return isCurrentRTL ? 'justify-start' : 'justify-end';
            return `justify-${justify}`;
        },
        getMarginStart: (value) => {
            const marginValue = typeof value === 'number' ? `${value}px` : value;
            return isCurrentRTL ? { marginRight: marginValue } : { marginLeft: marginValue };
        },
        getMarginEnd: (value) => {
            const marginValue = typeof value === 'number' ? `${value}px` : value;
            return isCurrentRTL ? { marginLeft: marginValue } : { marginRight: marginValue };
        },
        getPaddingStart: (value) => {
            const paddingValue = typeof value === 'number' ? `${value}px` : value;
            return isCurrentRTL ? { paddingRight: paddingValue } : { paddingLeft: paddingValue };
        },
        getPaddingEnd: (value) => {
            const paddingValue = typeof value === 'number' ? `${value}px` : value;
            return isCurrentRTL ? { paddingLeft: paddingValue } : { paddingRight: paddingValue };
        },
        getBorderRadius: (position, value) => {
            if (position === 'start') {
                return isCurrentRTL
                    ? { borderTopRightRadius: value, borderBottomRightRadius: value }
                    : { borderTopLeftRadius: value, borderBottomLeftRadius: value };
            }
            else {
                return isCurrentRTL
                    ? { borderTopLeftRadius: value, borderBottomLeftRadius: value }
                    : { borderTopRightRadius: value, borderBottomRightRadius: value };
            }
        },
        getTransform: (direction, value) => {
            if (direction === 'start') {
                return { transform: isCurrentRTL ? `translateX(${value})` : `translateX(-${value})` };
            }
            else {
                return { transform: isCurrentRTL ? `translateX(-${value})` : `translateX(${value})` };
            }
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
