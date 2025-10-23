import React from 'react';
export interface FallbackTranslationOptions {
    fallbackLanguage?: string;
    fallbackNamespace?: string;
    enableGracefulDegradation?: boolean;
    showFallbackNotification?: boolean;
}
export interface FallbackTranslationState {
    isFallbackActive: boolean;
    fallbackLanguage: string | null;
    originalLanguage: string;
    hasError: boolean;
    errorMessage?: string;
}
/**
 * Hook for handling translation fallbacks with graceful degradation
 */
export declare function useFallbackTranslation(key: string, defaultValue?: string, options?: FallbackTranslationOptions): {
    safeT: (translationKey: string, fallbackValue?: string, interpolationOptions?: any) => string;
    getTranslation: (translationKey: string, fallbackValue?: string, interpolationOptions?: any) => string;
    hasTranslation: (translationKey: string) => boolean;
    getMultipleTranslations: (keys: string[], fallbackValues?: {
        [key: string]: string;
    }) => {
        [key: string]: string;
    };
    fallbackState: FallbackTranslationState;
    resetFallbackState: () => void;
    isUsingFallback: boolean;
    currentLanguage: string;
    fallbackLanguage: string | null;
};
/**
 * Higher-order component for wrapping components with fallback translation
 */
export declare function withFallbackTranslation<T extends Record<string, any>>(Component: React.ComponentType<T & {
    fallbackTranslation: ReturnType<typeof useFallbackTranslation>;
}>, fallbackOptions?: FallbackTranslationOptions): React.ComponentType<T>;
