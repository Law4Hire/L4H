export interface TranslationError {
    language: string;
    namespace: string;
    error: Error;
    timestamp: Date;
    retryCount: number;
}
export interface TranslationLoadingState {
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string;
    isFallbackActive: boolean;
    failedLanguages: string[];
    retryCount: number;
}
export interface TranslationErrorHandlerOptions {
    maxRetries: number;
    retryDelay: number;
    enableLogging: boolean;
    enableUserNotifications: boolean;
    fallbackLanguage: string;
}
export declare class TranslationErrorHandler {
    private errors;
    private loadingStates;
    private retryTimeouts;
    private options;
    private listeners;
    constructor(options?: Partial<TranslationErrorHandlerOptions>);
    /**
     * Record a translation loading error
     */
    recordError(language: string, namespace: string, error: Error): void;
    /**
     * Record successful translation loading
     */
    recordSuccess(language: string, namespace: string): void;
    /**
     * Start loading state for a translation
     */
    startLoading(language: string, namespace: string): void;
    /**
     * Get current loading state for a language/namespace combination
     */
    getLoadingState(language: string, namespace: string): TranslationLoadingState;
    /**
     * Get overall loading state (aggregated across all namespaces for a language)
     */
    getOverallLoadingState(language: string): TranslationLoadingState;
    /**
     * Manually retry loading for a specific language/namespace
     */
    retryLoading(language: string, namespace: string, loadFunction: (lang: string, ns: string) => Promise<any>): Promise<boolean>;
    /**
     * Get error statistics for monitoring
     */
    getErrorStats(): {
        totalErrors: number;
        errorsByLanguage: Record<string, number>;
        errorsByNamespace: Record<string, number>;
        recentErrors: TranslationError[];
    };
    /**
     * Subscribe to loading state changes
     */
    subscribe(listener: (state: TranslationLoadingState) => void): () => void;
    /**
     * Clear all error history (useful for testing or reset)
     */
    clearErrors(): void;
    private createInitialState;
    private updateLoadingState;
    private getRetryCount;
    private scheduleRetry;
    private activateFallback;
    private logErrorMetrics;
    private sendToMonitoringService;
}
export declare const translationErrorHandler: TranslationErrorHandler;
