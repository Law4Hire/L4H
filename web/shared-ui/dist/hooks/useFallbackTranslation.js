import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { translationErrorHandler } from '../translation-error-handler';
/**
 * Hook for handling translation fallbacks with graceful degradation
 */
export function useFallbackTranslation(key, defaultValue, options = {}) {
    const { t, i18n } = useTranslation();
    const [fallbackState, setFallbackState] = useState({
        isFallbackActive: false,
        fallbackLanguage: null,
        originalLanguage: i18n.language,
        hasError: false
    });
    const { fallbackLanguage = 'en-US', fallbackNamespace, enableGracefulDegradation = true, showFallbackNotification = true } = options;
    /**
     * Get translation with fallback logic
     */
    const getTranslation = useCallback((translationKey, fallbackValue, interpolationOptions) => {
        try {
            // Try primary translation
            const primaryTranslation = t(translationKey, interpolationOptions);
            // Convert to string and check if we got the key back (indicating missing translation)
            const translationString = String(primaryTranslation);
            if (translationString === translationKey || translationString === '') {
                throw new Error(`Missing translation for key: ${translationKey}`);
            }
            // Reset fallback state if translation succeeded
            if (fallbackState.isFallbackActive) {
                setFallbackState(prev => ({
                    ...prev,
                    isFallbackActive: false,
                    fallbackLanguage: null,
                    hasError: false,
                    errorMessage: undefined
                }));
            }
            return translationString;
        }
        catch (error) {
            if (!enableGracefulDegradation) {
                throw error;
            }
            // Try fallback language if different from current
            if (i18n.language !== fallbackLanguage) {
                try {
                    const fallbackTranslation = i18n.getFixedT(fallbackLanguage, fallbackNamespace)(translationKey, interpolationOptions);
                    const fallbackString = String(fallbackTranslation);
                    if (fallbackString && fallbackString !== translationKey) {
                        setFallbackState({
                            isFallbackActive: true,
                            fallbackLanguage,
                            originalLanguage: i18n.language,
                            hasError: true,
                            errorMessage: error instanceof Error ? error.message : 'Translation failed'
                        });
                        return fallbackString;
                    }
                }
                catch (fallbackError) {
                    console.warn('Fallback translation also failed:', fallbackError);
                }
            }
            // Last resort: use provided default or extract readable text from key
            const lastResort = fallbackValue ||
                defaultValue ||
                extractReadableFromKey(translationKey);
            setFallbackState({
                isFallbackActive: true,
                fallbackLanguage: null,
                originalLanguage: i18n.language,
                hasError: true,
                errorMessage: error instanceof Error ? error.message : 'Translation failed'
            });
            return lastResort;
        }
    }, [t, i18n, fallbackLanguage, fallbackNamespace, enableGracefulDegradation, fallbackState.isFallbackActive]);
    /**
     * Safe translation function that always returns a string
     */
    const safeT = useCallback((translationKey, fallbackValue, interpolationOptions) => {
        return getTranslation(translationKey, fallbackValue, interpolationOptions);
    }, [getTranslation]);
    /**
     * Check if a translation key exists
     */
    const hasTranslation = useCallback((translationKey) => {
        try {
            const translation = t(translationKey);
            return translation !== translationKey && translation !== '';
        }
        catch {
            return false;
        }
    }, [t]);
    /**
     * Get multiple translations with fallback
     */
    const getMultipleTranslations = useCallback((keys, fallbackValues) => {
        const results = {};
        keys.forEach(key => {
            results[key] = getTranslation(key, fallbackValues?.[key], undefined);
        });
        return results;
    }, [getTranslation]);
    /**
     * Reset fallback state
     */
    const resetFallbackState = useCallback(() => {
        setFallbackState({
            isFallbackActive: false,
            fallbackLanguage: null,
            originalLanguage: i18n.language,
            hasError: false
        });
    }, [i18n.language]);
    // Monitor translation error handler for global state changes
    useEffect(() => {
        const unsubscribe = translationErrorHandler.subscribe((errorState) => {
            if (errorState.isFallbackActive && !fallbackState.isFallbackActive) {
                setFallbackState(prev => ({
                    ...prev,
                    isFallbackActive: true,
                    hasError: errorState.hasError,
                    errorMessage: errorState.errorMessage
                }));
            }
        });
        return unsubscribe;
    }, [fallbackState.isFallbackActive]);
    // Reset state when language changes
    useEffect(() => {
        if (i18n.language !== fallbackState.originalLanguage) {
            setFallbackState(prev => ({
                ...prev,
                originalLanguage: i18n.language,
                isFallbackActive: false,
                hasError: false,
                errorMessage: undefined
            }));
        }
    }, [i18n.language, fallbackState.originalLanguage]);
    return {
        // Translation functions
        safeT,
        getTranslation,
        hasTranslation,
        getMultipleTranslations,
        // State
        fallbackState,
        // Actions
        resetFallbackState,
        // Computed properties
        isUsingFallback: fallbackState.isFallbackActive,
        currentLanguage: i18n.language,
        fallbackLanguage: fallbackState.fallbackLanguage
    };
}
/**
 * Extract readable text from a translation key
 */
function extractReadableFromKey(key) {
    // Split by dots and take the last part
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];
    // Convert camelCase or snake_case to readable text
    return lastPart
        .replace(/([A-Z])/g, ' $1') // camelCase
        .replace(/_/g, ' ') // snake_case
        .replace(/^./, str => str.toUpperCase()) // capitalize first letter
        .trim();
}
/**
 * Higher-order component for wrapping components with fallback translation
 */
export function withFallbackTranslation(Component, fallbackOptions) {
    return function FallbackTranslationWrapper(props) {
        const fallbackTranslation = useFallbackTranslation('', undefined, fallbackOptions);
        return React.createElement(Component, {
            ...props,
            fallbackTranslation
        });
    };
}
