export interface PerformanceMetric {
    id: string;
    timestamp: number;
    operation: 'load' | 'cache_hit' | 'cache_miss' | 'network_request' | 'bundle_load' | 'compression' | 'decompression';
    language: string;
    namespace: string;
    duration: number;
    size: number;
    success: boolean;
    fromCache: boolean;
    fromOffline: boolean;
    retryCount: number;
    error?: string;
    metadata?: {
        [key: string]: any;
    };
}
export interface PerformanceReport {
    timeRange: {
        start: number;
        end: number;
    };
    totalOperations: number;
    successRate: number;
    averageLoadTime: number;
    cacheHitRate: number;
    offlineHitRate: number;
    networkEfficiency: number;
    compressionSavings: number;
    topSlowOperations: PerformanceMetric[];
    languagePerformance: {
        [language: string]: LanguagePerformance;
    };
    namespacePerformance: {
        [namespace: string]: NamespacePerformance;
    };
    recommendations: string[];
}
export interface LanguagePerformance {
    language: string;
    totalOperations: number;
    averageLoadTime: number;
    successRate: number;
    cacheHitRate: number;
    totalSize: number;
}
export interface NamespacePerformance {
    namespace: string;
    totalOperations: number;
    averageLoadTime: number;
    successRate: number;
    cacheHitRate: number;
    totalSize: number;
    priority: string;
}
export interface PerformanceThresholds {
    maxLoadTime: number;
    minCacheHitRate: number;
    maxRetryRate: number;
    maxErrorRate: number;
    minCompressionRatio: number;
}
export interface PerformanceAlert {
    id: string;
    timestamp: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'slow_load' | 'high_error_rate' | 'low_cache_hit' | 'high_retry_rate' | 'large_bundle';
    message: string;
    metric: PerformanceMetric;
    threshold: number;
    actualValue: number;
    suggestions: string[];
}
export declare class TranslationPerformanceMonitor {
    private metrics;
    private alerts;
    private thresholds;
    private isMonitoring;
    private monitoringInterval;
    private alertCallbacks;
    constructor(thresholds?: Partial<PerformanceThresholds>);
    /**
     * Start performance monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Record a performance metric
     */
    recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void;
    /**
     * Generate comprehensive performance report
     */
    generateReport(timeRangeMs?: number): PerformanceReport;
    /**
     * Get current performance metrics
     */
    getCurrentMetrics(): {
        activeOperations: number;
        recentAverageLoadTime: number;
        recentCacheHitRate: number;
        recentErrorRate: number;
        alertCount: number;
    };
    /**
     * Get performance alerts
     */
    getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[];
    /**
     * Clear old alerts
     */
    clearAlerts(olderThanMs?: number): number;
    /**
     * Subscribe to performance alerts
     */
    onAlert(callback: (alert: PerformanceAlert) => void): () => void;
    /**
     * Export metrics for external analysis
     */
    exportMetrics(format?: 'json' | 'csv'): string;
    /**
     * Clear all metrics and alerts
     */
    clearData(): void;
    /**
     * Get system resource usage
     */
    getResourceUsage(): {
        memoryUsage: number;
        cacheSize: number;
        networkRequests: number;
        compressionRatio: number;
    };
    private setupPerformanceHooks;
    private analyzePerformance;
    private checkThresholds;
    private checkPerformanceTrends;
    private getRecentMetrics;
    private calculateNetworkEfficiency;
    private calculateCompressionSavings;
    private calculateLanguagePerformance;
    private calculateNamespacePerformance;
    private generateRecommendations;
    private getEmptyReport;
    private exportToCsv;
    private groupBy;
    private getNamespacePriority;
    private generateMetricId;
    private generateAlertId;
    private notifyAlertCallbacks;
}
export declare const translationPerformanceMonitor: TranslationPerformanceMonitor;
