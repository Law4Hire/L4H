export interface NetworkOptimizationConfig {
    enableOptimization: boolean;
    maxConcurrentRequests: number;
    requestTimeout: number;
    retryAttempts: number;
    retryDelay: number;
    enableRequestDeduplication: boolean;
    enableRequestBatching: boolean;
    batchDelay: number;
    enableCompression: boolean;
    enableCaching: boolean;
    cacheHeaders: boolean;
    enablePrefetch: boolean;
    prefetchThreshold: number;
}
export interface RequestMetrics {
    url: string;
    startTime: number;
    endTime: number;
    duration: number;
    size: number;
    fromCache: boolean;
    compressed: boolean;
    retryCount: number;
    success: boolean;
    error?: string;
}
export interface NetworkPerformance {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLoadTime: number;
    totalBytesTransferred: number;
    compressionSavings: number;
    cacheHitRate: number;
    concurrentRequestsAvg: number;
    retryRate: number;
}
export interface BatchRequest {
    url: string;
    options: RequestInit;
    resolve: (response: Response) => void;
    reject: (error: Error) => void;
    timestamp: number;
    priority: number;
}
export declare class TranslationNetworkOptimizer {
    private config;
    private activeRequests;
    private requestQueue;
    private batchTimer;
    private metrics;
    private concurrentRequests;
    private requestCache;
    constructor(config?: Partial<NetworkOptimizationConfig>);
    /**
     * Optimized fetch with deduplication, queuing, and retry logic
     */
    optimizedFetch(url: string, options?: RequestInit, priority?: number): Promise<Response>;
    /**
     * Batch multiple requests together
     */
    batchRequests(requests: Array<{
        url: string;
        options?: RequestInit;
        priority?: number;
    }>): Promise<Response[]>;
    /**
     * Prefetch translations based on usage patterns
     */
    prefetchTranslations(urls: string[], options?: RequestInit): Promise<void>;
    /**
     * Get network performance metrics
     */
    getPerformanceMetrics(): NetworkPerformance;
    /**
     * Clear metrics and cache
     */
    clearMetrics(): void;
    /**
     * Get current network status
     */
    getNetworkStatus(): {
        isOnline: boolean;
        concurrentRequests: number;
        queuedRequests: number;
        cacheSize: number;
        activeRequests: number;
    };
    /**
     * Destroy optimizer and cleanup resources
     */
    destroy(): void;
    private executeOptimizedRequest;
    private executeWithRetry;
    private executeConcurrentRequests;
    private waitForAvailableSlot;
    private scheduleBatchExecution;
    private executeBatch;
    private getRequestKey;
    private getCachedResponse;
    private cacheResponse;
    private getResponseSize;
    private isCompressed;
    private recordMetrics;
    private calculateAverageConcurrency;
    private sleep;
}
export declare const translationNetworkOptimizer: TranslationNetworkOptimizer;
