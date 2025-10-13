import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translationErrorHandler } from '../translation-error-handler';
export function TranslationErrorNotification({ language, onRetry, onDismiss, className = '' }) {
    const { t } = useTranslation('errors');
    const [loadingState, setLoadingState] = useState(translationErrorHandler.getOverallLoadingState(language));
    const [isDismissed, setIsDismissed] = useState(false);
    useEffect(() => {
        const unsubscribe = translationErrorHandler.subscribe((state) => {
            setLoadingState(translationErrorHandler.getOverallLoadingState(language));
        });
        return unsubscribe;
    }, [language]);
    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        }
    };
    const handleDismiss = () => {
        setIsDismissed(true);
        if (onDismiss) {
            onDismiss();
        }
    };
    // Don't show notification if dismissed or no error/fallback
    if (isDismissed || (!loadingState.hasError && !loadingState.isFallbackActive)) {
        return null;
    }
    const isRetrying = loadingState.isLoading && loadingState.retryCount > 0;
    return (_jsxs("div", { className: `translation-error-notification ${className}`, children: [_jsxs("div", { className: "notification-content", children: [_jsx("div", { className: "notification-icon", children: loadingState.hasError ? (_jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) })) : (_jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) })) }), _jsx("div", { className: "notification-message", children: loadingState.hasError ? (_jsxs("div", { children: [_jsx("div", { className: "notification-title", children: t('translation.loadFailed', 'Failed to load translations for this language.') }), loadingState.retryCount > 0 && (_jsx("div", { className: "notification-subtitle", children: isRetrying
                                        ? t('translation.retrying', 'Retrying... ({{count}})', { count: loadingState.retryCount })
                                        : t('translation.retryFailed', 'Retry {{count}} failed', { count: loadingState.retryCount }) }))] })) : (_jsxs("div", { children: [_jsx("div", { className: "notification-title", children: t('translation.fallbackActive', 'Some translations are not available. Showing English as fallback.') }), loadingState.failedLanguages.length > 0 && (_jsx("div", { className: "notification-subtitle", children: t('translation.failedLanguages', 'Failed languages: {{languages}}', {
                                        languages: loadingState.failedLanguages.join(', ')
                                    }) }))] })) }), _jsxs("div", { className: "notification-actions", children: [loadingState.hasError && !isRetrying && (_jsx("button", { onClick: handleRetry, className: "retry-button", disabled: isRetrying, children: t('common.retry', 'Retry') })), _jsx("button", { onClick: handleDismiss, className: "dismiss-button", "aria-label": t('common.dismiss', 'Dismiss'), children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: _jsx("path", { d: "M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" }) }) })] })] }), _jsx("style", { children: `
        .translation-error-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          max-width: 400px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
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
        }

        .retry-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .retry-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
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
