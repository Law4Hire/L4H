import { translationErrorHandler } from '../translation-error-handler'
import { translationCacheManager } from './TranslationCacheManager'
import { lazyTranslationLoader } from './LazyTranslationLoader'
import { offlineTranslationManager } from './OfflineTranslationManager'

export interface TranslationLoadOptions {
  language: string
  namespace: string
  loadPath: string
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  cache?: boolean
  priority?: 'critical' | 'high' | 'normal' | 'low'
  offline?: boolean
}

export interface TranslationCache {
  [key: string]: {
    data: any
    timestamp: number
    expiresAt: number
  }
}

export interface LoadResult {
  success: boolean
  data?: any
  error?: Error
  fromCache?: boolean
  fromOffline?: boolean
  retryCount?: number
  loadTime?: number
}

export class TranslationLoader {
  private cache: TranslationCache = {} // Legacy cache for backwards compatibility
  private loadingPromises: Map<string, Promise<LoadResult>> = new Map()
  private readonly defaultOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
    cache: true,
    priority: 'normal' as const,
    offline: true,
    cacheExpiry: 30 * 60 * 1000 // 30 minutes
  }

  /**
   * Load translation with enhanced caching, lazy loading, and offline support
   */
  async loadTranslation(options: TranslationLoadOptions): Promise<LoadResult> {
    const startTime = Date.now()
    const cacheKey = this.getCacheKey(options.language, options.namespace)
    const priority = options.priority ?? this.defaultOptions.priority
    
    // Check if already loading
    const existingPromise = this.loadingPromises.get(cacheKey)
    if (existingPromise) {
      return existingPromise
    }

    // Check enhanced cache first
    if (options.cache !== false) {
      const cachedData = translationCacheManager.get(options.language, options.namespace)
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          fromCache: true,
          loadTime: Date.now() - startTime
        }
      }

      // Check legacy cache for backwards compatibility
      const legacyCachedResult = this.getCachedTranslation(cacheKey)
      if (legacyCachedResult) {
        // Migrate to new cache system
        translationCacheManager.set(options.language, options.namespace, legacyCachedResult, priority)
        return {
          success: true,
          data: legacyCachedResult,
          fromCache: true,
          loadTime: Date.now() - startTime
        }
      }
    }

    // Check offline storage if enabled and offline
    if (options.offline !== false && !navigator.onLine) {
      const offlineData = offlineTranslationManager.getOffline(options.language, options.namespace)
      if (offlineData) {
        return {
          success: true,
          data: offlineData,
          fromOffline: true,
          loadTime: Date.now() - startTime
        }
      }
    }

    // Create loading promise
    const loadingPromise = this.performLoadWithRetry(options, startTime)
    this.loadingPromises.set(cacheKey, loadingPromise)

    try {
      const result = await loadingPromise
      return result
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }

  /**
   * Preload critical namespaces for faster initial loading
   */
  async preloadNamespaces(
    language: string, 
    namespaces: string[], 
    loadPath: string
  ): Promise<{ [namespace: string]: LoadResult }> {
    const results: { [namespace: string]: LoadResult } = {}
    
    // Load all namespaces in parallel
    const loadPromises = namespaces.map(async (namespace) => {
      const result = await this.loadTranslation({
        language,
        namespace,
        loadPath,
        cache: true
      })
      results[namespace] = result
      return result
    })

    await Promise.allSettled(loadPromises)
    return results
  }

  /**
   * Load multiple translations with enhanced performance optimization
   */
  async loadMultipleTranslations(
    requests: TranslationLoadOptions[],
    priorityNamespaces: string[] = ['common', 'errors']
  ): Promise<{ [key: string]: LoadResult }> {
    const results: { [key: string]: LoadResult } = {}
    
    // Use lazy loader for optimized batch loading
    const lazyRequests = requests.map(req => ({
      language: req.language,
      namespace: req.namespace,
      loadPaths: [req.loadPath],
      priority: req.priority || (priorityNamespaces.includes(req.namespace) ? 'critical' : 'normal') as any
    }))

    try {
      const lazyResults = await lazyTranslationLoader.batchLoad(lazyRequests)
      
      // Convert lazy results to our format
      for (const [key, lazyResult] of Object.entries(lazyResults)) {
        results[key] = {
          success: lazyResult.success,
          data: lazyResult.data,
          fromCache: lazyResult.fromCache,
          loadTime: lazyResult.loadTime,
          error: lazyResult.error,
          retryCount: lazyResult.retryCount || 0
        }
      }
    } catch (error) {
      // Fallback to original implementation
      console.warn('Lazy batch loading failed, falling back to original implementation:', error)
      
      // Separate priority and regular requests
      const priorityRequests = requests.filter(req => 
        priorityNamespaces.includes(req.namespace)
      )
      const regularRequests = requests.filter(req => 
        !priorityNamespaces.includes(req.namespace)
      )

      // Load priority translations first
      if (priorityRequests.length > 0) {
        const priorityPromises = priorityRequests.map(async (request) => {
          const key = this.getCacheKey(request.language, request.namespace)
          const result = await this.loadTranslation(request)
          results[key] = result
          return result
        })
        
        await Promise.allSettled(priorityPromises)
      }

      // Load regular translations
      if (regularRequests.length > 0) {
        const regularPromises = regularRequests.map(async (request) => {
          const key = this.getCacheKey(request.language, request.namespace)
          const result = await this.loadTranslation(request)
          results[key] = result
          return result
        })
        
        await Promise.allSettled(regularPromises)
      }
    }

    return results
  }

  /**
   * Clear cache for specific language/namespace or all
   */
  clearCache(language?: string, namespace?: string): void {
    if (language && namespace) {
      const key = this.getCacheKey(language, namespace)
      delete this.cache[key]
    } else if (language) {
      // Clear all namespaces for a language
      Object.keys(this.cache).forEach(key => {
        if (key.startsWith(`${language}-`)) {
          delete this.cache[key]
        }
      })
    } else {
      // Clear all cache
      this.cache = {}
    }
  }

  /**
   * Get comprehensive cache statistics for monitoring
   */
  getCacheStats(): {
    totalEntries: number
    cacheHitRate: number
    expiredEntries: number
    cacheSize: number
    enhancedCacheStats: any
  } {
    const now = Date.now()
    const entries = Object.values(this.cache)
    const expiredEntries = entries.filter(entry => entry.expiresAt < now).length
    
    // Calculate approximate cache size
    const cacheSize = JSON.stringify(this.cache).length
    
    // Get enhanced cache stats
    const enhancedCacheStats = translationCacheManager.getStats()
    
    return {
      totalEntries: entries.length,
      cacheHitRate: enhancedCacheStats.hitRate, // Use enhanced cache hit rate
      expiredEntries,
      cacheSize,
      enhancedCacheStats
    }
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupExpiredCache(): void {
    const now = Date.now()
    Object.keys(this.cache).forEach(key => {
      if (this.cache[key].expiresAt < now) {
        delete this.cache[key]
      }
    })
  }

  private async performLoadWithRetry(options: TranslationLoadOptions, startTime: number): Promise<LoadResult> {
    const maxRetries = options.maxRetries ?? this.defaultOptions.maxRetries
    const baseDelay = options.retryDelay ?? this.defaultOptions.retryDelay
    const priority = options.priority ?? this.defaultOptions.priority
    
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Record loading start
        translationErrorHandler.startLoading(options.language, options.namespace)
        
        const data = await this.performSingleLoad(options)
        
        // Cache successful result in enhanced cache
        if (options.cache !== false) {
          translationCacheManager.set(options.language, options.namespace, data, priority)
          
          // Also cache in legacy system for backwards compatibility
          this.cacheTranslation(options.language, options.namespace, data)
        }

        // Store offline if enabled and online
        if (options.offline !== false && navigator.onLine) {
          offlineTranslationManager.storeOffline(
            options.language, 
            options.namespace, 
            data
          ).catch(error => {
            console.warn('Failed to store translation offline:', error)
          })
        }
        
        // Record success
        translationErrorHandler.recordSuccess(options.language, options.namespace)
        
        return {
          success: true,
          data,
          retryCount: attempt,
          loadTime: Date.now() - startTime
        }
      } catch (error) {
        lastError = error as Error
        
        // Record error
        translationErrorHandler.recordError(
          options.language, 
          options.namespace, 
          lastError
        )
        
        // If this is the last attempt, don't wait
        if (attempt === maxRetries) {
          break
        }
        
        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt)
        const jitter = Math.random() * 0.1 * delay // Add 10% jitter
        const totalDelay = delay + jitter
        
        console.warn(
          `Translation load attempt ${attempt + 1} failed for ${options.language}/${options.namespace}. ` +
          `Retrying in ${Math.round(totalDelay)}ms...`, 
          lastError
        )
        
        await this.sleep(totalDelay)
      }
    }
    
    return {
      success: false,
      error: lastError || new Error('Unknown error during translation loading'),
      retryCount: maxRetries,
      loadTime: Date.now() - startTime
    }
  }

  private async performSingleLoad(options: TranslationLoadOptions): Promise<any> {
    const url = this.buildLoadUrl(options.loadPath, options.language, options.namespace)
    const timeout = options.timeout ?? this.defaultOptions.timeout
    
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Validate that we got valid translation data
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid translation data format')
      }
      
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Translation loading timeout after ${timeout}ms`)
        }
        throw error
      }
      
      throw new Error('Unknown error during translation loading')
    }
  }

  private buildLoadUrl(loadPath: string, language: string, namespace: string): string {
    return loadPath
      .replace('{{lng}}', language)
      .replace('{{ns}}', namespace)
  }

  private getCacheKey(language: string, namespace: string): string {
    return `${language}-${namespace}`
  }

  private getCachedTranslation(cacheKey: string): any | null {
    const cached = this.cache[cacheKey]
    if (!cached) {
      return null
    }
    
    // Check if expired
    if (cached.expiresAt < Date.now()) {
      delete this.cache[cacheKey]
      return null
    }
    
    return cached.data
  }

  private cacheTranslation(language: string, namespace: string, data: any): void {
    const cacheKey = this.getCacheKey(language, namespace)
    const now = Date.now()
    
    this.cache[cacheKey] = {
      data,
      timestamp: now,
      expiresAt: now + this.defaultOptions.cacheExpiry
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Global instance for use across the application
export const translationLoader = new TranslationLoader()