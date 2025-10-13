export interface RTLUtils {
    isRTL: boolean;
    direction: 'ltr' | 'rtl';
    textAlign: (align?: 'start' | 'end' | 'left' | 'right' | 'center') => string;
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
    getClassName: (ltrClass: string, rtlClass?: string) => string;
    getStyle: (ltrStyle: React.CSSProperties, rtlStyle?: React.CSSProperties) => React.CSSProperties;
}
/**
 * Hook for RTL language support
 * Provides utilities for handling right-to-left languages
 */
export declare function useRTL(): RTLUtils;
/**
 * Hook for getting RTL-aware CSS classes
 * Automatically applies RTL classes based on current language
 */
export declare function useRTLClasses(baseClasses: string, rtlClasses?: string): string;
/**
 * Hook for getting RTL-aware inline styles
 * Automatically applies RTL styles based on current language
 */
export declare function useRTLStyles(baseStyles: React.CSSProperties, rtlStyles?: React.CSSProperties): React.CSSProperties;
