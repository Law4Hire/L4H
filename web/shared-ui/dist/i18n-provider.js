import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation, I18nextProvider } from 'react-i18next';
import i18n, { CULTURE_NAMES, i18nReady } from './i18n-enhanced';
const I18nContext = createContext(undefined);
export function I18nProvider({ children }) {
    const [cultures, setCultures] = useState([]);
    const [currentCulture, setCurrentCultureState] = useState(i18n.language);
    const [isLoading, setIsLoading] = useState(true);
    // Use the explicitly imported i18n instance instead of getting it from useTranslation
    // I18nProvider initialization - shared i18n instance is now properly connected
    useEffect(() => {
        const initializeI18n = async () => {
            try {
                // Wait for i18n to be ready
                await i18nReady;
                // Use local culture definitions instead of API calls
                const supportedCultures = Object.entries(CULTURE_NAMES).map(([code, displayName]) => ({
                    code,
                    displayName
                }));
                setCultures(supportedCultures);
            }
            catch (error) {
                console.error('Failed to initialize i18n:', error);
                // Fallback to basic cultures
                setCultures([
                    { code: 'en-US', displayName: 'English (United States)' },
                    { code: 'es-ES', displayName: 'Español (España)' },
                    { code: 'ar-SA', displayName: 'العربية (السعودية)' }
                ]);
            }
            finally {
                setIsLoading(false);
            }
        };
        initializeI18n();
    }, []);
    // Listen for language changes and update currentCulture state
    useEffect(() => {
        const handleLanguageChange = (lng) => {
            setCurrentCultureState(lng);
        };
        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, []);
    const setCurrentCulture = async (culture) => {
        try {
            // Just change the language locally, no API calls
            await i18n.changeLanguage(culture);
        }
        catch (error) {
            console.error('Failed to set culture:', error);
        }
    };
    const value = {
        cultures,
        currentCulture,
        setCurrentCulture,
        isLoading
    };
    return (_jsx(I18nextProvider, { i18n: i18n, children: _jsx(I18nContext.Provider, { value: value, children: children }) }));
}
export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
// Hook for using translations with namespace support
export function useT(namespace) {
    const { t } = useTranslation(namespace);
    return t;
}
// Re-export useTranslation that's properly connected to our shared i18n instance
export { useTranslation } from 'react-i18next';
