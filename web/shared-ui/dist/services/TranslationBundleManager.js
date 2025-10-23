import { translationCacheManager } from './TranslationCacheManager';
import { translationErrorHandler } from '../translation-error-handler';
export class TranslationBundleManager {
    constructor(config = {}) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "bundles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "loadingBundles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "loadedBundles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "networkStats", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalBytesLoaded: 0,
                averageLoadTime: 0,
                cacheHitRate: 0,
                compressionRatio: 0
            }
        });
        Object.defineProperty(this, "requestQueue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "activeRequests", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.config = {
            enableBundling: true,
            enableCompression: true,
            compressionThreshold: 5 * 1024, // 5KB
            maxBundleSize: 100 * 1024, // 100KB
            bundleStrategy: 'hybrid',
            preloadBundles: [],
            networkOptimization: true,
            parallelRequests: 4,
            requestTimeout: 15000,
            retryStrategy: 'exponential',
            ...config
        };
        this.initializeBundles();
    }
    /**
     * Register a bundle configuration
     */
    registerBundle(bundle) {
        this.bundles.set(bundle.id, bundle);
        console.info(`Registered bundle: ${bundle.id} (${bundle.namespaces.join(', ')})`);
    }
    /**
     * Load a specific bundle
     */
    async loadBundle(bundleId, language) {
        const bundle = this.bundles.get(bundleId);
        if (!bundle) {
            throw new Error(`Bundle not found: ${bundleId}`);
        }
        const cacheKey = `${bundleId}:${language}`;
        // Check if already loading
        const existingLoad = this.loadingBundles.get(cacheKey);
        if (existingLoad) {
            return existingLoad;
        }
        // Check if already loaded
        if (this.loadedBundles.has(cacheKey)) {
            return {
                bundleId,
                success: true,
                loadTime: 0,
                size: bundle.size,
                fromCache: true,
                translations: this.getBundleTranslations(bundleId, language)
            };
        }
        // Create loading promise
        const loadingPromise = this.performBundleLoad(bundle, language);
        this.loadingBundles.set(cacheKey, loadingPromise);
        try {
            const result = await loadingPromise;
            if (result.success) {
                this.loadedBundles.add(cacheKey);
            }
            return result;
        }
        finally {
            this.loadingBundles.delete(cacheKey);
        }
    }
    /**
     * Load multiple bundles with dependency resolution
     */
    async loadBundles(bundleIds, language) {
        const results = {};
        // Resolve dependencies
        const resolvedBundles = this.resolveDependencies(bundleIds);
        // Group by priority
        const priorityGroups = this.groupBundlesByPriority(resolvedBundles);
        // Load in priority order
        for (const [priority, bundles] of Object.entries(priorityGroups)) {
            if (bundles.length === 0)
                continue;
            console.info(`Loading ${bundles.length} ${priority} priority bundles`);
            const promises = bundles.map(async (bundleId) => {
                const result = await this.loadBundle(bundleId, language);
                results[bundleId] = result;
                return result;
            });
            // Wait for critical and high priority bundles
            if (priority === 'critical' || priority === 'high') {
                await Promise.allSettled(promises);
            }
            else {
                // Don't block for normal and low priority
                Promise.allSettled(promises);
            }
        }
        return results;
    }
    /**
     * Preload critical bundles
     */
    async preloadCriticalBundles(language) {
        if (this.config.preloadBundles.length === 0)
            return;
        console.info(`Preloading critical bundles: ${this.config.preloadBundles.join(', ')}`);
        const preloadPromises = this.config.preloadBundles.map(bundleId => this.loadBundle(bundleId, language).catch(error => {
            console.warn(`Failed to preload bundle ${bundleId}:`, error);
            return null;
        }));
        await Promise.allSettled(preloadPromises);
    }
    /**
     * Get translations from a loaded bundle
     */
    getBundleTranslations(bundleId, language) {
        const bundle = this.bundles.get(bundleId);
        if (!bundle)
            return {};
        const translations = {};
        for (const namespace of bundle.namespaces) {
            const data = translationCacheManager.get(language, namespace);
            if (data) {
                translations[namespace] = data;
            }
        }
        return translations;
    }
    /**
     * Create optimized bundles based on strategy
     */
    createOptimizedBundles(namespaces, languages, loadPaths) {
        const bundles = [];
        switch (this.config.bundleStrategy) {
            case 'namespace':
                bundles.push(...this.createNamespaceBundles(namespaces, languages));
                break;
            case 'priority':
                bundles.push(...this.createPriorityBundles(namespaces, languages));
                break;
            case 'size':
                bundles.push(...this.createSizeBundles(namespaces, languages));
                break;
            case 'hybrid':
                bundles.push(...this.createHybridBundles(namespaces, languages));
                break;
        }
        // Register all created bundles
        bundles.forEach(bundle => this.registerBundle(bundle));
        return bundles;
    }
    /**
     * Optimize network requests with queuing and batching
     */
    async optimizedFetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            const request = async () => {
                this.activeRequests++;
                this.networkStats.totalRequests++;
                try {
                    const startTime = Date.now();
                    const response = await fetch(url, {
                        ...options,
                        signal: AbortSignal.timeout(this.config.requestTimeout)
                    });
                    const loadTime = Date.now() - startTime;
                    this.updateNetworkStats(loadTime, response.ok);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    resolve(response);
                }
                catch (error) {
                    this.networkStats.failedRequests++;
                    reject(error);
                }
                finally {
                    this.activeRequests--;
                    this.processQueue();
                }
            };
            // Queue request if at capacity
            if (this.config.networkOptimization &&
                this.activeRequests >= this.config.parallelRequests) {
                this.requestQueue.push(request);
            }
            else {
                request();
            }
        });
    }
    /**
     * Get network performance statistics
     */
    getNetworkStats() {
        return { ...this.networkStats };
    }
    /**
     * Get bundle information
     */
    getBundleInfo() {
        return Array.from(this.bundles.values()).map(bundle => ({
            id: bundle.id,
            namespaces: bundle.namespaces,
            size: this.formatSize(bundle.size),
            priority: bundle.priority,
            loaded: this.loadedBundles.has(bundle.id),
            compressed: bundle.compressed
        }));
    }
    /**
     * Clear bundle cache
     */
    clearBundleCache() {
        this.loadedBundles.clear();
        this.loadingBundles.clear();
        console.info('Bundle cache cleared');
    }
    /**
     * Destroy bundle manager
     */
    destroy() {
        this.bundles.clear();
        this.loadedBundles.clear();
        this.loadingBundles.clear();
        this.requestQueue.length = 0;
    }
    async performBundleLoad(bundle, language) {
        const startTime = Date.now();
        try {
            // Build bundle URL
            const url = this.buildBundleUrl(bundle, language);
            // Load bundle data
            const response = await this.optimizedFetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate, br'
                }
            });
            let data = await response.json();
            // Decompress if needed
            if (bundle.compressed) {
                data = this.decompressBundle(data);
            }
            // Validate bundle structure
            this.validateBundleData(data, bundle);
            // Store individual translations in cache
            const translations = {};
            for (const namespace of bundle.namespaces) {
                if (data[namespace]) {
                    translationCacheManager.set(language, namespace, data[namespace], bundle.priority);
                    translations[namespace] = data[namespace];
                }
            }
            const loadTime = Date.now() - startTime;
            const size = JSON.stringify(data).length;
            this.networkStats.totalBytesLoaded += size;
            this.networkStats.successfulRequests++;
            return {
                bundleId: bundle.id,
                success: true,
                loadTime,
                size,
                fromCache: false,
                translations
            };
        }
        catch (error) {
            const loadTime = Date.now() - startTime;
            translationErrorHandler.recordError(language, bundle.id, error);
            return {
                bundleId: bundle.id,
                success: false,
                loadTime,
                size: 0,
                fromCache: false,
                error: error,
                translations: {}
            };
        }
    }
    initializeBundles() {
        // Create default bundles for common patterns
        const defaultBundles = [
            {
                id: 'critical',
                namespaces: ['common', 'errors'],
                languages: [],
                size: 0,
                compressed: false,
                priority: 'critical',
                url: '/bundles/critical.json',
                version: '1.0.0',
                dependencies: []
            },
            {
                id: 'auth',
                namespaces: ['auth', 'forms'],
                languages: [],
                size: 0,
                compressed: false,
                priority: 'high',
                url: '/bundles/auth.json',
                version: '1.0.0',
                dependencies: ['critical']
            },
            {
                id: 'l4h-core',
                namespaces: ['interview', 'dashboard'],
                languages: [],
                size: 0,
                compressed: false,
                priority: 'normal',
                url: '/bundles/l4h-core.json',
                version: '1.0.0',
                dependencies: ['critical']
            },
            {
                id: 'cannlaw-core',
                namespaces: ['legal', 'clients'],
                languages: [],
                size: 0,
                compressed: false,
                priority: 'normal',
                url: '/bundles/cannlaw-core.json',
                version: '1.0.0',
                dependencies: ['critical', 'auth']
            }
        ];
        defaultBundles.forEach(bundle => this.registerBundle(bundle));
    }
    resolveDependencies(bundleIds) {
        const resolved = [];
        const visited = new Set();
        const resolve = (bundleId) => {
            if (visited.has(bundleId))
                return;
            visited.add(bundleId);
            const bundle = this.bundles.get(bundleId);
            if (!bundle)
                return;
            // Resolve dependencies first
            bundle.dependencies.forEach(depId => resolve(depId));
            // Add this bundle
            if (!resolved.includes(bundleId)) {
                resolved.push(bundleId);
            }
        };
        bundleIds.forEach(resolve);
        return resolved;
    }
    groupBundlesByPriority(bundleIds) {
        const groups = {
            critical: [],
            high: [],
            normal: [],
            low: []
        };
        bundleIds.forEach(bundleId => {
            const bundle = this.bundles.get(bundleId);
            if (bundle) {
                groups[bundle.priority].push(bundleId);
            }
        });
        return groups;
    }
    createNamespaceBundles(namespaces, languages) {
        return namespaces.map(namespace => ({
            id: `ns-${namespace}`,
            namespaces: [namespace],
            languages,
            size: 0,
            compressed: false,
            priority: this.getNamespacePriority(namespace),
            url: `/bundles/ns-${namespace}.json`,
            version: '1.0.0',
            dependencies: []
        }));
    }
    createPriorityBundles(namespaces, languages) {
        const priorityGroups = {
            critical: namespaces.filter(ns => this.getNamespacePriority(ns) === 'critical'),
            high: namespaces.filter(ns => this.getNamespacePriority(ns) === 'high'),
            normal: namespaces.filter(ns => this.getNamespacePriority(ns) === 'normal'),
            low: namespaces.filter(ns => this.getNamespacePriority(ns) === 'low')
        };
        return Object.entries(priorityGroups)
            .filter(([, nss]) => nss.length > 0)
            .map(([priority, nss]) => ({
            id: `priority-${priority}`,
            namespaces: nss,
            languages,
            size: 0,
            compressed: false,
            priority: priority,
            url: `/bundles/priority-${priority}.json`,
            version: '1.0.0',
            dependencies: priority === 'critical' ? [] : ['priority-critical']
        }));
    }
    createSizeBundles(namespaces, languages) {
        // This would require actual size analysis - simplified for now
        const bundles = [];
        let currentBundle = [];
        let currentSize = 0;
        namespaces.forEach(namespace => {
            const estimatedSize = this.estimateNamespaceSize(namespace);
            if (currentSize + estimatedSize > this.config.maxBundleSize && currentBundle.length > 0) {
                bundles.push({
                    id: `size-${bundles.length}`,
                    namespaces: [...currentBundle],
                    languages,
                    size: currentSize,
                    compressed: currentSize > this.config.compressionThreshold,
                    priority: 'normal',
                    url: `/bundles/size-${bundles.length}.json`,
                    version: '1.0.0',
                    dependencies: []
                });
                currentBundle = [];
                currentSize = 0;
            }
            currentBundle.push(namespace);
            currentSize += estimatedSize;
        });
        // Add remaining bundle
        if (currentBundle.length > 0) {
            bundles.push({
                id: `size-${bundles.length}`,
                namespaces: currentBundle,
                languages,
                size: currentSize,
                compressed: currentSize > this.config.compressionThreshold,
                priority: 'normal',
                url: `/bundles/size-${bundles.length}.json`,
                version: '1.0.0',
                dependencies: []
            });
        }
        return bundles;
    }
    createHybridBundles(namespaces, languages) {
        // Combine priority and size strategies
        const priorityBundles = this.createPriorityBundles(namespaces, languages);
        // Split large bundles by size
        const optimizedBundles = [];
        priorityBundles.forEach(bundle => {
            if (bundle.size > this.config.maxBundleSize) {
                const sizeBundles = this.createSizeBundles(bundle.namespaces, languages);
                optimizedBundles.push(...sizeBundles);
            }
            else {
                optimizedBundles.push(bundle);
            }
        });
        return optimizedBundles;
    }
    getNamespacePriority(namespace) {
        const priorityMap = {
            'common': 'critical',
            'errors': 'critical',
            'auth': 'high',
            'forms': 'high',
            'interview': 'normal',
            'dashboard': 'normal',
            'legal': 'normal',
            'clients': 'normal',
            'visa-library': 'low',
            'pricing': 'low',
            'billing': 'low',
            'cases': 'low'
        };
        return priorityMap[namespace] || 'normal';
    }
    estimateNamespaceSize(namespace) {
        // Rough estimates - in production you'd analyze actual files
        const sizeMap = {
            'common': 5000,
            'errors': 3000,
            'auth': 2000,
            'forms': 4000,
            'interview': 8000,
            'dashboard': 6000,
            'legal': 10000,
            'clients': 7000,
            'visa-library': 15000,
            'pricing': 3000,
            'billing': 8000,
            'cases': 12000
        };
        return sizeMap[namespace] || 5000;
    }
    buildBundleUrl(bundle, language) {
        return bundle.url.replace('{{lng}}', language);
    }
    decompressBundle(data) {
        // Simple decompression - in production use proper compression library
        if (typeof data === 'string' && data.startsWith('compressed:')) {
            try {
                const compressed = data.substring('compressed:'.length);
                const jsonString = atob(compressed);
                return JSON.parse(jsonString);
            }
            catch (error) {
                console.warn('Failed to decompress bundle:', error);
                return data;
            }
        }
        return data;
    }
    validateBundleData(data, bundle) {
        if (typeof data !== 'object' || data === null) {
            throw new Error('Invalid bundle data format');
        }
        // Check that all expected namespaces are present
        for (const namespace of bundle.namespaces) {
            if (!data[namespace]) {
                console.warn(`Missing namespace ${namespace} in bundle ${bundle.id}`);
            }
        }
    }
    processQueue() {
        if (this.requestQueue.length === 0 ||
            this.activeRequests >= this.config.parallelRequests) {
            return;
        }
        const request = this.requestQueue.shift();
        if (request) {
            request();
        }
    }
    updateNetworkStats(loadTime, success) {
        if (success) {
            this.networkStats.successfulRequests++;
        }
        // Update average load time
        const totalRequests = this.networkStats.successfulRequests + this.networkStats.failedRequests;
        this.networkStats.averageLoadTime =
            (this.networkStats.averageLoadTime * (totalRequests - 1) + loadTime) / totalRequests;
    }
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
}
// Global bundle manager instance
export const translationBundleManager = new TranslationBundleManager();
