export interface CacheEntry {
    data: any;
    timestamp: number;
    expiresAt: number;
    accessCount: number;
    lastAccessed: number;
    size: number;
    priority: 'critical' | 'high' | 'normal' | 'low';
    namespace: string;
    language: string;
}
export interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
    criticalEntries: number;
    expiredEntries: number;
    memoryUsage: number;
}
export interface CacheConfig {
    maxSize: number;
    maxEntries: number;
    defaultTTL: number;
    criticalTTL: number;
    cleanupInterval: number;
    compressionThreshold: number;
    persistToStorage: boolean;
    storageKey: string;
}
export declare class TranslationCacheManager {
    private cache;
    private stats;
    private cleanupTimer;
    private readonly config;
    constructor(config?: Partial<CacheConfig>);
    /**
     * Get cached translation with LRU tracking
     */
    get(language: string, namespace: string): any | null;
    /**
     * Set cached translation with intelligent eviction
     */
    set(language: string, namespace: string, data: any, priority?: CacheEntry['priority']): void;
    /**
     * Preload multiple translations with priority handling
     */
    preload(requests: Array<{
        language: string;
        namespace: string;
        loader: () => Promise<any>;
        priority?: CacheEntry['priority'];
    }>): Promise<{
        [key: string]: boolean;
    }>;
    /**
     * Clear cache with selective options
     */
    clear(options?: {
        language?: string;
        namespace?: string;
        priority?: CacheEntry['priority'];
        olderThan?: number;
    }): number;
    /**
     * Get comprehensive cache statistics
     */
    getStats(): CacheStats;
    /**
     * Optimize cache by removing expired entries and compressing large ones
     */
    optimize(): {
        expiredRemoved: number;
        compressed: number;
        memoryFreed: number;
    };
    /**
     * Get cache entries for debugging
     */
    getEntries(): Array<{
        key: string;
        language: string;
        namespace: string;
        size: number;
        priority: string;
        accessCount: number;
        age: number;
        ttl: number;
    }>;
    /**
     * Destroy cache manager and cleanup resources
     */
    destroy(): void;
    private getCacheKey;
    private getTTL;
    private evictIfNecessary;
    private getTotalSize;
    private estimateMemoryUsage;
    private compressData;
    private decompressData;
    private isCompressed;
    private startCleanupTimer;
    private persistToStorage;
    private loadFromStorage;
}
export declare const translationCacheManager: TranslationCacheManager;
