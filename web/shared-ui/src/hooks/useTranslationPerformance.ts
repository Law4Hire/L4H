import { useState, useEffect, useCallback, useRef } from 'react'
import { translationPerformanceIntegration } from '../services/TranslationPerformanceIntegration'
import { translationPerformanceMonitor } from '../services/TranslationPerformanceMonitor'
import type { PerformanceAlert } from '../services/TranslationPerformanceMonitor'

export interface UseTranslationPerformanceOptions {
  enableRealTimeMonitoring?: boolean
  alertThreshold?: 'low' | 'medium' | 'high' | 'critical'
  updateInterval?: number
  autoOptimize?: boolean
  optimizationInterval?: number
}

export interface TranslationPerformanceState {
  isInitialized: boolean
  isLoading: boolean
  status: any
  alerts: PerformanceAlert[]
  metrics: any
  recommendations: string[]
  error: string | null
}

export interface TranslationPerformanceActions {
  initialize: (application: 'l4h' | 'cannlaw' | 'shared', language: string, loadPaths: string[]) => Promise<void>
  optimize: () => Promise<void>
  reset: () => Promise<void>
  generateReport: () => any
  clearAlerts: () => void
  refreshStatus: () => void
}

export function useTranslationPerformance(
  options: UseTranslationPerformanceOptions = {}
): [TranslationPerformanceState, TranslationPerformanceActions] {
  const {
    enableRealTimeMonitoring = true,
    alertThreshold = 'medium',
    updateInterval = 30000, // 30 seconds
    autoOptimize = false,
    optimizationInterval = 300000 // 5 minutes
  } = options

  const [state, setState] = useState<TranslationPerformanceState>({
    isInitialized: false,
    isLoading: false,
    status: null,
    alerts: [],
    metrics: null,
    recommendations: [],
    error: null
  })

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const optimizationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const alertUnsubscribeRef = useRef<(() => void) | null>(null)

  // Update performance status
  const updateStatus = useCallback(() => {
    try {
      const status = translationPerformanceIntegration.getPerformanceStatus()
      const metrics = translationPerformanceMonitor.getCurrentMetrics()
      const alerts = translationPerformanceMonitor.getAlerts()
        .filter(alert => {
          const severityLevels = ['low', 'medium', 'high', 'critical']
          const thresholdIndex = severityLevels.indexOf(alertThreshold)
          const alertIndex = severityLevels.indexOf(alert.severity)
          return alertIndex >= thresholdIndex
        })

      setState(prev => ({
        ...prev,
        status,
        metrics,
        alerts,
        recommendations: status.overall.recommendations || [],
        error: null
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: (error as Error).message
      }))
    }
  }, [alertThreshold])

  // Initialize performance systems
  const initialize = useCallback(async (
    application: 'l4h' | 'cannlaw' | 'shared',
    language: string,
    loadPaths: string[]
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await translationPerformanceIntegration.initialize(
        application,
        language,
        loadPaths
      )

      if (result.success) {
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          error: null
        }))

        // Start real-time monitoring if enabled
        if (enableRealTimeMonitoring) {
          updateStatus()
          
          updateIntervalRef.current = setInterval(updateStatus, updateInterval)
          
          // Subscribe to alerts
          alertUnsubscribeRef.current = translationPerformanceMonitor.onAlert((alert) => {
            const severityLevels = ['low', 'medium', 'high', 'critical']
            const thresholdIndex = severityLevels.indexOf(alertThreshold)
            const alertIndex = severityLevels.indexOf(alert.severity)
            
            if (alertIndex >= thresholdIndex) {
              setState(prev => ({
                ...prev,
                alerts: [...prev.alerts, alert]
              }))
            }
          })
        }

        // Start auto-optimization if enabled
        if (autoOptimize) {
          optimizationIntervalRef.current = setInterval(async () => {
            try {
              await translationPerformanceIntegration.optimizePerformance()
              updateStatus()
            } catch (error) {
              console.warn('Auto-optimization failed:', error)
            }
          }, optimizationInterval)
        }
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.errors.join(', ') || 'Initialization failed'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message
      }))
    }
  }, [enableRealTimeMonitoring, updateInterval, alertThreshold, autoOptimize, optimizationInterval, updateStatus])

  // Optimize performance
  const optimize = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      await translationPerformanceIntegration.optimizePerformance()
      updateStatus()
      
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message
      }))
    }
  }, [updateStatus])

  // Reset performance systems
  const reset = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      await translationPerformanceIntegration.reset()
      updateStatus()
      
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message
      }))
    }
  }, [updateStatus])

  // Generate performance report
  const generateReport = useCallback(() => {
    try {
      return translationPerformanceIntegration.generatePerformanceReport()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: (error as Error).message
      }))
      return null
    }
  }, [])

  // Clear alerts
  const clearAlerts = useCallback(() => {
    translationPerformanceMonitor.clearAlerts()
    setState(prev => ({ ...prev, alerts: [] }))
  }, [])

  // Refresh status manually
  const refreshStatus = useCallback(() => {
    updateStatus()
  }, [updateStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      
      if (optimizationIntervalRef.current) {
        clearInterval(optimizationIntervalRef.current)
      }
      
      if (alertUnsubscribeRef.current) {
        alertUnsubscribeRef.current()
      }
    }
  }, [])

  // Initial status update when monitoring is enabled
  useEffect(() => {
    if (state.isInitialized && enableRealTimeMonitoring) {
      updateStatus()
    }
  }, [state.isInitialized, enableRealTimeMonitoring, updateStatus])

  const actions: TranslationPerformanceActions = {
    initialize,
    optimize,
    reset,
    generateReport,
    clearAlerts,
    refreshStatus
  }

  return [state, actions]
}

