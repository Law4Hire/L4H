import { translationCacheManager } from './TranslationCacheManager'
import { translationNetworkOptimizer } from './TranslationNetworkOptimizer'
import { translationBundleManager } from './TranslationBundleManager'

export interface PerformanceMetric {
  id: string
  timestamp: number
  operation: 'load' | 'cache_hit' | 'cache_miss' | 'network_request' | 'bundle_load' | 'compression' | 'decompression'
  language: string
  namespace: string
  duration: number
  size: number
  success: boolean
  fromCache: boolean
  fromOffline: boolean
  retryCount: number
  error?: string
  metadata?: { [key: string]: any }
}

export interface PerformanceReport {
  timeRange: { start: number; end: number }
  totalOperations: number
  successRate: number
  averageLoadTime: number
  cacheHitRate: number
  offlineHitRate: number
  networkEfficiency: number
  compressionSavings: number
  topSlowOperations: PerformanceMetric[]
  languagePerformance: { [language: string]: LanguagePerformance }
  namespacePerformance: { [namespace: string]: NamespacePerformance }
  recommendations: string[]
}

export interface LanguagePerformance {
  language: string
  totalOperations: number
  averageLoadTime: number
  successRate: number
  cacheHitRate: number
  totalSize: number
}

export interface NamespacePerformance {
  namespace: string
  totalOperations: number
  averageLoadTime: number
  successRate: number
  cacheHitRate: number
  totalSize: number
  priority: string
}

export interface PerformanceThresholds {
  maxLoadTime: number // Maximum acceptable load time in ms
  minCacheHitRate: number // Minimum cache hit rate (0-1)
  maxRetryRate: number // Maximum retry rate (0-1)
  maxErrorRate: number // Maximum error rate (0-1)
  minCompressionRatio: number // Minimum compression ratio (0-1)
}

export interface PerformanceAlert {
  id: string
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'slow_load' | 'high_error_rate' | 'low_cache_hit' | 'high_retry_rate' | 'large_bundle'
  message: string
  metric: PerformanceMetric
  threshold: number
  actualValue: number
  suggestions: string[]
}

