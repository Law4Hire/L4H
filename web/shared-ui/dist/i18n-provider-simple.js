import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { CULTURE_NAMES, SUPPORTED_LANGUAGES, isRTL } from './i18n-simple';
const I18nContext = createContext(undefined);
export function I18nProvider({ children }) {
    const [currentCulture, setCurrentCultureState] = useState(i18n.language);
    const [isLoading, setIsLoading] = useState(false);
    const [currentIsRTL, setCurrentIsRTL] = useState(isRTL(i18n.language));
    // Create cultures list
    const cultures = Object.entries(CULTURE_NAMES).map(([code, displayName]) => ({
        code,
        displayName
    }));
    // Listen for language changes
    useEffect(() => {
        const handleLanguageChange = (lng) => {
            console.log('📱 Provider received language change:', lng);
            setCurrentCultureState(lng);
            setCurrentIsRTL(isRTL(lng));
        };
        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, []);
    const setCurrentCulture = async (culture) => {
        console.log('🎯 Setting culture to:', culture);
        setIsLoading(true);
        try {
            await i18n.changeLanguage(culture);
            console.log('✅ Language change successful');
        }
        catch (error) {
            console.error('❌ Failed to change language:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const value = {
        cultures,
        currentCulture,
        setCurrentCulture,
        isLoading,
        isRTL: currentIsRTL,
        supportedLanguages: SUPPORTED_LANGUAGES,
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
// Re-export useTranslation
export { useTranslation } from 'react-i18next';