// Simplified hook for basic performance monitoring
export function useTranslationPerformanceBasic() {
  const [metrics, setMetrics] = useState<any>(null)
  const [isHealthy, setIsHealthy] = useState<boolean>(true)

  useEffect(() => {
    const updateMetrics = () => {
      try {
        const status = translationPerformanceIntegration.getPerformanceStatus()
        const currentMetrics = translationPerformanceMonitor.getCurrentMetrics()
        
        setMetrics({
          cacheHitRate: currentMetrics.recentCacheHitRate,
          averageLoadTime: currentMetrics.recentAverageLoadTime,
          errorRate: currentMetrics.recentErrorRate,
          alertCount: currentMetrics.alertCount,
          overallScore: status.overall.score
        })
        
        setIsHealthy(status.overall.healthy)
      } catch (error) {
        console.warn('Failed to update performance metrics:', error)
      }
    }

    // Update immediately
    updateMetrics()

    // Update every 30 seconds
    const interval = setInterval(updateMetrics, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    metrics,
    isHealthy,
    cacheHitRate: metrics?.cacheHitRate || 0,
    averageLoadTime: metrics?.averageLoadTime || 0,
    errorRate: metrics?.errorRate || 0,
    alertCount: metrics?.alertCount || 0,
    overallScore: metrics?.overallScore || 0
  }
}

// Hook for performance alerts only
export function useTranslationPerformanceAlerts(
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])

  useEffect(() => {
    // Get initial alerts
    const initialAlerts = translationPerformanceMonitor.getAlerts(severity)
    setAlerts(initialAlerts)

    // Subscribe to new alerts
    const unsubscribe = translationPerformanceMonitor.onAlert((alert) => {
      const severityLevels = ['low', 'medium', 'high', 'critical']
      const thresholdIndex = severityLevels.indexOf(severity)
      const alertIndex = severityLevels.indexOf(alert.severity)
      
      if (alertIndex >= thresholdIndex) {
        setAlerts(prev => [...prev, alert])
      }
    })

    return unsubscribe
  }, [severity])

  const clearAlerts = useCallback(() => {
    translationPerformanceMonitor.clearAlerts()
    setAlerts([])
  }, [])

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  return {
    alerts,
    alertCount: alerts.length,
    hasAlerts: alerts.length > 0,
    clearAlerts,
    dismissAlert
  }
}