export class TranslationPerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private alerts: PerformanceAlert[] = []
  private thresholds: PerformanceThresholds
  private isMonitoring: boolean = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = []

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      maxLoadTime: 2000, // 2 seconds
      minCacheHitRate: 0.8, // 80%
      maxRetryRate: 0.1, // 10%
      maxErrorRate: 0.05, // 5%
      minCompressionRatio: 0.7, // 30% savings
      ...thresholds
    }
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.info('Translation performance monitoring started')

    // Set up periodic analysis
    this.monitoringInterval = setInterval(() => {
      this.analyzePerformance()
    }, intervalMs)

    // Hook into existing systems
    this.setupPerformanceHooks()
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    console.info('Translation performance monitoring stopped')
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      id: this.generateMetricId(),
      timestamp: Date.now(),
      ...metric
    }

    this.metrics.push(fullMetric)

    // Keep only last 10000 metrics to prevent memory bloat
    if (this.metrics.length > 10000) {
      this.metrics.splice(0, this.metrics.length - 10000)
    }

    // Check for immediate alerts
    this.checkThresholds(fullMetric)
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(timeRangeMs: number = 3600000): PerformanceReport {
    const now = Date.now()
    const startTime = now - timeRangeMs
    
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= startTime)
    
    if (relevantMetrics.length === 0) {
      return this.getEmptyReport(startTime, now)
    }

    const totalOperations = relevantMetrics.length
    const successfulOperations = relevantMetrics.filter(m => m.success).length
    const successRate = successfulOperations / totalOperations

    const loadTimes = relevantMetrics.map(m => m.duration)
    const averageLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length

    const cacheHits = relevantMetrics.filter(m => m.fromCache).length
    const cacheHitRate = cacheHits / totalOperations

    const offlineHits = relevantMetrics.filter(m => m.fromOffline).length
    const offlineHitRate = offlineHits / totalOperations

    const networkRequests = relevantMetrics.filter(m => m.operation === 'network_request')
    const networkEfficiency = this.calculateNetworkEfficiency(networkRequests)

    const compressionMetrics = relevantMetrics.filter(m => 
      m.operation === 'compression' || m.operation === 'decompression'
    )
    const compressionSavings = this.calculateCompressionSavings(compressionMetrics)

    const topSlowOperations = relevantMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    const languagePerformance = this.calculateLanguagePerformance(relevantMetrics)
    const namespacePerformance = this.calculateNamespacePerformance(relevantMetrics)

    const recommendations = this.generateRecommendations(relevantMetrics)

    return {
      timeRange: { start: startTime, end: now },
      totalOperations,
      successRate,
      averageLoadTime,
      cacheHitRate,
      offlineHitRate,
      networkEfficiency,
      compressionSavings,
      topSlowOperations,
      languagePerformance,
      namespacePerformance,
      recommendations
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): {
    activeOperations: number
    recentAverageLoadTime: number
    recentCacheHitRate: number
    recentErrorRate: number
    alertCount: number
  } {
    const recentMetrics = this.getRecentMetrics(300000) // Last 5 minutes
    
    if (recentMetrics.length === 0) {
      return {
        activeOperations: 0,
        recentAverageLoadTime: 0,
        recentCacheHitRate: 0,
        recentErrorRate: 0,
        alertCount: this.alerts.length
      }
    }

    const loadTimes = recentMetrics.map(m => m.duration)
    const recentAverageLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length

    const cacheHits = recentMetrics.filter(m => m.fromCache).length
    const recentCacheHitRate = cacheHits / recentMetrics.length

    const errors = recentMetrics.filter(m => !m.success).length
    const recentErrorRate = errors / recentMetrics.length

    return {
      activeOperations: recentMetrics.length,
      recentAverageLoadTime,
      recentCacheHitRate,
      recentErrorRate,
      alertCount: this.alerts.length
    }
  }

  /**
   * Get performance alerts
   */
  getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity)
    }
    return [...this.alerts]
  }

  /**
   * Clear old alerts
   */
  clearAlerts(olderThanMs: number = 3600000): number {
    const cutoff = Date.now() - olderThanMs
    const initialCount = this.alerts.length
    
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff)
    
    return initialCount - this.alerts.length
  }

  /**
   * Subscribe to performance alerts
   */
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCsv()
    }
    
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      thresholds: this.thresholds,
      exportTime: Date.now()
    }, null, 2)
  }

  /**
   * Clear all metrics and alerts
   */
  clearData(): void {
    this.metrics.length = 0
    this.alerts.length = 0
    console.info('Performance monitoring data cleared')
  }

  /**
   * Get system resource usage
   */
  getResourceUsage(): {
    memoryUsage: number
    cacheSize: number
    networkRequests: number
    compressionRatio: number
  } {
    const cacheStats = translationCacheManager.getStats()
    const networkStats = translationNetworkOptimizer.getPerformanceMetrics()
    
    return {
      memoryUsage: cacheStats.memoryUsage,
      cacheSize: cacheStats.totalSize,
      networkRequests: networkStats.totalRequests,
      compressionRatio: networkStats.compressionSavings
    }
  }

  private setupPerformanceHooks(): void {
    // This would integrate with the actual translation loading systems
    // For now, we'll set up basic monitoring
    
    // Monitor cache performance
    const originalCacheGet = translationCacheManager.get.bind(translationCacheManager)
    translationCacheManager.get = (language: string, namespace: string) => {
      const startTime = Date.now()
      const result = originalCacheGet(language, namespace)
      const duration = Date.now() - startTime
      
      this.recordMetric({
        operation: result ? 'cache_hit' : 'cache_miss',
        language,
        namespace,
        duration,
        size: result ? JSON.stringify(result).length : 0,
        success: true,
        fromCache: !!result,
        fromOffline: false,
        retryCount: 0
      })
      
      return result
    }
  }

  private analyzePerformance(): void {
    const recentMetrics = this.getRecentMetrics(300000) // Last 5 minutes
    
    if (recentMetrics.length === 0) return

    // Check for performance degradation
    this.checkPerformanceTrends(recentMetrics)
    
    // Clean up old alerts
    this.clearAlerts()
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const alerts: PerformanceAlert[] = []

    // Check load time threshold
    if (metric.duration > this.thresholds.maxLoadTime) {
      alerts.push({
        id: this.generateAlertId(),
        timestamp: Date.now(),
        severity: metric.duration > this.thresholds.maxLoadTime * 2 ? 'critical' : 'high',
        type: 'slow_load',
        message: `Slow translation load: ${metric.duration}ms for ${metric.language}/${metric.namespace}`,
        metric,
        threshold: this.thresholds.maxLoadTime,
        actualValue: metric.duration,
        suggestions: [
          'Check network connectivity',
          'Verify translation file size',
          'Consider preloading this namespace',
          'Enable compression if not already active'
        ]
      })
    }

    // Add alerts
    alerts.forEach(alert => {
      this.alerts.push(alert)
      this.notifyAlertCallbacks(alert)
    })
  }

  private checkPerformanceTrends(metrics: PerformanceMetric[]): void {
    const cacheHitRate = metrics.filter(m => m.fromCache).length / metrics.length
    const errorRate = metrics.filter(m => !m.success).length / metrics.length
    const retryRate = metrics.filter(m => m.retryCount > 0).length / metrics.length

    // Check cache hit rate
    if (cacheHitRate < this.thresholds.minCacheHitRate) {
      const alert: PerformanceAlert = {
        id: this.generateAlertId(),
        timestamp: Date.now(),
        severity: cacheHitRate < this.thresholds.minCacheHitRate * 0.5 ? 'critical' : 'medium',
        type: 'low_cache_hit',
        message: `Low cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`,
        metric: metrics[0], // Representative metric
        threshold: this.thresholds.minCacheHitRate,
        actualValue: cacheHitRate,
        suggestions: [
          'Increase cache size',
          'Extend cache TTL',
          'Preload frequently used translations',
          'Check cache eviction policies'
        ]
      }
      
      this.alerts.push(alert)
      this.notifyAlertCallbacks(alert)
    }

    // Check error rate
    if (errorRate > this.thresholds.maxErrorRate) {
      const alert: PerformanceAlert = {
        id: this.generateAlertId(),
        timestamp: Date.now(),
        severity: errorRate > this.thresholds.maxErrorRate * 2 ? 'critical' : 'high',
        type: 'high_error_rate',
        message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
        metric: metrics[0],
        threshold: this.thresholds.maxErrorRate,
        actualValue: errorRate,
        suggestions: [
          'Check translation file availability',
          'Verify network connectivity',
          'Review error logs for patterns',
          'Consider fallback strategies'
        ]
      }
      
      this.alerts.push(alert)
      this.notifyAlertCallbacks(alert)
    }

    // Check retry rate
    if (retryRate > this.thresholds.maxRetryRate) {
      const alert: PerformanceAlert = {
        id: this.generateAlertId(),
        timestamp: Date.now(),
        severity: 'medium',
        type: 'high_retry_rate',
        message: `High retry rate: ${(retryRate * 100).toFixed(1)}%`,
        metric: metrics[0],
        threshold: this.thresholds.maxRetryRate,
        actualValue: retryRate,
        suggestions: [
          'Check network stability',
          'Review retry configuration',
          'Consider increasing timeout values',
          'Implement circuit breaker pattern'
        ]
      }
      
      this.alerts.push(alert)
      this.notifyAlertCallbacks(alert)
    }
  }

  private getRecentMetrics(timeRangeMs: number): PerformanceMetric[] {
    const cutoff = Date.now() - timeRangeMs
    return this.metrics.filter(m => m.timestamp > cutoff)
  }

  private calculateNetworkEfficiency(networkMetrics: PerformanceMetric[]): number {
    if (networkMetrics.length === 0) return 1

    const successfulRequests = networkMetrics.filter(m => m.success).length
    return successfulRequests / networkMetrics.length
  }

  private calculateCompressionSavings(compressionMetrics: PerformanceMetric[]): number {
    if (compressionMetrics.length === 0) return 0

    // This would calculate actual compression savings
    // Simplified implementation
    return 0.3 // 30% average savings
  }

  private calculateLanguagePerformance(metrics: PerformanceMetric[]): { [language: string]: LanguagePerformance } {
    const languageGroups = this.groupBy(metrics, 'language')
    const result: { [language: string]: LanguagePerformance } = {}

    for (const [language, langMetrics] of Object.entries(languageGroups)) {
      const totalOperations = langMetrics.length
      const successfulOps = langMetrics.filter(m => m.success).length
      const cacheHits = langMetrics.filter(m => m.fromCache).length
      const totalSize = langMetrics.reduce((sum, m) => sum + m.size, 0)
      const totalDuration = langMetrics.reduce((sum, m) => sum + m.duration, 0)

      result[language] = {
        language,
        totalOperations,
        averageLoadTime: totalDuration / totalOperations,
        successRate: successfulOps / totalOperations,
        cacheHitRate: cacheHits / totalOperations,
        totalSize
      }
    }

    return result
  }

  private calculateNamespacePerformance(metrics: PerformanceMetric[]): { [namespace: string]: NamespacePerformance } {
    const namespaceGroups = this.groupBy(metrics, 'namespace')
    const result: { [namespace: string]: NamespacePerformance } = {}

    for (const [namespace, nsMetrics] of Object.entries(namespaceGroups)) {
      const totalOperations = nsMetrics.length
      const successfulOps = nsMetrics.filter(m => m.success).length
      const cacheHits = nsMetrics.filter(m => m.fromCache).length
      const totalSize = nsMetrics.reduce((sum, m) => sum + m.size, 0)
      const totalDuration = nsMetrics.reduce((sum, m) => sum + m.duration, 0)

      result[namespace] = {
        namespace,
        totalOperations,
        averageLoadTime: totalDuration / totalOperations,
        successRate: successfulOps / totalOperations,
        cacheHitRate: cacheHits / totalOperations,
        totalSize,
        priority: this.getNamespacePriority(namespace)
      }
    }

    return result
  }

  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = []
    
    const cacheHitRate = metrics.filter(m => m.fromCache).length / metrics.length
    const averageLoadTime = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
    const errorRate = metrics.filter(m => !m.success).length / metrics.length

    if (cacheHitRate < 0.7) {
      recommendations.push('Consider increasing cache size or TTL to improve cache hit rate')
    }

    if (averageLoadTime > 1000) {
      recommendations.push('Enable compression and bundling to reduce load times')
    }

    if (errorRate > 0.05) {
      recommendations.push('Implement better error handling and fallback mechanisms')
    }

    const largeNamespaces = Object.entries(this.calculateNamespacePerformance(metrics))
      .filter(([, perf]) => perf.totalSize > 50000)
      .map(([namespace]) => namespace)

    if (largeNamespaces.length > 0) {
      recommendations.push(`Consider splitting large namespaces: ${largeNamespaces.join(', ')}`)
    }

    return recommendations
  }

  private getEmptyReport(startTime: number, endTime: number): PerformanceReport {
    return {
      timeRange: { start: startTime, end: endTime },
      totalOperations: 0,
      successRate: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      offlineHitRate: 0,
      networkEfficiency: 0,
      compressionSavings: 0,
      topSlowOperations: [],
      languagePerformance: {},
      namespacePerformance: {},
      recommendations: ['No data available for the specified time range']
    }
  }

  private exportToCsv(): string {
    const headers = [
      'timestamp', 'operation', 'language', 'namespace', 'duration',
      'size', 'success', 'fromCache', 'fromOffline', 'retryCount', 'error'
    ]

    const rows = this.metrics.map(metric => [
      new Date(metric.timestamp).toISOString(),
      metric.operation,
      metric.language,
      metric.namespace,
      metric.duration.toString(),
      metric.size.toString(),
      metric.success.toString(),
      metric.fromCache.toString(),
      metric.fromOffline.toString(),
      metric.retryCount.toString(),
      metric.error || ''
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  private groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key])
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
      return groups
    }, {} as { [key: string]: T[] })
  }

  private getNamespacePriority(namespace: string): string {
    const priorityMap: { [key: string]: string } = {
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
    }

    return priorityMap[namespace] || 'normal'
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private notifyAlertCallbacks(alert: PerformanceAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error in alert callback:', error)
      }
    })
  }
}

// Global performance monitor instance
export const translationPerformanceMonitor = new TranslationPerformanceMonitor()