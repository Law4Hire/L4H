export interface TranslationLoadOptions {
    language: string;
    namespace: string;
    loadPath: string;
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    cache?: boolean;
    priority?: 'critical' | 'high' | 'normal' | 'low';
    offline?: boolean;
}
export interface TranslationCache {
    [key: string]: {
        data: any;
        timestamp: number;
        expiresAt: number;
    };
}
export interface LoadResult {
    success: boolean;
    data?: any;
    error?: Error;
    fromCache?: boolean;
    fromOffline?: boolean;
    retryCount?: number;
    loadTime?: number;
}
export declare class TranslationLoader {
    private cache;
    private loadingPromises;
    private readonly defaultOptions;
    /**
     * Load translation with enhanced caching, lazy loading, and offline support
     */
    loadTranslation(options: TranslationLoadOptions): Promise<LoadResult>;
    /**
     * Preload critical namespaces for faster initial loading
     */
    preloadNamespaces(language: string, namespaces: string[], loadPath: string): Promise<{
        [namespace: string]: LoadResult;
    }>;
    /**
     * Load multiple translations with enhanced performance optimization
     */
    loadMultipleTranslations(requests: TranslationLoadOptions[], priorityNamespaces?: string[]): Promise<{
        [key: string]: LoadResult;
    }>;
    /**
     * Clear cache for specific language/namespace or all
     */
    clearCache(language?: string, namespace?: string): void;
    /**
     * Get comprehensive cache statistics for monitoring
     */
    getCacheStats(): {
        totalEntries: number;
        cacheHitRate: number;
        expiredEntries: number;
        cacheSize: number;
        enhancedCacheStats: any;
    };
    /**
     * Cleanup expired cache entries
     */
    cleanupExpiredCache(): void;
    private performLoadWithRetry;
    private performSingleLoad;
    private buildLoadUrl;
    private getCacheKey;
    private getCachedTranslation;
    private cacheTranslation;
    private sleep;
}
export declare const translationLoader: TranslationLoader;
