export declare function formatCurrency(amount: number, currency?: string, locale?: string): string;
export declare function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions, locale?: string): string;
export declare function formatTime(date: Date | string, options?: Intl.DateTimeFormatOptions, locale?: string): string;
export declare function formatDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions, locale?: string): string;
export declare function formatNumber(number: number, options?: Intl.NumberFormatOptions, locale?: string): string;
export declare function formatRelativeTime(date: Date | string, options?: Intl.RelativeTimeFormatOptions, locale?: string): string;
export declare function formatFileSize(bytes: number, locale?: string): string;
export declare function formatPercentage(value: number, options?: Intl.NumberFormatOptions, locale?: string): string;
export declare function formatList(items: string[], _options?: {
    type?: 'conjunction' | 'disjunction' | 'unit';
    style?: 'long' | 'short' | 'narrow';
}, _locale?: string): string;
declare global {
    interface Window {
        i18n?: {
            language: string;
        };
    }
}
