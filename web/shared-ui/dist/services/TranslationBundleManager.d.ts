export interface BundleConfig {
    enableBundling: boolean;
    enableCompression: boolean;
    compressionThreshold: number;
    maxBundleSize: number;
    bundleStrategy: 'namespace' | 'priority' | 'size' | 'hybrid';
    preloadBundles: string[];
    networkOptimization: boolean;
    parallelRequests: number;
    requestTimeout: number;
    retryStrategy: 'exponential' | 'linear' | 'immediate';
}
export interface Bundle {
    id: string;
    namespaces: string[];
    languages: string[];
    size: number;
    compressed: boolean;
    priority: 'critical' | 'high' | 'normal' | 'low';
    url: string;
    checksum?: string;
    version: string;
    dependencies: string[];
}
export interface BundleLoadResult {
    bundleId: string;
    success: boolean;
    loadTime: number;
    size: number;
    fromCache: boolean;
    error?: Error;
    translations: {
        [key: string]: any;
    };
}
export interface NetworkStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalBytesLoaded: number;
    averageLoadTime: number;
    cacheHitRate: number;
    compressionRatio: number;
}
export declare class TranslationBundleManager {
    private config;
    private bundles;
    private loadingBundles;
    private loadedBundles;
    private networkStats;
    private requestQueue;
    private activeRequests;
    constructor(config?: Partial<BundleConfig>);
    /**
     * Register a bundle configuration
     */
    registerBundle(bundle: Bundle): void;
    /**
     * Load a specific bundle
     */
    loadBundle(bundleId: string, language: string): Promise<BundleLoadResult>;
    /**
     * Load multiple bundles with dependency resolution
     */
    loadBundles(bundleIds: string[], language: string): Promise<{
        [bundleId: string]: BundleLoadResult;
    }>;
    /**
     * Preload critical bundles
     */
    preloadCriticalBundles(language: string): Promise<void>;
    /**
     * Get translations from a loaded bundle
     */
    getBundleTranslations(bundleId: string, language: string): {
        [key: string]: any;
    };
    /**
     * Create optimized bundles based on strategy
     */
    createOptimizedBundles(namespaces: string[], languages: string[], loadPaths: string[]): Bundle[];
    /**
     * Optimize network requests with queuing and batching
     */
    optimizedFetch(url: string, options?: RequestInit): Promise<Response>;
    /**
     * Get network performance statistics
     */
    getNetworkStats(): NetworkStats;
    /**
     * Get bundle information
     */
    getBundleInfo(): Array<{
        id: string;
        namespaces: string[];
        size: string;
        priority: string;
        loaded: boolean;
        compressed: boolean;
    }>;
    /**
     * Clear bundle cache
     */
    clearBundleCache(): void;
    /**
     * Destroy bundle manager
     */
    destroy(): void;
    private performBundleLoad;
    private initializeBundles;
    private resolveDependencies;
    private groupBundlesByPriority;
    private createNamespaceBundles;
    private createPriorityBundles;
    private createSizeBundles;
    private createHybridBundles;
    private getNamespacePriority;
    private estimateNamespaceSize;
    private buildBundleUrl;
    private decompressBundle;
    private validateBundleData;
    private processQueue;
    private updateNetworkStats;
    private formatSize;
}
export declare const translationBundleManager: TranslationBundleManager;
