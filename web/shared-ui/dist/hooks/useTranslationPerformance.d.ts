import type { PerformanceAlert } from '../services/TranslationPerformanceMonitor';
export interface UseTranslationPerformanceOptions {
    enableRealTimeMonitoring?: boolean;
    alertThreshold?: 'low' | 'medium' | 'high' | 'critical';
    updateInterval?: number;
    autoOptimize?: boolean;
    optimizationInterval?: number;
}
export interface TranslationPerformanceState {
    isInitialized: boolean;
    isLoading: boolean;
    status: any;
    alerts: PerformanceAlert[];
    metrics: any;
    recommendations: string[];
    error: string | null;
}
export interface TranslationPerformanceActions {
    initialize: (application: 'l4h' | 'cannlaw' | 'shared', language: string, loadPaths: string[]) => Promise<void>;
    optimize: () => Promise<void>;
    reset: () => Promise<void>;
    generateReport: () => any;
    clearAlerts: () => void;
    refreshStatus: () => void;
}
export declare function useTranslationPerformance(options?: UseTranslationPerformanceOptions): [TranslationPerformanceState, TranslationPerformanceActions];
export declare function useTranslationPerformanceBasic(): {
    metrics: any;
    isHealthy: boolean;
    cacheHitRate: any;
    averageLoadTime: any;
    errorRate: any;
    alertCount: any;
    overallScore: any;
};
export declare function useTranslationPerformanceAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): {
    alerts: PerformanceAlert[];
    alertCount: number;
    hasAlerts: boolean;
    clearAlerts: () => void;
    dismissAlert: (alertId: string) => void;
};
