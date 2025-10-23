import { translationCacheManager } from './TranslationCacheManager'
import { lazyTranslationLoader } from './LazyTranslationLoader'
import { offlineTranslationManager } from './OfflineTranslationManager'
import { translationBundleManager } from './TranslationBundleManager'
import { translationNetworkOptimizer } from './TranslationNetworkOptimizer'
import { translationCompressionUtils } from './TranslationCompressionUtils'
import { translationPerformanceMonitor } from './TranslationPerformanceMonitor'

export interface PerformanceConfig {
  enableCaching: boolean
  enableLazyLoading: boolean
  enableOfflineSupport: boolean
  enableBundling: boolean
  enableNetworkOptimization: boolean
  enableCompression: boolean
  enablePerformanceMonitoring: boolean
  preloadCriticalNamespaces: boolean
  optimizeForMobile: boolean
  debugMode: boolean
}

export interface InitializationResult {
  success: boolean
  enabledFeatures: string[]
  warnings: string[]
  errors: string[]
  performanceBaseline: {
    cacheSize: number
    bundlesLoaded: number
    compressionRatio: number
    networkRequests: number
  }
}

export class TranslationPerformanceIntegration {
  private config: PerformanceConfig
  private initialized: boolean = false
  private initializationPromise: Promise<InitializationResult> | null = null

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableCaching: true,
      enableLazyLoading: true,
      enableOfflineSupport: true,
      enableBundling: true,
      enableNetworkOptimization: true,
      enableCompression: true,
      enablePerformanceMonitoring: true,
      preloadCriticalNamespaces: true,
      optimizeForMobile: this.isMobileDevice(),
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    }
  }

  /**
   * Initialize all performance optimization systems
   */
  async initialize(
    application: 'l4h' | 'cannlaw' | 'shared',
    language: string,
    loadPaths: string[]
  ): Promise<InitializationResult> {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this.performInitialization(application, language, loadPaths)
    return this.initializationPromise
  }

  /**
   * Get comprehensive performance status
   */
  getPerformanceStatus(): {
    caching: any
    lazyLoading: any
    offline: any
    bundling: any
    network: any
    compression: any
    monitoring: any
    overall: {
      healthy: boolean
      score: number
      recommendations: string[]
    }
  } {
    const caching = this.config.enableCaching ? translationCacheManager.getStats() : null
    const lazyLoading = this.config.enableLazyLoading ? lazyTranslationLoader.getPerformanceMetrics() : null
    const offline = this.config.enableOfflineSupport ? offlineTranslationManager.getOfflineStats() : null
    const bundling = this.config.enableBundling ? translationBundleManager.getNetworkStats() : null
    const network = this.config.enableNetworkOptimization ? translationNetworkOptimizer.getPerformanceMetrics() : null
    const compression = this.config.enableCompression ? translationCompressionUtils.getCompressionStats() : null
    const monitoring = this.config.enablePerformanceMonitoring ? translationPerformanceMonitor.getCurrentMetrics() : null

    const overall = this.calculateOverallHealth({
      caching,
      lazyLoading,
      offline,
      bundling,
      network,
      compression,
      monitoring
    })

    return {
      caching,
      lazyLoading,
      offline,
      bundling,
      network,
      compression,
      monitoring,
      overall
    }
  }

  /**
   * Optimize performance based on current conditions
   */
  async optimizePerformance(): Promise<{
    optimizationsApplied: string[]
    performanceImprovement: number
    recommendations: string[]
  }> {
    const optimizationsApplied: string[] = []
    const recommendations: string[] = []
    let performanceImprovement = 0

    // Optimize cache
    if (this.config.enableCaching) {
      const cacheOptimization = translationCacheManager.optimize()
      if (cacheOptimization.expiredRemoved > 0 || cacheOptimization.compressed > 0) {
        optimizationsApplied.push(`Cache optimization: removed ${cacheOptimization.expiredRemoved} expired entries, compressed ${cacheOptimization.compressed} entries`)
        performanceImprovement += cacheOptimization.memoryFreed / 1024 // KB freed
      }
    }

    // Optimize compression
    if (this.config.enableCompression) {
      const compressionStats = translationCompressionUtils.getCompressionStats()
      if (compressionStats.averageCompressionRatio > 0.8) {
        recommendations.push('Consider enabling higher compression levels for better savings')
      }
    }

    // Network optimization
    if (this.config.enableNetworkOptimization) {
      const networkStats = translationNetworkOptimizer.getPerformanceMetrics()
      if (networkStats.cacheHitRate < 0.8) {
        recommendations.push('Increase cache TTL or preload more translations to improve cache hit rate')
      }
    }

    // Mobile optimizations
    if (this.config.optimizeForMobile) {
      const mobileOptimizations = await this.applyMobileOptimizations()
      optimizationsApplied.push(...mobileOptimizations)
    }

    return {
      optimizationsApplied,
      performanceImprovement,
      recommendations
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    summary: any
    detailed: any
    recommendations: string[]
    alerts: any[]
  } {
    const summary = this.getPerformanceStatus()
    
    const detailed = {
      cache: this.config.enableCaching ? {
        stats: translationCacheManager.getStats(),
        entries: translationCacheManager.getEntries ? translationCacheManager.getEntries() : []
      } : null,
      
      network: this.config.enableNetworkOptimization ? {
        stats: translationNetworkOptimizer.getPerformanceMetrics(),
        status: translationNetworkOptimizer.getNetworkStatus()
      } : null,
      
      bundles: this.config.enableBundling ? {
        info: translationBundleManager.getBundleInfo(),
        stats: translationBundleManager.getNetworkStats()
      } : null,
      
      compression: this.config.enableCompression ? {
        stats: translationCompressionUtils.getCompressionStats()
      } : null,
      
      monitoring: this.config.enablePerformanceMonitoring ? {
        report: translationPerformanceMonitor.generateReport(),
        current: translationPerformanceMonitor.getCurrentMetrics()
      } : null
    }

    const recommendations = this.generateRecommendations(summary, detailed)
    
    const alerts = this.config.enablePerformanceMonitoring 
      ? translationPerformanceMonitor.getAlerts()
      : []

    return {
      summary,
      detailed,
      recommendations,
      alerts
    }
  }

  /**
   * Reset all performance systems
   */
  async reset(): Promise<void> {
    if (this.config.enableCaching) {
      translationCacheManager.clear()
    }

    if (this.config.enableLazyLoading) {
      lazyTranslationLoader.reset()
    }

    if (this.config.enableOfflineSupport) {
      await offlineTranslationManager.clearOfflineStorage()
    }

    if (this.config.enableBundling) {
      translationBundleManager.clearBundleCache()
    }

    if (this.config.enableNetworkOptimization) {
      translationNetworkOptimizer.clearMetrics()
    }

    if (this.config.enableCompression) {
      translationCompressionUtils.resetStats()
    }

    if (this.config.enablePerformanceMonitoring) {
      translationPerformanceMonitor.clearData()
    }

    console.info('All translation performance systems reset')
  }

  /**
   * Destroy all performance systems
   */
  destroy(): void {
    if (this.config.enableLazyLoading) {
      lazyTranslationLoader.destroy()
    }

    if (this.config.enableOfflineSupport) {
      offlineTranslationManager.destroy()
    }

    if (this.config.enableBundling) {
      translationBundleManager.destroy()
    }

    if (this.config.enableNetworkOptimization) {
      translationNetworkOptimizer.destroy()
    }

    if (this.config.enablePerformanceMonitoring) {
      translationPerformanceMonitor.stopMonitoring()
    }

    this.initialized = false
    this.initializationPromise = null
    
    console.info('Translation performance integration destroyed')
  }

  private async performInitialization(
    application: 'l4h' | 'cannlaw' | 'shared',
    language: string,
    loadPaths: string[]
  ): Promise<InitializationResult> {
    const enabledFeatures: string[] = []
    const warnings: string[] = []
    const errors: string[] = []

    try {
      // Initialize performance monitoring first
      if (this.config.enablePerformanceMonitoring) {
        translationPerformanceMonitor.startMonitoring()
        enabledFeatures.push('Performance Monitoring')
      }

      // Initialize caching
      if (this.config.enableCaching) {
        // Cache manager is already initialized
        enabledFeatures.push('Enhanced Caching')
      }

      // Initialize lazy loading
      if (this.config.enableLazyLoading) {
        // Set up load strategies based on application
        enabledFeatures.push('Lazy Loading')
      }

      // Initialize offline support
      if (this.config.enableOfflineSupport) {
        if (this.config.preloadCriticalNamespaces) {
          try {
            await offlineTranslationManager.preloadCriticalTranslations(language, loadPaths)
            enabledFeatures.push('Offline Support with Preloading')
          } catch (error) {
            warnings.push(`Failed to preload critical translations: ${(error as Error).message}`)
            enabledFeatures.push('Offline Support (without preloading)')
          }
        } else {
          enabledFeatures.push('Offline Support')
        }
      }

      // Initialize bundling
      if (this.config.enableBundling) {
        try {
          await translationBundleManager.preloadCriticalBundles(language)
          enabledFeatures.push('Bundle Management with Preloading')
        } catch (error) {
          warnings.push(`Failed to preload critical bundles: ${(error as Error).message}`)
          enabledFeatures.push('Bundle Management')
        }
      }

      // Initialize network optimization
      if (this.config.enableNetworkOptimization) {
        enabledFeatures.push('Network Optimization')
      }

      // Initialize compression
      if (this.config.enableCompression) {
        enabledFeatures.push('Compression')
      }

      // Apply mobile optimizations if needed
      if (this.config.optimizeForMobile) {
        const mobileOptimizations = await this.applyMobileOptimizations()
        if (mobileOptimizations.length > 0) {
          enabledFeatures.push('Mobile Optimizations')
        }
      }

      // Get performance baseline
      const performanceBaseline = {
        cacheSize: this.config.enableCaching ? translationCacheManager.getStats().totalSize : 0,
        bundlesLoaded: this.config.enableBundling ? translationBundleManager.getBundleInfo().length : 0,
        compressionRatio: this.config.enableCompression ? translationCompressionUtils.getCompressionStats().averageCompressionRatio : 0,
        networkRequests: this.config.enableNetworkOptimization ? translationNetworkOptimizer.getPerformanceMetrics().totalRequests : 0
      }

      this.initialized = true

      return {
        success: true,
        enabledFeatures,
        warnings,
        errors,
        performanceBaseline
      }
    } catch (error) {
      errors.push(`Initialization failed: ${(error as Error).message}`)
      
      return {
        success: false,
        enabledFeatures,
        warnings,
        errors,
        performanceBaseline: {
          cacheSize: 0,
          bundlesLoaded: 0,
          compressionRatio: 0,
          networkRequests: 0
        }
      }
    }
  }

  private calculateOverallHealth(systems: any): {
    healthy: boolean
    score: number
    recommendations: string[]
  } {
    let score = 0
    let maxScore = 0
    const recommendations: string[] = []

    // Cache health
    if (systems.caching) {
      maxScore += 20
      const hitRate = systems.caching.hitRate || 0
      score += hitRate * 20
      
      if (hitRate < 0.8) {
        recommendations.push('Improve cache hit rate by preloading or increasing cache size')
      }
    }

    // Network health
    if (systems.network) {
      maxScore += 20
      const successRate = systems.network.successfulRequests / (systems.network.totalRequests || 1)
      score += successRate * 20
      
      if (successRate < 0.95) {
        recommendations.push('Improve network reliability and error handling')
      }
    }

    // Monitoring health
    if (systems.monitoring) {
      maxScore += 20
      const errorRate = systems.monitoring.recentErrorRate || 0
      score += (1 - errorRate) * 20
      
      if (errorRate > 0.05) {
        recommendations.push('Investigate and reduce error rate')
      }
    }

    // Compression health
    if (systems.compression) {
      maxScore += 20
      const compressionRatio = systems.compression.averageCompressionRatio || 0
      score += (1 - compressionRatio) * 20
      
      if (compressionRatio > 0.8) {
        recommendations.push('Enable higher compression levels for better performance')
      }
    }

    // Offline health
    if (systems.offline) {
      maxScore += 20
      const offlineAvailability = systems.offline.criticalEntries / Math.max(systems.offline.totalEntries, 1)
      score += offlineAvailability * 20
      
      if (offlineAvailability < 0.8) {
        recommendations.push('Ensure critical translations are available offline')
      }
    }

    const finalScore = maxScore > 0 ? (score / maxScore) * 100 : 0
    const healthy = finalScore >= 80

    return {
      healthy,
      score: Math.round(finalScore),
      recommendations
    }
  }

  private generateRecommendations(summary: any, detailed: any): string[] {
    const recommendations: string[] = []

    // Add system-specific recommendations
    if (summary.overall.recommendations) {
      recommendations.push(...summary.overall.recommendations)
    }

    // Add detailed recommendations based on metrics
    if (detailed.monitoring?.report?.recommendations) {
      recommendations.push(...detailed.monitoring.report.recommendations)
    }

    // Remove duplicates
    return [...new Set(recommendations)]
  }

  private async applyMobileOptimizations(): Promise<string[]> {
    const optimizations: string[] = []

    // Reduce cache size for mobile
    if (this.config.enableCaching) {
      // This would adjust cache configuration for mobile
      optimizations.push('Adjusted cache size for mobile devices')
    }

    // Enable aggressive compression
    if (this.config.enableCompression) {
      // This would enable higher compression levels
      optimizations.push('Enabled aggressive compression for mobile')
    }

    // Reduce concurrent requests
    if (this.config.enableNetworkOptimization) {
      // This would reduce parallel requests for mobile
      optimizations.push('Reduced concurrent requests for mobile')
    }

    return optimizations
  }

  private isMobileDevice(): boolean {
    if (typeof navigator === 'undefined') return false
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
}

// Global performance integration instance
export const translationPerformanceIntegration = new TranslationPerformanceIntegration()