import { TranslationLoadingState } from '../translation-error-handler';
export interface UseTranslationErrorHandlingOptions {
    enableNotifications?: boolean;
    enableAutoRetry?: boolean;
    maxAutoRetries?: number;
    retryDelay?: number;
}
export interface TranslationErrorHandlingState {
    loadingState: TranslationLoadingState;
    isRetrying: boolean;
    canRetry: boolean;
    showNotification: boolean;
}
export declare function useTranslationErrorHandling(language?: string, namespace?: string, options?: UseTranslationErrorHandlingOptions): {
    retry: () => Promise<boolean>;
    dismissNotification: () => void;
    getErrorStats: () => {
        totalErrors: number;
        errorsByLanguage: Record<string, number>;
        errorsByNamespace: Record<string, number>;
        recentErrors: import("../translation-error-handler").TranslationError[];
    };
    hasTranslation: (key: string, ns?: string) => boolean;
    getFallbackTranslation: (key: string, ns?: string) => string | null;
    hasErrors: boolean;
    isFallbackActive: boolean;
    failedLanguages: string[];
    retryCount: number;
    loadingState: TranslationLoadingState;
    isRetrying: boolean;
    canRetry: boolean;
    showNotification: boolean;
};
export declare function useGlobalTranslationErrorState(): {
    errorStats: {
        totalErrors: number;
        errorsByLanguage: Record<string, number>;
        errorsByNamespace: Record<string, number>;
        recentErrors: import("../translation-error-handler").TranslationError[];
    };
    clearAllErrors: () => void;
    hasGlobalErrors: boolean;
    recentErrorCount: number;
};
