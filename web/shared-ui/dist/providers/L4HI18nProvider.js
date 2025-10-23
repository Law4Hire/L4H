import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation, I18nextProvider } from 'react-i18next';
import { getI18nInstance, initL4HI18n, APPLICATION_CONFIGS, CULTURE_NAMES, SUPPORTED_LANGUAGES, isRTL } from '../i18n-config';
import { i18n as i18nApi } from '../api-client';
import { useTranslationErrorHandling } from '../hooks/useTranslationErrorHandling';
import TranslationErrorNotification from '../components/TranslationErrorNotification';
import { LanguageChangeNotifier, LanguageAnnouncementRegion } from '../components/LanguageChangeNotifier';
const L4HI18nContext = createContext(undefined);
export function L4HI18nProvider({ children, additionalNamespaces = [], preloadNamespaces = ['common', 'errors'], accessibility = {} }) {
    const [cultures, setCultures] = useState([]);
    const [currentCulture, setCurrentCultureState] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [i18nInitialized, setI18nInitialized] = useState(false);
    const [currentIsRTL, setCurrentIsRTL] = useState(false);
    // Get the shared i18n instance
    const i18n = getI18nInstance();
    // Use translation error handling
    const { hasErrors, isFallbackActive, retry, showNotification, dismissNotification } = useTranslationErrorHandling(currentCulture, undefined, {
        enableNotifications: true,
        enableAutoRetry: true
    });
    useEffect(() => {
        const initializeI18n = async () => {
            try {
                // Initialize i18n with L4H-specific configuration
                const initializedI18n = await initL4HI18n();
                // Load additional namespaces if specified
                if (additionalNamespaces.length > 0) {
                    await Promise.all(additionalNamespaces.map(ns => initializedI18n.loadNamespaces(ns)));
                }
                // Preload specified namespaces
                if (preloadNamespaces.length > 0) {
                    await Promise.all(preloadNamespaces.map(ns => initializedI18n.loadNamespaces(ns)));
                }
                setI18nInitialized(true);
                setCurrentCultureState(initializedI18n.language);
                // Use local culture definitions
                const supportedCultures = Object.entries(CULTURE_NAMES).map(([code, displayName]) => ({
                    code,
                    displayName
                }));
                setCultures(supportedCultures);
                // Set initial RTL state
                setCurrentIsRTL(isRTL(initializedI18n.language));
                console.info(`L4H i18n initialized with language: ${initializedI18n.language}`);
                console.info(`Loaded namespaces: ${APPLICATION_CONFIGS.l4h.namespaces.join(', ')}`);
            }
            catch (error) {
                console.error('Failed to initialize L4H i18n:', error);
                // Fallback to basic cultures
                setCultures([
                    { code: 'en-US', displayName: 'English (United States)' },
                    { code: 'es-ES', displayName: 'Español (España)' },
                    { code: 'fr-FR', displayName: 'Français (France)' },
                    { code: 'ar-SA', displayName: 'العربية (السعودية)' }
                ]);
                setCurrentCultureState('en-US');
                setCurrentIsRTL(false);
            }
            finally {
                setIsLoading(false);
            }
        };
        initializeI18n();
    }, [additionalNamespaces, preloadNamespaces]);
    // Listen for language changes and update currentCulture state
    useEffect(() => {
        const handleLanguageChange = (lng) => {
            setCurrentCultureState(lng);
            setCurrentIsRTL(isRTL(lng));
        };
        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [i18n]);
    const setCurrentCulture = async (culture) => {
        try {
            console.log('🔄 L4H: Setting culture to:', culture);
            // Change language locally first
            await i18n.changeLanguage(culture);
            console.log('✅ L4H: Language changed successfully to:', culture);
            // Save to cookie explicitly for consistency
            const setCookie = (name, value, days = 365) => {
                if (typeof document === 'undefined')
                    return;
                const expires = new Date();
                expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
                document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
            };
            setCookie('l4h-language', culture);
            console.log('🍪 L4H: Cookie saved for language:', culture);
            // Also persist to server for logged-in users
            try {
                await i18nApi.setCulture(culture);
                console.log('💾 L4H: Language preference saved to server:', culture);
            }
            catch (apiError) {
                // API call failed, but local change succeeded - continue gracefully
                console.warn('L4H: Failed to persist language preference to server:', apiError);
            }
        }
        catch (error) {
            console.error('L4H: Failed to set culture:', error);
        }
    };
    const loadNamespace = async (namespace) => {
        try {
            await i18n.loadNamespaces(namespace);
            console.info(`L4H: Loaded namespace: ${namespace}`);
        }
        catch (error) {
            console.error(`L4H: Failed to load namespace ${namespace}:`, error);
        }
    };
    const preloadNamespacesFunc = async (namespaces) => {
        try {
            await Promise.all(namespaces.map(ns => i18n.loadNamespaces(ns)));
            console.info(`L4H: Preloaded namespaces: ${namespaces.join(', ')}`);
        }
        catch (error) {
            console.error('L4H: Failed to preload namespaces:', error);
        }
    };
    const value = {
        cultures,
        currentCulture,
        setCurrentCulture,
        isLoading,
        isRTL: currentIsRTL,
        supportedLanguages: SUPPORTED_LANGUAGES,
        hasTranslationErrors: hasErrors,
        isFallbackActive,
        retryTranslations: retry,
        loadNamespace,
        preloadNamespaces: preloadNamespacesFunc
    };
    // Don't render children until i18n is initialized
    if (!i18nInitialized) {
        return _jsx("div", { children: "Loading L4H translations..." });
    }
    const { showVisualNotifications = false, announceLanguageChanges = true, notificationDuration = 3000 } = accessibility;
    return (_jsx(I18nextProvider, { i18n: i18n, children: _jsxs(L4HI18nContext.Provider, { value: value, children: [children, showNotification && (_jsx(TranslationErrorNotification, { language: currentCulture, onRetry: retry, onDismiss: dismissNotification })), _jsx(LanguageChangeNotifier, { showVisualNotification: showVisualNotifications, announceToScreenReader: announceLanguageChanges, notificationDuration: notificationDuration }), _jsx(LanguageAnnouncementRegion, {})] }) }));
}
export function useL4HI18n() {
    const context = useContext(L4HI18nContext);
    if (context === undefined) {
        throw new Error('useL4HI18n must be used within an L4HI18nProvider');
    }
    return context;
}
// Hook for using translations with L4H namespace support
export function useL4HT(namespace) {
    const { t } = useTranslation(namespace);
    return t;
}
