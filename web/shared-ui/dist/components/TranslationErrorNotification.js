import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { translationErrorHandler } from '../translation-error-handler';
import { translationLoader } from '../services/TranslationLoader';
export function TranslationErrorNotification({ language, namespaces = ['common', 'errors'], onRetry, onDismiss, onLanguageSwitch, className = '', autoRetry = true, maxAutoRetries = 2, showFallbackOptions = true, position = 'top-right' }) {
    const { t, i18n } = useTranslation('errors');
    const [loadingState, setLoadingState] = useState(translationErrorHandler.getOverallLoadingState(language));
    const [isDismissed, setIsDismissed] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [autoRetryCount, setAutoRetryCount] = useState(0);
    const [showDetails, setShowDetails] = useState(false);
    const [fallbackLanguage, setFallbackLanguage] = useState('en-US');
    // Enhanced retry function with better error handling
    const performRetry = useCallback(async (targetLanguage = language, targetNamespaces = namespaces) => {
        setIsRetrying(true);
        try {
            if (onRetry) {
                await onRetry(targetLanguage, targetNamespaces);
            }
            else {
                // Default retry logic using translation loader
                const loadPath = '/locales/{{lng}}/{{ns}}.json'; // Default path
                const results = await translationLoader.loadMultipleTranslations(targetNamespaces.map(ns => ({
                    language: targetLanguage,
                    namespace: ns,
                    loadPath,
                    cache: false // Force reload on retry
                })));
                // Check if any succeeded
                const hasSuccess = Object.values(results).some(result => result.success);
                if (!hasSuccess) {
                    throw new Error('All retry attempts failed');
                }
            }
            // Reset auto retry count on successful retry
            setAutoRetryCount(0);
        }
        catch (error) {
            console.error('Retry failed:', error);
            setAutoRetryCount(prev => prev + 1);
        }
        finally {
            setIsRetrying(false);
        }
    }, [language, namespaces, onRetry]);
    // Auto retry logic
    useEffect(() => {
        if (!autoRetry || autoRetryCount >= maxAutoRetries || !loadingState.hasError || isRetrying) {
            return;
        }
        const retryDelay = Math.min(1000 * Math.pow(2, autoRetryCount), 10000); // Max 10 seconds
        const timeoutId = setTimeout(() => {
            performRetry();
        }, retryDelay);
        return () => clearTimeout(timeoutId);
    }, [loadingState.hasError, autoRetry, autoRetryCount, maxAutoRetries, isRetrying, performRetry]);
    useEffect(() => {
        const unsubscribe = translationErrorHandler.subscribe((state) => {
            const newState = translationErrorHandler.getOverallLoadingState(language);
            setLoadingState(newState);
            // Reset dismissed state if error state changes significantly
            if (!newState.hasError && !newState.isFallbackActive) {
                setIsDismissed(false);
            }
        });
        return unsubscribe;
    }, [language]);
    const handleRetry = () => {
        performRetry();
    };
    const handleDismiss = () => {
        setIsDismissed(true);
        if (onDismiss) {
            onDismiss();
        }
    };
    const handleLanguageSwitch = (newLanguage) => {
        if (onLanguageSwitch) {
            onLanguageSwitch(newLanguage);
        }
        else {
            // Default language switch using i18n
            i18n.changeLanguage(newLanguage);
        }
        setIsDismissed(true);
    };
    const handleToggleDetails = () => {
        setShowDetails(!showDetails);
    };
    // Don't show notification if dismissed or no error/fallback
    if (isDismissed || (!loadingState.hasError && !loadingState.isFallbackActive)) {
        return null;
    }
    // Determine notification type and severity
    const notificationType = loadingState.hasError ? 'error' : 'warning';
    const isAutoRetrying = autoRetry && autoRetryCount < maxAutoRetries && loadingState.hasError;
    const canManualRetry = !isRetrying && !isAutoRetrying && loadingState.hasError;
    // Get available fallback languages
    const availableLanguages = ['en-US', 'es-ES', 'fr-FR', 'de-DE'].filter(lang => lang !== language);
    return (_jsxs("div", { className: `translation-error-notification ${notificationType} ${position} ${className}`, children: [_jsxs("div", { className: "notification-content", children: [_jsx("div", { className: "notification-icon", children: loadingState.hasError ? (_jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) })) : (_jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) })) }), _jsx("div", { className: "notification-message", children: loadingState.hasError ? (_jsxs("div", { children: [_jsx("div", { className: "notification-title", children: isAutoRetrying
                                        ? t('translation.autoRetrying', 'Auto-retrying translation load... ({{count}}/{{max}})', {
                                            count: autoRetryCount + 1,
                                            max: maxAutoRetries
                                        })
                                        : t('translation.loadFailed', 'Failed to load translations for this language.') }), (loadingState.retryCount > 0 || isRetrying) && (_jsx("div", { className: "notification-subtitle", children: isRetrying
                                        ? t('translation.retrying', 'Retrying...', { count: loadingState.retryCount })
                                        : t('translation.retryFailed', 'Retry {{count}} failed', { count: loadingState.retryCount }) })), loadingState.errorMessage && showDetails && (_jsx("div", { className: "notification-error-details", children: loadingState.errorMessage }))] })) : (_jsxs("div", { children: [_jsx("div", { className: "notification-title", children: t('translation.fallbackActive', 'Some translations are not available. Showing English as fallback.') }), loadingState.failedLanguages.length > 0 && (_jsx("div", { className: "notification-subtitle", children: t('translation.failedLanguages', 'Failed languages: {{languages}}', {
                                        languages: loadingState.failedLanguages.join(', ')
                                    }) }))] })) }), _jsxs("div", { className: "notification-actions", children: [canManualRetry && (_jsxs("button", { onClick: handleRetry, className: "retry-button", disabled: isRetrying, children: [isRetrying ? (_jsx("span", { className: "loading-spinner" })) : null, t('common.retry', 'Retry')] })), loadingState.errorMessage && (_jsx("button", { onClick: handleToggleDetails, className: "details-button", title: t('translation.toggleDetails', 'Toggle error details'), children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", style: { transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)' }, children: _jsx("path", { d: "M4.646 5.646a.5.5 0 01.708 0L8 8.293l2.646-2.647a.5.5 0 01.708.708L8.707 9 6.061 6.354a.5.5 0 010-.708z" }) }) })), _jsx("button", { onClick: handleDismiss, className: "dismiss-button", "aria-label": t('common.dismiss', 'Dismiss'), children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: _jsx("path", { d: "M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" }) }) })] })] }), showFallbackOptions && loadingState.hasError && !isAutoRetrying && (_jsxs("div", { className: "fallback-options", children: [_jsx("div", { className: "fallback-title", children: t('translation.fallbackOptions', 'Try switching to a different language:') }), _jsx("div", { className: "language-options", children: availableLanguages.slice(0, 3).map(lang => (_jsx("button", { onClick: () => handleLanguageSwitch(lang), className: "language-option", children: t(`languages.${lang}`, lang) }, lang))) })] })), _jsx("style", { children: `
        .translation-error-notification {
          position: fixed;
          max-width: 400px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
          overflow: hidden;
        }

        /* Position variants */
        .translation-error-notification.top-right {
          top: 20px;
          right: 20px;
        }

        .translation-error-notification.top-left {
          top: 20px;
          left: 20px;
        }

        .translation-error-notification.bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .translation-error-notification.bottom-left {
          bottom: 20px;
          left: 20px;
        }

        .translation-error-notification.top-center {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
        }

        /* Notification type variants */
        .translation-error-notification.error {
          border: 1px solid #fecaca;
          background: #fef2f2;
        }

        .translation-error-notification.warning {
          border: 1px solid #fed7aa;
          background: #fffbeb;
        }

        .translation-error-notification.error .notification-icon {
          color: #dc2626;
        }

        .translation-error-notification.warning .notification-icon {
          color: #d97706;
        }

        .notification-content {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          gap: 12px;
        }

        .notification-icon {
          flex-shrink: 0;
          color: #f59e0b;
        }

        .notification-message {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 4px;
        }

        .notification-subtitle {
          font-size: 12px;
          color: #6b7280;
        }

        .notification-error-details {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
          font-family: monospace;
          word-break: break-word;
        }

        .notification-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .retry-button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .retry-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .retry-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .details-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .details-button:hover {
          color: #374151;
          background: #f3f4f6;
        }

        .details-button svg {
          transition: transform 0.2s;
        }

        .dismiss-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s, background-color 0.2s;
        }

        .dismiss-button:hover {
          color: #374151;
          background: #f3f4f6;
        }

        .loading-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Fallback options */
        .fallback-options {
          border-top: 1px solid #e5e7eb;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.02);
        }

        .fallback-title {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .language-options {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .language-option {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .language-option:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* RTL support */
        [dir="rtl"] .translation-error-notification {
          right: auto;
          left: 20px;
        }

        [dir="rtl"] .notification-content {
          direction: rtl;
        }

        [dir="rtl"] @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      ` })] }));
}
export default TranslationErrorNotification;
