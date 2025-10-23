import { useState, useEffect, useCallback } from 'react'
import { translationLoader, TranslationLoadOptions, LoadResult } from '../services/TranslationLoader'
import { translationErrorHandler } from '../translation-error-handler'

export interface UseTranslationLoaderOptions {
  language: string
  namespaces: string[]
  loadPath: string
  preloadCritical?: boolean
  criticalNamespaces?: string[]
  autoLoad?: boolean
}

export interface TranslationLoaderState {
  isLoading: boolean
  hasError: boolean
  errorMessage?: string
  loadedNamespaces: string[]
  failedNamespaces: string[]
  results: { [namespace: string]: LoadResult }
  retryCount: number
}

export function useTranslationLoader(options: UseTranslationLoaderOptions) {
  const [state, setState] = useState<TranslationLoaderState>({
    isLoading: false,
    hasError: false,
    loadedNamespaces: [],
    failedNamespaces: [],
    results: {},
    retryCount: 0
  })

  const {
    language,
    namespaces,
    loadPath,
    preloadCritical = true,
    criticalNamespaces = ['common', 'errors'],
    autoLoad = true
  } = options

  /**
   * Load translations for specified namespaces
   */
  const loadTranslations = useCallback(async (
    namespacesToLoad: string[] = namespaces,
    priority: boolean = false
  ) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      errorMessage: undefined
    }))

    try {
      const loadRequests: TranslationLoadOptions[] = namespacesToLoad.map(namespace => ({
        language,
        namespace,
        loadPath,
        cache: true
      }))

      const results = await translationLoader.loadMultipleTranslations(
        loadRequests,
        priority ? criticalNamespaces : undefined
      )

      const loadedNamespaces: string[] = []
      const failedNamespaces: string[] = []
      let hasAnyError = false
      let errorMessage: string | undefined

      Object.entries(results).forEach(([key, result]) => {
        const namespace = key.split('-')[1] // Extract namespace from cache key
        if (result.success) {
          loadedNamespaces.push(namespace)
        } else {
          failedNamespaces.push(namespace)
          hasAnyError = true
          if (!errorMessage && result.error) {
            errorMessage = result.error.message
          }
        }
      })

      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: hasAnyError,
        errorMessage,
        loadedNamespaces: [...new Set([...prev.loadedNamespaces, ...loadedNamespaces])],
        failedNamespaces: [...new Set([...prev.failedNamespaces, ...failedNamespaces])],
        results: { ...prev.results, ...results },
        retryCount: Math.max(...Object.values(results).map(r => r.retryCount || 0), prev.retryCount)
      }))

      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        errorMessage,
        failedNamespaces: [...new Set([...prev.failedNamespaces, ...namespacesToLoad])]
      }))

      throw error
    }
  }, [language, namespaces, loadPath, criticalNamespaces])

  /**
   * Preload critical namespaces
   */
  const preloadCriticalNamespaces = useCallback(async () => {
    if (!preloadCritical || criticalNamespaces.length === 0) {
      return
    }

    try {
      const results = await translationLoader.preloadNamespaces(
        language,
        criticalNamespaces,
        loadPath
      )

      const loadedNamespaces: string[] = []
      const failedNamespaces: string[] = []

      Object.entries(results).forEach(([namespace, result]) => {
        if (result.success) {
          loadedNamespaces.push(namespace)
        } else {
          failedNamespaces.push(namespace)
        }
      })

      setState(prev => ({
        ...prev,
        loadedNamespaces: [...new Set([...prev.loadedNamespaces, ...loadedNamespaces])],
        failedNamespaces: [...new Set([...prev.failedNamespaces, ...failedNamespaces])],
        results: { ...prev.results, ...results }
      }))

      return results
    } catch (error) {
      console.error('Failed to preload critical namespaces:', error)
      throw error
    }
  }, [language, loadPath, preloadCritical, criticalNamespaces])

  /**
   * Retry loading failed namespaces
   */
  const retryFailedNamespaces = useCallback(async () => {
    if (state.failedNamespaces.length === 0) {
      return
    }

    return loadTranslations(state.failedNamespaces)
  }, [state.failedNamespaces, loadTranslations])

  /**
   * Load a single namespace on demand
   */
  const loadNamespace = useCallback(async (namespace: string) => {
    const result = await translationLoader.loadTranslation({
      language,
      namespace,
      loadPath,
      cache: true
    })

    const cacheKey = `${language}-${namespace}`
    
    setState(prev => ({
      ...prev,
      loadedNamespaces: result.success 
        ? [...new Set([...prev.loadedNamespaces, namespace])]
        : prev.loadedNamespaces,
      failedNamespaces: result.success
        ? prev.failedNamespaces.filter(ns => ns !== namespace)
        : [...new Set([...prev.failedNamespaces, namespace])],
      results: { ...prev.results, [cacheKey]: result },
      hasError: result.success ? prev.hasError : true,
      errorMessage: result.success ? prev.errorMessage : result.error?.message
    }))

    return result
  }, [language, loadPath])

  /**
   * Clear cache and reload
   */
  const clearCacheAndReload = useCallback(async () => {
    translationLoader.clearCache(language)
    return loadTranslations()
  }, [language, loadTranslations])

  /**
   * Get loading state for a specific namespace
   */
  const getNamespaceState = useCallback((namespace: string) => {
    const cacheKey = `${language}-${namespace}`
    const result = state.results[cacheKey]
    
    return {
      isLoaded: state.loadedNamespaces.includes(namespace),
      hasFailed: state.failedNamespaces.includes(namespace),
      isLoading: state.isLoading,
      result: result || null,
      fromCache: result?.fromCache || false
    }
  }, [language, state])

  // Auto-load translations on mount or when dependencies change
  useEffect(() => {
    if (!autoLoad) return

    let isMounted = true

    const loadInitialTranslations = async () => {
      try {
        // First preload critical namespaces if enabled
        if (preloadCritical) {
          await preloadCriticalNamespaces()
        }

        // Then load all requested namespaces
        if (isMounted) {
          await loadTranslations()
        }
      } catch (error) {
        console.error('Failed to load initial translations:', error)
      }
    }

    loadInitialTranslations()

    return () => {
      isMounted = false
    }
  }, [language, autoLoad, preloadCritical, preloadCriticalNamespaces, loadTranslations])

  // Subscribe to translation error handler state changes
  useEffect(() => {
    const unsubscribe = translationErrorHandler.subscribe((errorState) => {
      // Update state based on error handler notifications
      setState(prev => ({
        ...prev,
        hasError: errorState.hasError,
        errorMessage: errorState.errorMessage,
        retryCount: Math.max(prev.retryCount, errorState.retryCount)
      }))
    })

    return unsubscribe
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    loadTranslations,
    preloadCriticalNamespaces,
    retryFailedNamespaces,
    loadNamespace,
    clearCacheAndReload,
    
    // Utilities
    getNamespaceState,
    
    // Computed properties
    isAllLoaded: state.loadedNamespaces.length === namespaces.length && state.failedNamespaces.length === 0,
    hasPartialLoad: state.loadedNamespaces.length > 0 && state.failedNamespaces.length > 0,
    loadProgress: namespaces.length > 0 ? state.loadedNamespaces.length / namespaces.length : 0
  }
}