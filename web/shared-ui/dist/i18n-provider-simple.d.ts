import { ReactNode } from 'react';
export interface Culture {
    code: string;
    displayName: string;
}
interface I18nContextType {
    cultures: Culture[];
    currentCulture: string;
    setCurrentCulture: (culture: string) => Promise<void>;
    isLoading: boolean;
    isRTL: boolean;
    supportedLanguages: string[];
}
interface I18nProviderProps {
    children: ReactNode;
}
export declare function I18nProvider({ children }: I18nProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useI18n(): I18nContextType;
export { useTranslation } from 'react-i18next';
