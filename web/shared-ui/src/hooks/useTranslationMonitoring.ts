import { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getMonitoringService } from '../services/TranslationMonitoringService';

export interface UseTranslationMonitoringOptions {
  trackMissingKeys?: boolean;
  trackPerformance?: boolean;
  trackLanguageSwitches?: boolean;
  namespace?: string;
}

export function useTranslationMonitoring(options: UseTranslationMonitoringOptions = {}) {
  const { i18n } = useTranslation();
  const monitoringService = getMonitoringService();
  const previousLanguage = useRef<string>(i18n.language);
  const languageSwitchStart = useRef<number | null>(null);

  const {
    trackMissingKeys = true,
    trackPerformance = true,
    trackLanguageSwitches = true,
    namespace,
  } = options;

  // Track missing translation keys
  const trackMissingKey = useCallback((key: string, context?: string) => {
    if (!monitoringService || !trackMissingKeys) return;

    monitoringService.trackMissingKey(
      key,
      namespace || 'unknown',
      i18n.language,
      context
    );
  }, [monitoringService, trackMissingKeys, namespace, i18n.language]);

  // Track translation loading performance
  const trackTranslationLoad = useCallback((
    loadNamespace: string,
    loadTime: number,
    cacheHit: boolean,
    success: boolean
  ) => {
    if (!monitoringService || !trackPerformance) return;

    monitoringService.trackTranslationLoad(
      loadNamespace,
      i18n.language,
      loadTime,
      cacheHit,
      success
    );
  }, [monitoringService, trackPerformance, i18n.language]);

  // Track language switch performance
  useEffect(() => {
    if (!monitoringService || !trackLanguageSwitches) return;

    const handleLanguageChanged = (lng: string) => {
      const switchTime = languageSwitchStart.current 
        ? Date.now() - languageSwitchStart.current 
        : 0;

      if (previousLanguage.current !== lng && switchTime > 0) {
        monitoringService.trackLanguageSwitch(
          previousLanguage.current,
          lng,
          switchTime,
          true
        );
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
    if (!monitoringService) return;

    const handleMissingKey = (lng: string, ns: string, key: string) => {
      if (trackMissingKeys) {
        trackMissingKey(`${ns}:${key}`, 'i18next_missing_key_handler');
      }
    };

    const handleFailedLoading = (lng: string, ns: string, msg: string) => {
      monitoringService.trackLoadingFailure(
        ns,
        lng,
        new Error(msg),
        'i18next_failed_loading_handler'
      );
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