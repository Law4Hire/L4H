import { ReactNode } from 'react';
import { CannlawNamespace, SharedNamespace } from '../i18n-config';
export interface Culture {
    code: string;
    displayName: string;
}
interface CannlawI18nContextType {
    cultures: Culture[];
    currentCulture: string;
    setCurrentCulture: (culture: string) => Promise<void>;
    isLoading: boolean;
    isRTL: boolean;
    supportedLanguages: string[];
    hasTranslationErrors: boolean;
    isFallbackActive: boolean;
    retryTranslations: () => Promise<boolean>;
    loadNamespace: (namespace: CannlawNamespace | SharedNamespace) => Promise<void>;
    preloadNamespaces: (namespaces: (CannlawNamespace | SharedNamespace)[]) => Promise<void>;
}
interface CannlawI18nProviderProps {
    children: ReactNode;
    additionalNamespaces?: (CannlawNamespace | SharedNamespace)[];
    preloadNamespaces?: (CannlawNamespace | SharedNamespace)[];
    /**
     * Accessibility options
     */
    accessibility?: {
        /**
         * Whether to show visual language change notifications
         * @default false
         */
        showVisualNotifications?: boolean;
        /**
         * Whether to announce language changes to screen readers
         * @default true
         */
        announceLanguageChanges?: boolean;
        /**
         * Duration for visual notifications (ms)
         * @default 3000
         */
        notificationDuration?: number;
    };
}
export declare function CannlawI18nProvider({ children, additionalNamespaces, preloadNamespaces, accessibility }: CannlawI18nProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useCannlawI18n(): CannlawI18nContextType;
export declare function useCannlawT(namespace?: CannlawNamespace | SharedNamespace): import("i18next").TFunction<"common" | "errors" | "auth" | "forms" | "legal" | "billing" | "clients" | "cases", undefined>;
export {};
