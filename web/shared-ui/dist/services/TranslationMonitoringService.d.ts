import { TranslationError, TranslationPerformanceMetrics, UserFeedback } from '../types/monitoring';
export interface TranslationMonitoringConfig {
    apiEndpoint: string;
    enableErrorTracking: boolean;
    enablePerformanceTracking: boolean;
    enableUserFeedback: boolean;
    batchSize: number;
    flushInterval: number;
    maxRetries: number;
}
export declare class TranslationMonitoringService {
    private config;
    private errorQueue;
    private performanceQueue;
    private feedbackQueue;
    private flushTimer;
    constructor(config: TranslationMonitoringConfig);
    /**
     * Track translation error
     */
    trackError(error: Omit<TranslationError, 'id' | 'timestamp'>): void;
    /**
     * Track translation performance metrics
     */
    trackPerformance(metrics: Omit<TranslationPerformanceMetrics, 'id' | 'timestamp'>): void;
    /**
     * Track user feedback
     */
    trackUserFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): void;
    /**
     * Track missing translation key
     */
    trackMissingKey(key: string, namespace: string, language: string, context?: string): void;
    /**
     * Track translation loading failure
     */
    trackLoadingFailure(namespace: string, language: string, error: Error, context?: string): void;
    /**
     * Track fallback usage
     */
    trackFallbackUsage(originalLanguage: string, fallbackLanguage: string, namespace: string, context?: string): void;
    /**
     * Track language switch performance
     */
    trackLanguageSwitch(fromLanguage: string, toLanguage: string, loadTime: number, success: boolean): void;
    /**
     * Track translation loading performance
     */
    trackTranslationLoad(namespace: string, language: string, loadTime: number, cacheHit: boolean, success: boolean): void;
    /**
     * Flush all queues
     */
    flush(): Promise<void>;
    /**
     * Flush error queue
     */
    private flushErrors;
    /**
     * Flush performance queue
     */
    private flushPerformance;
    /**
     * Flush feedback queue
     */
    private flushFeedback;
    /**
     * Send data to monitoring API
     */
    private sendToAPI;
    /**
     * Start flush timer
     */
    private startFlushTimer;
    /**
     * Stop flush timer
     */
    private stopFlushTimer;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const defaultMonitoringConfig: TranslationMonitoringConfig;
export declare function initializeMonitoring(config?: Partial<TranslationMonitoringConfig>): TranslationMonitoringService;
export declare function getMonitoringService(): TranslationMonitoringService | null;
