import { translationCacheManager } from './TranslationCacheManager';
import { translationErrorHandler } from '../translation-error-handler';
export class LazyTranslationLoader {
    constructor() {
        Object.defineProperty(this, "loadingState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                isLoading: false,
                loadingNamespaces: new Set(),
                failedNamespaces: new Set(),
                loadedNamespaces: new Set(),
                queuedRequests: new Map()
            }
        });
        Object.defineProperty(this, "loadStrategies", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "intersectionObserver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "pendingBackgroundLoads", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        this.setupIntersectionObserver();
        this.setupVisibilityChangeHandler();
    }
    /**
     * Configure loading strategy for an application
     */
    setLoadStrategy(application, strategy) {
        this.loadStrategies.set(application, strategy);
    }
    /**
     * Load translation with intelligent caching and lazy loading
     */
    async loadTranslation(options) {
        const { language, namespace } = options;
        const cacheKey = `${language}:${namespace}`;
        const startTime = Date.now();
        // Check cache first
        const cachedData = translationCacheManager.get(language, namespace);
        if (cachedData) {
            return {
                success: true,
                data: cachedData,
                fromCache: true,
                loadTime: Date.now() - startTime
            };
        }
        // Check if already loading
        const existingRequest = this.loadingState.queuedRequests.get(cacheKey);
        if (existingRequest) {
            return existingRequest;
        }
        // Create loading promise
        const loadingPromise = this.performLazyLoad(options, startTime);
        this.loadingState.queuedRequests.set(cacheKey, loadingPromise);
        try {
            const result = await loadingPromise;
            return result;
        }
        finally {
            this.loadingState.queuedRequests.delete(cacheKey);
        }
    }
    /**
     * Preload critical namespaces based on strategy
     */
    async preloadCriticalNamespaces(application, language, loadPaths) {
        const strategy = this.loadStrategies.get(application);
        if (!strategy) {
            console.warn(`No load strategy defined for application: ${application}`);
            return {};
        }
        const results = {};
        // Load immediate namespaces first (critical)
        if (strategy.immediate.length > 0) {
            console.info(`Preloading immediate namespaces for ${application}:`, strategy.immediate);
            const immediatePromises = strategy.immediate.map(async (namespace) => {
                const result = await this.loadTranslation({
                    language,
                    namespace,
                    loadPaths,
                    priority: 'critical',
                    preload: true
                });
                results[namespace] = result;
                return result;
            });
            await Promise.allSettled(immediatePromises);
        }
        // Schedule background loading for background namespaces
        if (strategy.background.length > 0) {
            this.scheduleBackgroundLoading(application, language, loadPaths, strategy.background);
        }
        return results;
    }
    /**
     * Load namespace on demand with intelligent prefetching
     */
    async loadOnDemand(language, namespace, loadPaths, relatedNamespaces = []) {
        // Load the requested namespace
        const result = await this.loadTranslation({
            language,
            namespace,
            loadPaths,
            priority: 'high'
        });
        // Prefetch related namespaces in the background
        if (relatedNamespaces.length > 0 && result.success) {
            this.prefetchRelatedNamespaces(language, relatedNamespaces, loadPaths);
        }
        return result;
    }
    /**
     * Batch load multiple namespaces with priority handling
     */
    async batchLoad(requests) {
        const results = {};
        // Group by priority
        const priorityGroups = {
            critical: requests.filter(r => r.priority === 'critical'),
            high: requests.filter(r => r.priority === 'high'),
            normal: requests.filter(r => r.priority === 'normal' || !r.priority),
            low: requests.filter(r => r.priority === 'low')
        };
        // Load in priority order
        for (const [priority, group] of Object.entries(priorityGroups)) {
            if (group.length === 0)
                continue;
            console.info(`Loading ${group.length} ${priority} priority namespaces`);
            const promises = group.map(async (request) => {
                const key = `${request.language}:${request.namespace}`;
                const result = await this.loadTranslation(request);
                results[key] = result;
                return result;
            });
            // Wait for current priority group before moving to next
            if (priority === 'critical' || priority === 'high') {
                await Promise.allSettled(promises);
            }
            else {
                // For normal and low priority, don't block
                Promise.allSettled(promises);
            }
        }
        return results;
    }
    /**
     * Prefetch translations based on user behavior
     */
    prefetchForRoute(route, language, loadPaths) {
        const namespacesToPrefetch = this.getNamespacesForRoute(route);
        if (namespacesToPrefetch.length > 0) {
            console.info(`Prefetching namespaces for route ${route}:`, namespacesToPrefetch);
            namespacesToPrefetch.forEach(namespace => {
                // Only prefetch if not already loaded or loading
                const cacheKey = `${language}:${namespace}`;
                if (!this.loadingState.loadedNamespaces.has(namespace) &&
                    !this.loadingState.loadingNamespaces.has(namespace)) {
                    this.loadTranslation({
                        language,
                        namespace,
                        loadPaths,
                        priority: 'low'
                    }).catch(error => {
                        console.warn(`Failed to prefetch ${namespace} for route ${route}:`, error);
                    });
                }
            });
        }
    }
    /**
     * Setup intersection observer for lazy loading based on visibility
     */
    observeElement(element, language, namespaces, loadPaths) {
        if (!this.intersectionObserver)
            return;
        // Store metadata on the element
        element.__lazyLoadData = {
            language,
            namespaces,
            loadPaths,
            loaded: false
        };
        this.intersectionObserver.observe(element);
    }
    /**
     * Get loading state for monitoring
     */
    getLoadingState() {
        return { ...this.loadingState };
    }
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            cacheStats: translationCacheManager.getStats(),
            loadingStats: {
                totalLoaded: this.loadingState.loadedNamespaces.size,
                totalFailed: this.loadingState.failedNamespaces.size,
                currentlyLoading: this.loadingState.loadingNamespaces.size,
                queuedRequests: this.loadingState.queuedRequests.size
            }
        };
    }
    /**
     * Clear loading state and caches
     */
    reset() {
        this.loadingState.loadingNamespaces.clear();
        this.loadingState.failedNamespaces.clear();
        this.loadingState.loadedNamespaces.clear();
        this.loadingState.queuedRequests.clear();
        this.loadingState.isLoading = false;
        this.pendingBackgroundLoads.clear();
    }
    /**
     * Destroy loader and cleanup resources
     */
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        this.reset();
    }
    async performLazyLoad(options, startTime) {
        const { language, namespace, loadPaths, priority = 'normal' } = options;
        const maxRetries = options.retries ?? 3;
        const baseDelay = options.retryDelay ?? 1000;
        const timeout = options.timeout ?? 10000;
        this.loadingState.loadingNamespaces.add(namespace);
        this.loadingState.isLoading = true;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                translationErrorHandler.startLoading(language, namespace);
                const data = await this.loadFromPaths(loadPaths, language, namespace, timeout);
                // Cache the successful result
                translationCacheManager.set(language, namespace, data, priority);
                // Update state
                this.loadingState.loadingNamespaces.delete(namespace);
                this.loadingState.loadedNamespaces.add(namespace);
                this.loadingState.failedNamespaces.delete(namespace);
                if (this.loadingState.loadingNamespaces.size === 0) {
                    this.loadingState.isLoading = false;
                }
                translationErrorHandler.recordSuccess(language, namespace);
                return {
                    success: true,
                    data,
                    loadTime: Date.now() - startTime,
                    retryCount: attempt
                };
            }
            catch (error) {
                lastError = error;
                translationErrorHandler.recordError(language, namespace, lastError);
                if (attempt === maxRetries)
                    break;
                // Exponential backoff with jitter
                const delay = baseDelay * Math.pow(2, attempt);
                const jitter = Math.random() * 0.1 * delay;
                await this.sleep(delay + jitter);
            }
        }
        // Mark as failed
        this.loadingState.loadingNamespaces.delete(namespace);
        this.loadingState.failedNamespaces.add(namespace);
        if (this.loadingState.loadingNamespaces.size === 0) {
            this.loadingState.isLoading = false;
        }
        return {
            success: false,
            error: lastError || new Error(`Failed to load ${language}/${namespace}`),
            loadTime: Date.now() - startTime,
            retryCount: maxRetries
        };
    }
    async loadFromPaths(loadPaths, language, namespace, timeout) {
        let lastError = null;
        for (const loadPath of loadPaths) {
            try {
                const url = this.buildUrl(loadPath, language, namespace);
                const data = await this.fetchWithTimeout(url, timeout);
                return data;
            }
            catch (error) {
                lastError = error;
                continue;
            }
        }
        throw lastError || new Error(`All load paths failed for ${language}/${namespace}`);
    }
    async fetchWithTimeout(url, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (typeof data !== 'object' || data === null) {
                throw new Error('Invalid translation data format');
            }
            return data;
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    buildUrl(loadPath, language, namespace) {
        return loadPath
            .replace('{{lng}}', language)
            .replace('{{ns}}', namespace);
    }
    scheduleBackgroundLoading(application, language, loadPaths, namespaces) {
        // Use requestIdleCallback if available, otherwise setTimeout
        const scheduleCallback = (callback) => {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(callback, { timeout: 5000 });
            }
            else {
                setTimeout(callback, 100);
            }
        };
        namespaces.forEach(namespace => {
            const key = `${language}:${namespace}`;
            if (this.pendingBackgroundLoads.has(key))
                return;
            this.pendingBackgroundLoads.add(key);
            scheduleCallback(() => {
                this.loadTranslation({
                    language,
                    namespace,
                    loadPaths,
                    priority: 'low'
                }).finally(() => {
                    this.pendingBackgroundLoads.delete(key);
                });
            });
        });
    }
    prefetchRelatedNamespaces(language, namespaces, loadPaths) {
        namespaces.forEach(namespace => {
            // Only prefetch if not already loaded
            if (!translationCacheManager.get(language, namespace)) {
                this.loadTranslation({
                    language,
                    namespace,
                    loadPaths,
                    priority: 'low'
                }).catch(error => {
                    console.warn(`Failed to prefetch related namespace ${namespace}:`, error);
                });
            }
        });
    }
    getNamespacesForRoute(route) {
        // Route-based namespace mapping
        const routeNamespaceMap = {
            '/interview': ['interview', 'forms'],
            '/dashboard': ['dashboard', 'common'],
            '/pricing': ['pricing', 'common'],
            '/visa-library': ['visa-library', 'common'],
            '/legal': ['legal', 'forms'],
            '/billing': ['billing', 'forms'],
            '/clients': ['clients', 'forms'],
            '/cases': ['cases', 'legal']
        };
        for (const [pattern, namespaces] of Object.entries(routeNamespaceMap)) {
            if (route.includes(pattern)) {
                return namespaces;
            }
        }
        return ['common']; // Default fallback
    }
    setupIntersectionObserver() {
        if (typeof IntersectionObserver === 'undefined')
            return;
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const lazyLoadData = element.__lazyLoadData;
                    if (lazyLoadData && !lazyLoadData.loaded) {
                        lazyLoadData.loaded = true;
                        lazyLoadData.namespaces.forEach((namespace) => {
                            this.loadTranslation({
                                language: lazyLoadData.language,
                                namespace,
                                loadPaths: lazyLoadData.loadPaths,
                                priority: 'low'
                            }).catch(error => {
                                console.warn(`Failed to lazy load ${namespace}:`, error);
                            });
                        });
                        this.intersectionObserver?.unobserve(entry.target);
                    }
                }
            });
        }, {
            rootMargin: '50px', // Start loading 50px before element comes into view
            threshold: 0.1
        });
    }
    setupVisibilityChangeHandler() {
        if (typeof document === 'undefined')
            return;
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Resume background loading when page becomes visible
                console.info('Page became visible, resuming background translation loading');
            }
            else {
                // Pause non-critical loading when page is hidden
                console.info('Page became hidden, pausing non-critical translation loading');
            }
        });
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// Global lazy loader instance
export const lazyTranslationLoader = new LazyTranslationLoader();
// Configure default load strategies
lazyTranslationLoader.setLoadStrategy('l4h', {
    immediate: ['common', 'errors'],
    onDemand: ['interview', 'dashboard'],
    background: ['visa-library', 'pricing'],
    lazy: ['forms', 'auth']
});
lazyTranslationLoader.setLoadStrategy('cannlaw', {
    immediate: ['common', 'errors', 'auth'],
    onDemand: ['legal', 'clients'],
    background: ['billing', 'cases'],
    lazy: ['forms']
});
lazyTranslationLoader.setLoadStrategy('shared', {
    immediate: ['common', 'errors'],
    onDemand: ['forms'],
    background: ['auth'],
    lazy: []
});
