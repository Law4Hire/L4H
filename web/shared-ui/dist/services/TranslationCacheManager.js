export class TranslationCacheManager {
    constructor(config = {}) {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "stats", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                hits: 0,
                misses: 0,
                evictions: 0,
                compressions: 0
            }
        });
        Object.defineProperty(this, "cleanupTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.config = {
            maxSize: 50 * 1024 * 1024, // 50MB default
            maxEntries: 1000,
            defaultTTL: 30 * 60 * 1000, // 30 minutes
            criticalTTL: 2 * 60 * 60 * 1000, // 2 hours for critical namespaces
            cleanupInterval: 5 * 60 * 1000, // 5 minutes
            compressionThreshold: 10 * 1024, // 10KB
            persistToStorage: true,
            storageKey: 'l4h-translation-cache',
            ...config
        };
        this.startCleanupTimer();
        this.loadFromStorage();
    }
    /**
     * Get cached translation with LRU tracking
     */
    get(language, namespace) {
        const key = this.getCacheKey(language, namespace);
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        // Check if expired
        if (entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        // Update access tracking for LRU
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.stats.hits++;
        return this.decompressData(entry.data);
    }
    /**
     * Set cached translation with intelligent eviction
     */
    set(language, namespace, data, priority = 'normal') {
        const key = this.getCacheKey(language, namespace);
        const now = Date.now();
        const serializedData = JSON.stringify(data);
        const size = new Blob([serializedData]).size;
        // Compress large entries
        const finalData = size > this.config.compressionThreshold
            ? this.compressData(data)
            : data;
        const ttl = this.getTTL(namespace, priority);
        const entry = {
            data: finalData,
            timestamp: now,
            expiresAt: now + ttl,
            accessCount: 1,
            lastAccessed: now,
            size,
            priority,
            namespace,
            language
        };
        // Check if we need to evict entries
        this.evictIfNecessary(size);
        this.cache.set(key, entry);
        this.persistToStorage();
    }
    /**
     * Preload multiple translations with priority handling
     */
    async preload(requests) {
        const results = {};
        // Sort by priority (critical first)
        const sortedRequests = requests.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
            return priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal'];
        });
        // Load in batches to avoid overwhelming the system
        const batchSize = 5;
        for (let i = 0; i < sortedRequests.length; i += batchSize) {
            const batch = sortedRequests.slice(i, i + batchSize);
            await Promise.allSettled(batch.map(async (request) => {
                const key = this.getCacheKey(request.language, request.namespace);
                try {
                    // Check if already cached
                    if (this.get(request.language, request.namespace)) {
                        results[key] = true;
                        return;
                    }
                    const data = await request.loader();
                    this.set(request.language, request.namespace, data, request.priority);
                    results[key] = true;
                }
                catch (error) {
                    console.warn(`Failed to preload ${key}:`, error);
                    results[key] = false;
                }
            }));
        }
        return results;
    }
    /**
     * Clear cache with selective options
     */
    clear(options) {
        let clearedCount = 0;
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            let shouldClear = false;
            if (options?.language && entry.language !== options.language)
                continue;
            if (options?.namespace && entry.namespace !== options.namespace)
                continue;
            if (options?.priority && entry.priority !== options.priority)
                continue;
            if (options?.olderThan && (now - entry.timestamp) < options.olderThan)
                continue;
            if (!options ||
                (options.language && entry.language === options.language) ||
                (options.namespace && entry.namespace === options.namespace) ||
                (options.priority && entry.priority === options.priority) ||
                (options.olderThan && (now - entry.timestamp) >= options.olderThan)) {
                shouldClear = true;
            }
            if (shouldClear) {
                this.cache.delete(key);
                clearedCount++;
            }
        }
        if (clearedCount > 0) {
            this.persistToStorage();
        }
        return clearedCount;
    }
    /**
     * Get comprehensive cache statistics
     */
    getStats() {
        const now = Date.now();
        let totalSize = 0;
        let criticalEntries = 0;
        let expiredEntries = 0;
        for (const entry of this.cache.values()) {
            totalSize += entry.size;
            if (entry.priority === 'critical')
                criticalEntries++;
            if (entry.expiresAt < now)
                expiredEntries++;
        }
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
        const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;
        return {
            totalEntries: this.cache.size,
            totalSize,
            hitRate,
            missRate,
            evictionCount: this.stats.evictions,
            criticalEntries,
            expiredEntries,
            memoryUsage: this.estimateMemoryUsage()
        };
    }
    /**
     * Optimize cache by removing expired entries and compressing large ones
     */
    optimize() {
        const initialSize = this.getTotalSize();
        let expiredRemoved = 0;
        let compressed = 0;
        const now = Date.now();
        // Remove expired entries
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt < now) {
                this.cache.delete(key);
                expiredRemoved++;
            }
        }
        // Compress large uncompressed entries
        for (const [key, entry] of this.cache.entries()) {
            if (entry.size > this.config.compressionThreshold && !this.isCompressed(entry.data)) {
                const compressedData = this.compressData(entry.data);
                entry.data = compressedData;
                compressed++;
                this.stats.compressions++;
            }
        }
        const finalSize = this.getTotalSize();
        const memoryFreed = initialSize - finalSize;
        this.persistToStorage();
        return {
            expiredRemoved,
            compressed,
            memoryFreed
        };
    }
    /**
     * Get cache entries for debugging
     */
    getEntries() {
        const now = Date.now();
        return Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            language: entry.language,
            namespace: entry.namespace,
            size: entry.size,
            priority: entry.priority,
            accessCount: entry.accessCount,
            age: now - entry.timestamp,
            ttl: entry.expiresAt - now
        }));
    }
    /**
     * Destroy cache manager and cleanup resources
     */
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.cache.clear();
    }
    getCacheKey(language, namespace) {
        return `${language}:${namespace}`;
    }
    getTTL(namespace, priority) {
        // Critical namespaces get longer TTL
        if (priority === 'critical' || ['common', 'errors', 'auth'].includes(namespace)) {
            return this.config.criticalTTL;
        }
        return this.config.defaultTTL;
    }
    evictIfNecessary(newEntrySize) {
        const currentSize = this.getTotalSize();
        const wouldExceedSize = currentSize + newEntrySize > this.config.maxSize;
        const wouldExceedEntries = this.cache.size >= this.config.maxEntries;
        if (!wouldExceedSize && !wouldExceedEntries) {
            return;
        }
        // Calculate how much we need to free
        const targetSize = this.config.maxSize * 0.8; // Free to 80% capacity
        const sizeToFree = Math.max(0, currentSize + newEntrySize - targetSize);
        const entriesToFree = Math.max(0, this.cache.size - this.config.maxEntries + 1);
        // Get entries sorted by eviction priority (LRU with priority consideration)
        const entries = Array.from(this.cache.entries())
            .map(([key, entry]) => ({ key, entry }))
            .sort((a, b) => {
            // Never evict critical entries unless absolutely necessary
            if (a.entry.priority === 'critical' && b.entry.priority !== 'critical')
                return 1;
            if (b.entry.priority === 'critical' && a.entry.priority !== 'critical')
                return -1;
            // Sort by last accessed time (LRU)
            return a.entry.lastAccessed - b.entry.lastAccessed;
        });
        let freedSize = 0;
        let freedEntries = 0;
        for (const { key, entry } of entries) {
            if (freedSize >= sizeToFree && freedEntries >= entriesToFree) {
                break;
            }
            // Don't evict critical entries unless we absolutely have to
            if (entry.priority === 'critical' && freedSize < sizeToFree * 0.5) {
                continue;
            }
            this.cache.delete(key);
            freedSize += entry.size;
            freedEntries++;
            this.stats.evictions++;
        }
    }
    getTotalSize() {
        let total = 0;
        for (const entry of this.cache.values()) {
            total += entry.size;
        }
        return total;
    }
    estimateMemoryUsage() {
        // Rough estimate of memory usage including overhead
        return this.getTotalSize() * 1.5; // 50% overhead estimate
    }
    compressData(data) {
        // Unicode-safe compression using JSON + base64
        try {
            const jsonString = JSON.stringify(data);
            // Use TextEncoder for Unicode support, then convert to base64
            const bytes = new TextEncoder().encode(jsonString);
            // Convert bytes to base64 using binary string approach
            const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
            return `compressed:${btoa(binString)}`;
        }
        catch (error) {
            console.warn('Failed to compress data:', error);
            return data;
        }
    }
    decompressData(data) {
        if (typeof data === 'string' && data.startsWith('compressed:')) {
            try {
                const compressed = data.substring('compressed:'.length);
                const binString = atob(compressed);
                // Convert binary string back to bytes
                const bytes = Uint8Array.from(binString, (char) => char.codePointAt(0));
                // Use TextDecoder for Unicode support
                const jsonString = new TextDecoder().decode(bytes);
                return JSON.parse(jsonString);
            }
            catch (error) {
                console.warn('Failed to decompress data:', error);
                return data;
            }
        }
        return data;
    }
    isCompressed(data) {
        return typeof data === 'string' && data.startsWith('compressed:');
    }
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.optimize();
        }, this.config.cleanupInterval);
    }
    persistToStorage() {
        if (!this.config.persistToStorage || typeof localStorage === 'undefined') {
            return;
        }
        try {
            // Only persist critical and high priority entries to avoid storage bloat
            const criticalEntries = {};
            for (const [key, entry] of this.cache.entries()) {
                if (entry.priority === 'critical' || entry.priority === 'high') {
                    criticalEntries[key] = entry;
                }
            }
            localStorage.setItem(this.config.storageKey, JSON.stringify({
                entries: criticalEntries,
                timestamp: Date.now()
            }));
        }
        catch (error) {
            console.warn('Failed to persist cache to storage:', error);
        }
    }
    loadFromStorage() {
        if (!this.config.persistToStorage || typeof localStorage === 'undefined') {
            return;
        }
        try {
            const stored = localStorage.getItem(this.config.storageKey);
            if (!stored)
                return;
            const { entries, timestamp } = JSON.parse(stored);
            const age = Date.now() - timestamp;
            // Don't load if stored data is too old (more than 24 hours)
            if (age > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(this.config.storageKey);
                return;
            }
            // Load entries that haven't expired
            const now = Date.now();
            for (const [key, entry] of Object.entries(entries)) {
                if (entry.expiresAt > now) {
                    this.cache.set(key, entry);
                }
            }
            console.info(`Loaded ${this.cache.size} cached translations from storage`);
        }
        catch (error) {
            console.warn('Failed to load cache from storage:', error);
            // Clear corrupted storage
            try {
                localStorage.removeItem(this.config.storageKey);
            }
            catch { }
        }
    }
}
// Global cache manager instance
export const translationCacheManager = new TranslationCacheManager();
