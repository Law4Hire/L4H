import { type i18n as I18nType } from 'i18next';
declare function getI18nInstance(): I18nType;
declare const i18n: I18nType;
export declare const RTL_LANGUAGES: string[];
export declare const SUPPORTED_LANGUAGES: string[];
export declare const CULTURE_NAMES: Record<string, string>;
export declare const APPLICATION_NAMESPACES: {
    readonly shared: readonly ["common", "errors", "forms", "auth"];
    readonly l4h: readonly ["interview", "dashboard", "visa-library", "pricing"];
    readonly cannlaw: readonly ["legal", "billing", "clients", "cases"];
};
export declare const NAMESPACES: readonly ["common", "errors", "forms", "auth", "interview", "dashboard", "visa-library", "pricing", "legal", "billing", "clients", "cases"];
export type Namespace = typeof NAMESPACES[number];
export type SharedNamespace = typeof APPLICATION_NAMESPACES.shared[number];
export type L4HNamespace = typeof APPLICATION_NAMESPACES.l4h[number];
export type CannlawNamespace = typeof APPLICATION_NAMESPACES.cannlaw[number];
export declare const DEFAULT_NAMESPACE = "common";
export declare const FALLBACK_LANGUAGE = "en-US";
export declare function setRTLDirection(language: string): void;
export declare function isRTL(language: string): boolean;
export declare function getTextDirection(language: string): 'ltr' | 'rtl';
export declare function getTextAlign(language: string, align?: 'start' | 'end' | 'left' | 'right' | 'center'): string;
export declare function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string;
export declare function formatDate(date: Date, language: string, options?: Intl.DateTimeFormatOptions): string;
export declare function formatCurrency(value: number, language: string, currency?: string, options?: Intl.NumberFormatOptions): string;
export declare function formatPercentage(value: number, language: string, options?: Intl.NumberFormatOptions): string;
export declare function formatRelativeTime(date: Date, language: string, options?: Intl.RelativeTimeFormatOptions): string;
export declare function formatDuration(seconds: number, language: string, options?: {
    style?: 'long' | 'short' | 'narrow';
}): string;
export declare function formatFileSize(bytes: number, language: string, options?: {
    binary?: boolean;
}): string;
export interface I18nApplicationConfig {
    application: 'l4h' | 'cannlaw' | 'shared';
    namespaces: string[];
    preloadNamespaces?: string[];
    loadPath?: string;
    additionalBackendOptions?: Record<string, any>;
}
export declare const APPLICATION_CONFIGS: Record<string, I18nApplicationConfig>;
export declare const initL4HI18n: () => Promise<I18nType>;
export declare const initCannlawI18n: () => Promise<I18nType>;
export declare const initSharedI18n: () => Promise<I18nType>;
export declare const initI18nWithConfig: (config: Partial<I18nApplicationConfig>) => Promise<I18nType>;
export declare const i18nReady: Promise<I18nType>;
export default i18n;
export { getI18nInstance };
