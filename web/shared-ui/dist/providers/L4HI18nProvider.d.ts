import { ReactNode } from 'react';
import { L4HNamespace, SharedNamespace } from '../i18n-config';
export interface Culture {
    code: string;
    displayName: string;
}
interface L4HI18nContextType {
    cultures: Culture[];
    currentCulture: string;
    setCurrentCulture: (culture: string) => Promise<void>;
    isLoading: boolean;
    isRTL: boolean;
    supportedLanguages: string[];
    hasTranslationErrors: boolean;
    isFallbackActive: boolean;
    retryTranslations: () => Promise<boolean>;
    loadNamespace: (namespace: L4HNamespace | SharedNamespace) => Promise<void>;
    preloadNamespaces: (namespaces: (L4HNamespace | SharedNamespace)[]) => Promise<void>;
}
interface L4HI18nProviderProps {
    children: ReactNode;
    additionalNamespaces?: (L4HNamespace | SharedNamespace)[];
    preloadNamespaces?: (L4HNamespace | SharedNamespace)[];
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
export declare function L4HI18nProvider({ children, additionalNamespaces, preloadNamespaces, accessibility }: L4HI18nProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useL4HI18n(): L4HI18nContextType;
export declare function useL4HT(namespace?: L4HNamespace | SharedNamespace): import("i18next").TFunction<"common" | "errors" | "auth" | "interview" | "forms" | "dashboard" | "pricing" | "visa-library", undefined>;
export {};
