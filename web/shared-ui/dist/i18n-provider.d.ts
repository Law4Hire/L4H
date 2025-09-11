import { ReactNode } from 'react';
import { Culture } from './i18n-enhanced';
interface I18nContextType {
    cultures: Culture[];
    currentCulture: string;
    setCurrentCulture: (culture: string) => Promise<void>;
    isLoading: boolean;
}
interface I18nProviderProps {
    children: ReactNode;
}
export declare function I18nProvider({ children }: I18nProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useI18n(): I18nContextType;
export declare function useT(namespace?: string): import("i18next").TFunction<string, undefined>;
export { useTranslation } from 'react-i18next';
