import { type i18n as I18nType } from 'i18next';
declare const i18n: I18nType;
export declare const SUPPORTED_LANGUAGES: string[];
export declare const CULTURE_NAMES: Record<string, string>;
export declare const RTL_LANGUAGES: string[];
export declare function isRTL(language: string): boolean;
export default i18n;
