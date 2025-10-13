import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { translationErrorHandler } from '../translation-error-handler';
export function useTranslationErrorHandling(language, namespace, options = {}) {
    const { i18n: i18nInstance } = useTranslation();
    const currentLanguage = language || i18nInstance.language;
    const currentNamespace = namespace || 'common';
    const { enableNotifications = true, enableAutoRetry = true, maxAutoRetries = 3, retryDelay = 1000 } = options;
    const [state, setState] = useState(() => ({
        loadingState: translationErrorHandler.getLoadingState(currentLanguage, currentNamespace),
        isRetrying: false,
        canRetry: true,
        showNotification: false
    }));
    const [notificationDismissed, setNotificationDismissed] = useState(false);
    // Update state when loading state changes
    useEffect(() => {
        const updateState = () => {
            const loadingState = namespace
                ? translationErrorHandler.getLoadingState(currentLanguage, currentNamespace)
                : translationErrorHandler.getOverallLoadingState(currentLanguage);
            setState(prevState => ({
                ...prevState,
                loadingState,
                canRetry: loadingState.retryCount < maxAutoRetries,
                showNotification: enableNotifications &&
                    !notificationDismissed &&
                    (loadingState.hasError || loadingState.isFallbackActive)
            }));
        };
        const unsubscribe = translationErrorHandler.subscribe(updateState);
        updateState(); // Initial update
        return unsubscribe;
    }, [currentLanguage, currentNamespace, namespace, enableNotifications, notificationDismissed, maxAutoRetries]);
    // Listen for i18n events
    useEffect(() => {
        const handleLoadingStart = (lng, ns) => {
            if (lng === currentLanguage && (!namespace || ns === currentNamespace)) {
                translationErrorHandler.startLoading(lng, ns);
            }
        };
        const handleLoadingSuccess = (lng, ns) => {
            if (lng === currentLanguage && (!namespace || ns === currentNamespace)) {
                translationErrorHandler.recordSuccess(lng, ns);
            }
        };
        const handleLoadingError = (lng, ns, msg) => {
            if (lng === currentLanguage && (!namespace || ns === currentNamespace)) {
                const error = new Error(msg || 'Translation loading failed');
                translationErrorHandler.recordError(lng, ns, error);
            }
        };
        // Listen to i18n events
        i18nInstance.on('loaded', handleLoadingSuccess);
        i18nInstance.on('failedLoading', handleLoadingError);
        return () => {
            i18nInstance.off('loaded', handleLoadingSuccess);
            i18nInstance.off('failedLoading', handleLoadingError);
        };
    }, [currentLanguage, currentNamespace, namespace, i18nInstance]);
    // Manual retry function
    const retry = useCallback(async () => {
        if (!state.canRetry || state.isRetrying) {
            return false;
        }
        setState(prevState => ({ ...prevState, isRetrying: true }));
        try {
            const success = await translationErrorHandler.retryLoading(currentLanguage, currentNamespace, async (lang, ns) => {
                // Force reload the namespace
                await i18nInstance.reloadResources(lang, ns);
            });
            setState(prevState => ({ ...prevState, isRetrying: false }));
            return success;
        }
        catch (error) {
            setState(prevState => ({ ...prevState, isRetrying: false }));
            return false;
        }
    }, [currentLanguage, currentNamespace, state.canRetry, state.isRetrying, i18nInstance]);
    // Dismiss notification
    const dismissNotification = useCallback(() => {
        setNotificationDismissed(true);
        setState(prevState => ({ ...prevState, showNotification: false }));
    }, []);
    // Reset notification dismissed state when language changes
    useEffect(() => {
        setNotificationDismissed(false);
    }, [currentLanguage]);
    // Get error statistics
    const getErrorStats = useCallback(() => {
        return translationErrorHandler.getErrorStats();
    }, []);
    // Check if a specific translation key exists
    const hasTranslation = useCallback((key, ns) => {
        try {
            const translation = i18nInstance.t(key, { ns: ns || currentNamespace, lng: currentLanguage });
            return translation !== key && translation !== '';
        }
        catch {
            return false;
        }
    }, [i18nInstance, currentLanguage, currentNamespace]);
    // Get fallback translation
    const getFallbackTranslation = useCallback((key, ns) => {
        try {
            return i18nInstance.t(key, {
                ns: ns || currentNamespace,
                lng: 'en-US',
                fallbackLng: 'en-US'
            });
        }
        catch {
            return null;
        }
    }, [i18nInstance, currentNamespace]);
    return {
        // State
        ...state,
        // Actions
        retry,
        dismissNotification,
        // Utilities
        getErrorStats,
        hasTranslation,
        getFallbackTranslation,
        // Computed properties
        hasErrors: state.loadingState.hasError,
        isFallbackActive: state.loadingState.isFallbackActive,
        failedLanguages: state.loadingState.failedLanguages,
        retryCount: state.loadingState.retryCount
    };
}
// Hook for global translation error state (across all languages/namespaces)
export function useGlobalTranslationErrorState() {
    const [errorStats, setErrorStats] = useState(() => translationErrorHandler.getErrorStats());
    useEffect(() => {
        const updateStats = () => {
            setErrorStats(translationErrorHandler.getErrorStats());
        };
        const unsubscribe = translationErrorHandler.subscribe(updateStats);
        // Update stats periodically
        const interval = setInterval(updateStats, 30000); // Every 30 seconds
        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);
    const clearAllErrors = useCallback(() => {
        translationErrorHandler.clearErrors();
        setErrorStats(translationErrorHandler.getErrorStats());
    }, []);
    return {
        errorStats,
        clearAllErrors,
        hasGlobalErrors: errorStats.totalErrors > 0,
        recentErrorCount: errorStats.recentErrors.length
    };
}
