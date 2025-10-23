export class TranslationNetworkOptimizer {
    constructor(config = {}) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "activeRequests", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "requestQueue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "batchTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "metrics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "concurrentRequests", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "requestCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.config = {
            enableOptimization: true,
            maxConcurrentRequests: 6,
            requestTimeout: 15000,
            retryAttempts: 3,
            retryDelay: 1000,
            enableRequestDeduplication: true,
            enableRequestBatching: false, // Disabled by default for translations
            batchDelay: 50,
            enableCompression: true,
            enableCaching: true,
            cacheHeaders: true,
            enablePrefetch: false,
            prefetchThreshold: 0.8,
            ...config
        };
    }
    /**
     * Optimized fetch with deduplication, queuing, and retry logic
     */
    async optimizedFetch(url, options = {}, priority = 0) {
        if (!this.config.enableOptimization) {
            return fetch(url, options);
        }
        const requestKey = this.getRequestKey(url, options);
        // Check for duplicate requests
        if (this.config.enableRequestDeduplication) {
            const existingRequest = this.activeRequests.get(requestKey);
            if (existingRequest) {
                console.info(`Deduplicating request: ${url}`);
                return existingRequest.then(response => response.clone());
            }
        }
        // Check cache
        if (this.config.enableCaching) {
            const cached = this.getCachedResponse(requestKey);
            if (cached) {
                console.info(`Serving from cache: ${url}`);
                return cached.clone();
            }
        }
        // Create optimized request
        const requestPromise = this.executeOptimizedRequest(url, options, priority);
        if (this.config.enableRequestDeduplication) {
            this.activeRequests.set(requestKey, requestPromise);
        }
        try {
            const response = await requestPromise;
            return response;
        }
        finally {
            if (this.config.enableRequestDeduplication) {
                this.activeRequests.delete(requestKey);
            }
        }
    }
    /**
     * Batch multiple requests together
     */
    async batchRequests(requests) {
        if (!this.config.enableRequestBatching) {
            // Execute requests with concurrency control
            return this.executeConcurrentRequests(requests);
        }
        // Add to batch queue
        const promises = requests.map(req => new Promise((resolve, reject) => {
            this.requestQueue.push({
                url: req.url,
                options: req.options || {},
                resolve,
                reject,
                timestamp: Date.now(),
                priority: req.priority || 0
            });
        }));
        this.scheduleBatchExecution();
        return Promise.all(promises);
    }
    /**
     * Prefetch translations based on usage patterns
     */
    async prefetchTranslations(urls, options = {}) {
        if (!this.config.enablePrefetch)
            return;
        // Only prefetch if we have available capacity
        const availableCapacity = this.config.maxConcurrentRequests - this.concurrentRequests;
        const prefetchThreshold = Math.floor(this.config.maxConcurrentRequests * this.config.prefetchThreshold);
        if (availableCapacity < prefetchThreshold) {
            console.info('Skipping prefetch due to high network load');
            return;
        }
        const prefetchPromises = urls.slice(0, availableCapacity).map(async (url) => {
            try {
                const response = await this.optimizedFetch(url, options, -1); // Low priority for prefetch
                // Cache the response
                if (this.config.enableCaching) {
                    const requestKey = this.getRequestKey(url, options);
                    this.cacheResponse(requestKey, response.clone());
                }
                console.info(`Prefetched: ${url}`);
            }
            catch (error) {
                console.warn(`Prefetch failed for ${url}:`, error);
            }
        });
        await Promise.allSettled(prefetchPromises);
    }
    /**
     * Get network performance metrics
     */
    getPerformanceMetrics() {
        const totalRequests = this.metrics.length;
        const successfulRequests = this.metrics.filter(m => m.success).length;
        const failedRequests = totalRequests - successfulRequests;
        const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
        const averageLoadTime = totalRequests > 0 ? totalDuration / totalRequests : 0;
        const totalBytes = this.metrics.reduce((sum, m) => sum + m.size, 0);
        const compressedBytes = this.metrics.filter(m => m.compressed).reduce((sum, m) => sum + m.size, 0);
        const compressionSavings = compressedBytes > 0 ? (compressedBytes / totalBytes) : 0;
        const cachedRequests = this.metrics.filter(m => m.fromCache).length;
        const cacheHitRate = totalRequests > 0 ? cachedRequests / totalRequests : 0;
        const retriedRequests = this.metrics.filter(m => m.retryCount > 0).length;
        const retryRate = totalRequests > 0 ? retriedRequests / totalRequests : 0;
        return {
            totalRequests,
            successfulRequests,
            failedRequests,
            averageLoadTime,
            totalBytesTransferred: totalBytes,
            compressionSavings,
            cacheHitRate,
            concurrentRequestsAvg: this.calculateAverageConcurrency(),
            retryRate
        };
    }
    /**
     * Clear metrics and cache
     */
    clearMetrics() {
        this.metrics.length = 0;
        this.requestCache.clear();
        console.info('Network metrics and cache cleared');
    }
    /**
     * Get current network status
     */
    getNetworkStatus() {
        return {
            isOnline: navigator.onLine,
            concurrentRequests: this.concurrentRequests,
            queuedRequests: this.requestQueue.length,
            cacheSize: this.requestCache.size,
            activeRequests: this.activeRequests.size
        };
    }
    /**
     * Destroy optimizer and cleanup resources
     */
    destroy() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        this.activeRequests.clear();
        this.requestQueue.length = 0;
        this.metrics.length = 0;
        this.requestCache.clear();
    }
    async executeOptimizedRequest(url, options, priority) {
        // Wait for available slot if at capacity
        await this.waitForAvailableSlot(priority);
        this.concurrentRequests++;
        const startTime = Date.now();
        try {
            const response = await this.executeWithRetry(url, options);
            // Record metrics
            const endTime = Date.now();
            const duration = endTime - startTime;
            const size = this.getResponseSize(response);
            this.recordMetrics({
                url,
                startTime,
                endTime,
                duration,
                size,
                fromCache: false,
                compressed: this.isCompressed(response),
                retryCount: 0,
                success: response.ok
            });
            // Cache successful responses
            if (this.config.enableCaching && response.ok) {
                const requestKey = this.getRequestKey(url, options);
                this.cacheResponse(requestKey, response.clone());
            }
            return response;
        }
        catch (error) {
            // Record failed request
            this.recordMetrics({
                url,
                startTime,
                endTime: Date.now(),
                duration: Date.now() - startTime,
                size: 0,
                fromCache: false,
                compressed: false,
                retryCount: 0,
                success: false,
                error: error.message
            });
            throw error;
        }
        finally {
            this.concurrentRequests--;
        }
    }
    async executeWithRetry(url, options) {
        let lastError = null;
        for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
                const requestOptions = {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        ...options.headers,
                        ...(this.config.enableCompression && {
                            'Accept-Encoding': 'gzip, deflate, br'
                        }),
                        ...(this.config.cacheHeaders && {
                            'Cache-Control': 'public, max-age=300'
                        })
                    }
                };
                const response = await fetch(url, requestOptions);
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response;
            }
            catch (error) {
                lastError = error;
                if (attempt === this.config.retryAttempts) {
                    break;
                }
                // Exponential backoff
                const delay = this.config.retryDelay * Math.pow(2, attempt);
                const jitter = Math.random() * 0.1 * delay;
                console.warn(`Request attempt ${attempt + 1} failed for ${url}. Retrying in ${Math.round(delay + jitter)}ms...`, error);
                await this.sleep(delay + jitter);
            }
        }
        throw lastError || new Error(`Failed to fetch ${url} after ${this.config.retryAttempts} attempts`);
    }
    async executeConcurrentRequests(requests) {
        const results = new Array(requests.length);
        const executing = [];
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            const promise = this.optimizedFetch(request.url, request.options, request.priority).then(response => {
                results[i] = response;
            });
            executing.push(promise);
            // Limit concurrency
            if (executing.length >= this.config.maxConcurrentRequests) {
                await Promise.race(executing);
                executing.splice(executing.findIndex(p => p === promise), 1);
            }
        }
        await Promise.all(executing);
        return results;
    }
    async waitForAvailableSlot(priority) {
        while (this.concurrentRequests >= this.config.maxConcurrentRequests) {
            // Higher priority requests can interrupt lower priority ones
            if (priority > 0) {
                // Implementation would depend on priority queue system
                break;
            }
            await this.sleep(10); // Small delay before checking again
        }
    }
    scheduleBatchExecution() {
        if (this.batchTimer)
            return;
        this.batchTimer = setTimeout(() => {
            this.executeBatch();
            this.batchTimer = null;
        }, this.config.batchDelay);
    }
    async executeBatch() {
        if (this.requestQueue.length === 0)
            return;
        // Sort by priority and timestamp
        const batch = this.requestQueue.splice(0).sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority; // Higher priority first
            }
            return a.timestamp - b.timestamp; // Earlier requests first
        });
        console.info(`Executing batch of ${batch.length} requests`);
        // Execute batch with concurrency control
        const executing = [];
        for (const request of batch) {
            const promise = this.executeOptimizedRequest(request.url, request.options, request.priority).then(response => request.resolve(response), error => request.reject(error));
            executing.push(promise);
            if (executing.length >= this.config.maxConcurrentRequests) {
                await Promise.race(executing);
                executing.splice(0, 1);
            }
        }
        await Promise.all(executing);
    }
    getRequestKey(url, options) {
        const method = options.method || 'GET';
        const headers = JSON.stringify(options.headers || {});
        return `${method}:${url}:${headers}`;
    }
    getCachedResponse(requestKey) {
        const cached = this.requestCache.get(requestKey);
        if (!cached)
            return null;
        // Check if cache is still valid (5 minutes)
        const maxAge = 5 * 60 * 1000;
        if (Date.now() - cached.timestamp > maxAge) {
            this.requestCache.delete(requestKey);
            return null;
        }
        return cached.response;
    }
    cacheResponse(requestKey, response) {
        // Limit cache size
        if (this.requestCache.size >= 100) {
            // Remove oldest entries
            const entries = Array.from(this.requestCache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            entries.slice(0, 20).forEach(([key]) => {
                this.requestCache.delete(key);
            });
        }
        this.requestCache.set(requestKey, {
            response: response.clone(),
            timestamp: Date.now()
        });
    }
    getResponseSize(response) {
        const contentLength = response.headers.get('content-length');
        return contentLength ? parseInt(contentLength, 10) : 0;
    }
    isCompressed(response) {
        const encoding = response.headers.get('content-encoding');
        return encoding ? ['gzip', 'deflate', 'br'].includes(encoding) : false;
    }
    recordMetrics(metrics) {
        this.metrics.push(metrics);
        // Keep only last 1000 metrics to prevent memory bloat
        if (this.metrics.length > 1000) {
            this.metrics.splice(0, this.metrics.length - 1000);
        }
    }
    calculateAverageConcurrency() {
        // This would require tracking concurrency over time
        // Simplified implementation
        return this.concurrentRequests;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// Global network optimizer instance
export const translationNetworkOptimizer = new TranslationNetworkOptimizer();
