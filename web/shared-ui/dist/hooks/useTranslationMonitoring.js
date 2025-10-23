import { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getMonitoringService } from '../services/TranslationMonitoringService';
export function useTranslationMonitoring(options = {}) {
    const { i18n } = useTranslation();
    const monitoringService = getMonitoringService();
    const previousLanguage = useRef(i18n.language);
    const languageSwitchStart = useRef(null);
    const { trackMissingKeys = true, trackPerformance = true, trackLanguageSwitches = true, namespace, } = options;
    // Track missing translation keys
    const trackMissingKey = useCallback((key, context) => {
        if (!monitoringService || !trackMissingKeys)
            return;
        monitoringService.trackMissingKey(key, namespace || 'unknown', i18n.language, context);
    }, [monitoringService, trackMissingKeys, namespace, i18n.language]);
    // Track translation loading performance
    const trackTranslationLoad = useCallback((loadNamespace, loadTime, cacheHit, success) => {
        if (!monitoringService || !trackPerformance)
            return;
        monitoringService.trackTranslationLoad(loadNamespace, i18n.language, loadTime, cacheHit, success);
    }, [monitoringService, trackPerformance, i18n.language]);
    // Track language switch performance
    useEffect(() => {
        if (!monitoringService || !trackLanguageSwitches)
            return;
        const handleLanguageChanged = (lng) => {
            const switchTime = languageSwitchStart.current
                ? Date.now() - languageSwitchStart.current
                : 0;
            if (previousLanguage.current !== lng && switchTime > 0) {
                monitoringService.trackLanguageSwitch(previousLanguage.current, lng, switchTime, true);
            }
            previousLanguage.current = lng;
            languageSwitchStart.current = null;
        };
        const handleLanguageChanging = () => {
            languageSwitchStart.current = Date.now();
        };
        i18n.on('languageChanged', handleLanguageChanged);
        i18n.on('languageChanging', handleLanguageChanging);
        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
            i18n.off('languageChanging', handleLanguageChanging);
        };
    }, [i18n, monitoringService, trackLanguageSwitches]);
    // Track translation loading errors
    useEffect(() => {
        if (!monitoringService)
            return;
        const handleMissingKey = (lng, ns, key) => {
            if (trackMissingKeys) {
                trackMissingKey(`${ns}:${key}`, 'i18next_missing_key_handler');
            }
        };
        const handleFailedLoading = (lng, ns, msg) => {
            monitoringService.trackLoadingFailure(ns, lng, new Error(msg), 'i18next_failed_loading_handler');
        };
        i18n.on('missingKey', handleMissingKey);
        i18n.on('failedLoading', handleFailedLoading);
        return () => {
            i18n.off('missingKey', handleMissingKey);
            i18n.off('failedLoading', handleFailedLoading);
        };
    }, [i18n, monitoringService, trackMissingKeys, trackMissingKey]);
    return {
        trackMissingKey,
        trackTranslationLoad,
        monitoringService,
    };
}
export default useTranslationMonitoring;
