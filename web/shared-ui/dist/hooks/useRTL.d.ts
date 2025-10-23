export interface RTLUtils {
    isRTL: boolean;
    direction: 'ltr' | 'rtl';
    textAlign: (align?: 'start' | 'end' | 'left' | 'right' | 'center') => string;
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
    formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string;
    formatPercentage: (value: number, options?: Intl.NumberFormatOptions) => string;
    formatRelativeTime: (date: Date, options?: Intl.RelativeTimeFormatOptions) => string;
    formatDuration: (seconds: number, options?: {
        style?: 'long' | 'short' | 'narrow';
    }) => string;
    formatFileSize: (bytes: number, options?: {
        binary?: boolean;
    }) => string;
    getClassName: (ltrClass: string, rtlClass?: string) => string;
    getStyle: (ltrStyle: React.CSSProperties, rtlStyle?: React.CSSProperties) => React.CSSProperties;
    getFlexDirection: (direction: 'row' | 'row-reverse' | 'column' | 'column-reverse') => string;
    getJustifyContent: (justify: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly') => string;
    getMarginStart: (value: string | number) => React.CSSProperties;
    getMarginEnd: (value: string | number) => React.CSSProperties;
    getPaddingStart: (value: string | number) => React.CSSProperties;
    getPaddingEnd: (value: string | number) => React.CSSProperties;
    getBorderRadius: (position: 'start' | 'end', value: string) => React.CSSProperties;
    getTransform: (direction: 'start' | 'end', value: string) => React.CSSProperties;
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
