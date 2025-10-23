import { CacheEntry } from './TranslationCacheManager';
export interface LazyLoadOptions {
    language: string;
    namespace: string;
    loadPaths: string[];
    priority?: CacheEntry['priority'];
    preload?: boolean;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
export interface LazyLoadResult {
    success: boolean;
    data?: any;
    fromCache?: boolean;
    loadTime?: number;
    error?: Error;
    retryCount?: number;
}
export interface NamespaceLoadStrategy {
    immediate: string[];
    onDemand: string[];
    background: string[];
    lazy: string[];
}
export interface LoadingState {
    isLoading: boolean;
    loadingNamespaces: Set<string>;
    failedNamespaces: Set<string>;
    loadedNamespaces: Set<string>;
    queuedRequests: Map<string, Promise<LazyLoadResult>>;
}
export declare class LazyTranslationLoader {
    private loadingState;
    private loadStrategies;
    private intersectionObserver;
    private pendingBackgroundLoads;
    constructor();
    /**
     * Configure loading strategy for an application
     */
    setLoadStrategy(application: string, strategy: NamespaceLoadStrategy): void;
    /**
     * Load translation with intelligent caching and lazy loading
     */
    loadTranslation(options: LazyLoadOptions): Promise<LazyLoadResult>;
    /**
     * Preload critical namespaces based on strategy
     */
    preloadCriticalNamespaces(application: string, language: string, loadPaths: string[]): Promise<{
        [namespace: string]: LazyLoadResult;
    }>;
    /**
     * Load namespace on demand with intelligent prefetching
     */
    loadOnDemand(language: string, namespace: string, loadPaths: string[], relatedNamespaces?: string[]): Promise<LazyLoadResult>;
    /**
     * Batch load multiple namespaces with priority handling
     */
    batchLoad(requests: LazyLoadOptions[]): Promise<{
        [key: string]: LazyLoadResult;
    }>;
    /**
     * Prefetch translations based on user behavior
     */
    prefetchForRoute(route: string, language: string, loadPaths: string[]): void;
    /**
     * Setup intersection observer for lazy loading based on visibility
     */
    observeElement(element: Element, language: string, namespaces: string[], loadPaths: string[]): void;
    /**
     * Get loading state for monitoring
     */
    getLoadingState(): LoadingState;
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): {
        cacheStats: any;
        loadingStats: {
            totalLoaded: number;
            totalFailed: number;
            currentlyLoading: number;
            queuedRequests: number;
        };
    };
    /**
     * Clear loading state and caches
     */
    reset(): void;
    /**
     * Destroy loader and cleanup resources
     */
    destroy(): void;
    private performLazyLoad;
    private loadFromPaths;
    private fetchWithTimeout;
    private buildUrl;
    private scheduleBackgroundLoading;
    private prefetchRelatedNamespaces;
    private getNamespacesForRoute;
    private setupIntersectionObserver;
    private setupVisibilityChangeHandler;
    private sleep;
}
export declare const lazyTranslationLoader: LazyTranslationLoader;
