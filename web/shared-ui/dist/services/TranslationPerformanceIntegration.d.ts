export interface PerformanceConfig {
    enableCaching: boolean;
    enableLazyLoading: boolean;
    enableOfflineSupport: boolean;
    enableBundling: boolean;
    enableNetworkOptimization: boolean;
    enableCompression: boolean;
    enablePerformanceMonitoring: boolean;
    preloadCriticalNamespaces: boolean;
    optimizeForMobile: boolean;
    debugMode: boolean;
}
export interface InitializationResult {
    success: boolean;
    enabledFeatures: string[];
    warnings: string[];
    errors: string[];
    performanceBaseline: {
        cacheSize: number;
        bundlesLoaded: number;
        compressionRatio: number;
        networkRequests: number;
    };
}
export declare class TranslationPerformanceIntegration {
    private config;
    private initialized;
    private initializationPromise;
    constructor(config?: Partial<PerformanceConfig>);
    /**
     * Initialize all performance optimization systems
     */
    initialize(application: 'l4h' | 'cannlaw' | 'shared', language: string, loadPaths: string[]): Promise<InitializationResult>;
    /**
     * Get comprehensive performance status
     */
    getPerformanceStatus(): {
        caching: any;
        lazyLoading: any;
        offline: any;
        bundling: any;
        network: any;
        compression: any;
        monitoring: any;
        overall: {
            healthy: boolean;
            score: number;
            recommendations: string[];
        };
    };
    /**
     * Optimize performance based on current conditions
     */
    optimizePerformance(): Promise<{
        optimizationsApplied: string[];
        performanceImprovement: number;
        recommendations: string[];
    }>;
    /**
     * Generate performance report
     */
    generatePerformanceReport(): {
        summary: any;
        detailed: any;
        recommendations: string[];
        alerts: any[];
    };
    /**
     * Reset all performance systems
     */
    reset(): Promise<void>;
    /**
     * Destroy all performance systems
     */
    destroy(): void;
    private performInitialization;
    private calculateOverallHealth;
    private generateRecommendations;
    private applyMobileOptimizations;
    private isMobileDevice;
}
export declare const translationPerformanceIntegration: TranslationPerformanceIntegration;
