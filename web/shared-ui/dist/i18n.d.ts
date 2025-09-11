import i18n from 'i18next';
export default i18n;
export interface Culture {
    code: string;
    displayName: string;
}
export declare function loadSupportedCultures(): Promise<Culture[]>;
export declare function setCulture(cultureCode: string): Promise<void>;
export declare function setRTLDirection(languageCode: string): void;
export declare function isRTL(): boolean;
