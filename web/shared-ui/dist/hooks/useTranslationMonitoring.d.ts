export interface UseTranslationMonitoringOptions {
    trackMissingKeys?: boolean;
    trackPerformance?: boolean;
    trackLanguageSwitches?: boolean;
    namespace?: string;
}
export declare function useTranslationMonitoring(options?: UseTranslationMonitoringOptions): {
    trackMissingKey: (key: string, context?: string) => void;
    trackTranslationLoad: (loadNamespace: string, loadTime: number, cacheHit: boolean, success: boolean) => void;
    monitoringService: import("../services/TranslationMonitoringService").TranslationMonitoringService | null;
};
export default useTranslationMonitoring;
