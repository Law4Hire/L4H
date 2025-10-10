import i18n from 'i18next';
export declare const CULTURE_NAMES: Record<string, string>;
export declare const i18nReady: Promise<void>;
export default i18n;
export interface Culture {
    code: string;
    displayName: string;
}
export declare function getSupportedCultures(): Culture[];
export declare function setCulture(cultureCode: string): Promise<void>;
export declare function setRTLDirection(languageCode: string): void;
export declare function isRTL(): boolean;
export declare function useT(namespace?: string): import("i18next").TFunction<string, undefined>;
