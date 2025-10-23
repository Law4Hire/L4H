import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { translationLoader } from '../services/TranslationLoader'
import { translationErrorHandler } from '../translation-error-handler'
import { getI18nInstance, initL4HI18n, initCannlawI18n } from '../i18n-config'

// Mock fetch for translation loading tests
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock console methods
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  log: vi.spyOn(console, 'log').mockImplementation(() => {})
}

describe('Translation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    
    // Reset error handler state
    translationErrorHandler.clearErrors()
    
    // Mock successful translation responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        'test.key': 'Test Value',
        'common.button.save': 'Save',
        'common.button.cancel': 'Cancel'
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.values(consoleSpy).forEach(spy => spy.mockRestore())
  })

  describe('Translation Loading', () => {
    it('should load translations successfully', async () => {
      const result = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true,
        maxRetries: 3,
        retryDelay: 100
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        'test.key': 'Test Value',
        'common.button.save': 'Save',
        'common.button.cancel': 'Cancel'
      })
      expect(mockFetch).toHaveBeenCalledWith('/locales/en-US/common.json')
    })

    it('should handle translation loading failures with retries', async () => {
      // Mock fetch to fail initially, then succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 'test.key': 'Test Value' })
        })

      const result = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true,
        maxRetries: 3,
        retryDelay: 10 // Short delay for testing
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ 'test.key': 'Test Value' })
      expect(mockFetch).toHaveBeenCalledTimes(3) // 2 failures + 1 success
    })

    it('should fail after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent network error'))

      const result = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true,
        maxRetries: 2,
        retryDelay: 10
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
      expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should handle 404 responses gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const result = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'nonexistent',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true,
        maxRetries: 1,
        retryDelay: 10
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('404')
    })

    it('should cache successful translations', async () => {
      const translationData = { 'test.key': 'Cached Value' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(translationData)
      })

      // First load
      const result1 = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true,
        maxRetries: 1,
        retryDelay: 10
      })

      // Second load should use cache
      const result2 = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true,
        maxRetries: 1,
        retryDelay: 10
      })

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.data).toEqual(translationData)
      expect(result2.data).toEqual(translationData)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only called once due to caching
    })

    it('should preload multiple namespaces', async () => {
      const namespaces = ['common', 'errors', 'forms']
      
      mockFetch.mockImplementation((url) => {
        const namespace = url.split('/').pop()?.replace('.json', '')
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            [`${namespace}.test`]: `${namespace} test value`
          })
        })
      })

      await translationLoader.preloadNamespaces(
        'en-US',
        namespaces,
        '/locales/{{lng}}/{{ns}}.json'
      )

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch).toHaveBeenCalledWith('/locales/en-US/common.json')
      expect(mockFetch).toHaveBeenCalledWith('/locales/en-US/errors.json')
      expect(mockFetch).toHaveBeenCalledWith('/locales/en-US/forms.json')
    })
  })

  describe('Error Handling Integration', () => {
    it('should record translation errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'))

      await translationLoader.loadTranslation({
        language: 'fr-FR',
        namespace: 'interview',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true,
        maxRetries: 1,
        retryDelay: 10
      })

      const errors = translationErrorHandler.getErrors()
      expect(errors.length).toBeGreaterThan(0)
      
      const error = errors.find(e => 
        e.language === 'fr-FR' && 
        e.namespace === 'interview' &&
        e.errorType === 'loading_failed'
      )
      expect(error).toBeDefined()
    })

    it('should record successful loads', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 'test.key': 'Success' })
      })

      await translationLoader.loadTranslation({
        language: 'es-ES',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true,
        maxRetries: 1,
        retryDelay: 10
      })

      // Should not have errors for successful loads
      const errors = translationErrorHandler.getErrors()
      const relevantError = errors.find(e => 
        e.language === 'es-ES' && 
        e.namespace === 'common'
      )
      expect(relevantError).toBeUndefined()
    })

    it('should track error statistics', async () => {
      // Generate some errors
      mockFetch.mockRejectedValue(new Error('Test error'))

      await Promise.all([
        translationLoader.loadTranslation({
          language: 'fr-FR',
          namespace: 'common',
          loadPath: '/locales/{{lng}}/{{ns}}.json',
          cache: false,
          maxRetries: 1,
          retryDelay: 10
        }),
        translationLoader.loadTranslation({
          language: 'fr-FR',
          namespace: 'errors',
          loadPath: '/locales/{{lng}}/{{ns}}.json',
          cache: false,
          maxRetries: 1,
          retryDelay: 10
        }),
        translationLoader.loadTranslation({
          language: 'de-DE',
          namespace: 'common',
          loadPath: '/locales/{{lng}}/{{ns}}.json',
          cache: false,
          maxRetries: 1,
          retryDelay: 10
        })
      ])

      const stats = translationErrorHandler.getStatistics()
      expect(stats.totalErrors).toBeGreaterThanOrEqual(3)
      expect(stats.errorsByLanguage['fr-FR']).toBeGreaterThanOrEqual(2)
      expect(stats.errorsByLanguage['de-DE']).toBeGreaterThanOrEqual(1)
      expect(stats.errorsByNamespace['common']).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Fallback System Integration', () => {
    it('should fallback to English when primary language fails', async () => {
      // Mock primary language failure, English success
      mockFetch.mockImplementation((url) => {
        if (url.includes('fr-FR')) {
          return Promise.reject(new Error('French translation not found'))
        }
        if (url.includes('en-US')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              'test.key': 'English fallback value'
            })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      // This would typically be handled by i18next's fallback mechanism
      // We're testing our loader's behavior when fallback is needed
      const primaryResult = await translationLoader.loadTranslation({
        language: 'fr-FR',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: false,
        maxRetries: 1,
        retryDelay: 10
      })

      const fallbackResult = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: false,
        maxRetries: 1,
        retryDelay: 10
      })

      expect(primaryResult.success).toBe(false)
      expect(fallbackResult.success).toBe(true)
      expect(fallbackResult.data).toEqual({
        'test.key': 'English fallback value'
      })
    })

    it('should handle multiple load path fallbacks', async () => {
      const loadPaths = [
        '/locales/shared/{{lng}}/{{ns}}.json',
        '/locales/l4h/{{lng}}/{{ns}}.json',
        '/locales/{{lng}}/{{ns}}.json'
      ]

      // Mock first two paths to fail, third to succeed
      mockFetch.mockImplementation((url) => {
        if (url.includes('/locales/shared/') || url.includes('/locales/l4h/')) {
          return Promise.reject(new Error('Path not found'))
        }
        if (url.includes('/locales/en-US/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              'fallback.key': 'Fallback path value'
            })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      // Test each path in sequence (simulating backend behavior)
      let result
      for (const loadPath of loadPaths) {
        result = await translationLoader.loadTranslation({
          language: 'en-US',
          namespace: 'common',
          loadPath,
          cache: false,
          maxRetries: 1,
          retryDelay: 10
        })
        
        if (result.success) break
      }

      expect(result?.success).toBe(true)
      expect(result?.data).toEqual({
        'fallback.key': 'Fallback path value'
      })
    })
  })

  describe('i18n Instance Integration', () => {
    it('should maintain singleton i18n instance', () => {
      const instance1 = getI18nInstance()
      const instance2 = getI18nInstance()
      
      expect(instance1).toBe(instance2)
      expect(instance1).toBeDefined()
      expect(typeof instance1.init).toBe('function')
    })

    it('should initialize L4H i18n with correct configuration', async () => {
      const i18n = await initL4HI18n()
      
      expect(i18n).toBeDefined()
      expect(i18n.language).toBeDefined()
      expect(typeof i18n.changeLanguage).toBe('function')
      expect(typeof i18n.loadNamespaces).toBe('function')
    })

    it('should initialize Cannlaw i18n with correct configuration', async () => {
      const i18n = await initCannlawI18n()
      
      expect(i18n).toBeDefined()
      expect(i18n.language).toBeDefined()
      expect(typeof i18n.changeLanguage).toBe('function')
      expect(typeof i18n.loadNamespaces).toBe('function')
    })

    it('should handle i18n initialization errors', async () => {
      // Mock i18n init to fail
      const i18n = getI18nInstance()
      const originalInit = i18n.init
      i18n.init = vi.fn().mockRejectedValue(new Error('Init failed'))

      try {
        await initL4HI18n()
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Init failed')
      }

      // Restore original init
      i18n.init = originalInit
    })
  })

  describe('Component Integration', () => {
    it('should handle translation rendering with missing keys', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          'existing.key': 'Existing Value'
          // 'missing.key' is intentionally not included
        })
      })

      const result = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: false,
        maxRetries: 1,
        retryDelay: 10
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('existing.key')
      expect(result.data).not.toHaveProperty('missing.key')
    })

    it('should handle interpolation in translations', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          'welcome.message': 'Welcome, {{name}}!',
          'item.count': 'You have {{count}} items',
          'complex.interpolation': 'Hello {{name}}, you have {{count}} {{item, plural, one {item} other {items}}}'
        })
      })

      const result = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: false,
        maxRetries: 1,
        retryDelay: 10
      })

      expect(result.success).toBe(true)
      expect(result.data['welcome.message']).toContain('{{name}}')
      expect(result.data['item.count']).toContain('{{count}}')
      expect(result.data['complex.interpolation']).toContain('{{name}}')
      expect(result.data['complex.interpolation']).toContain('{{count}}')
    })

    it('should handle nested translation keys', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          'button': {
            'save': 'Save',
            'cancel': 'Cancel',
            'delete': 'Delete'
          },
          'form': {
            'validation': {
              'required': 'This field is required',
              'email': 'Please enter a valid email'
            }
          }
        })
      })

      const result = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: false,
        maxRetries: 1,
        retryDelay: 10
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('button')
      expect(result.data).toHaveProperty('form')
      expect(typeof result.data.button).toBe('object')
      expect(typeof result.data.form).toBe('object')
    })
  })

  describe('Performance Integration', () => {
    it('should handle concurrent translation loading', async () => {
      const languages = ['en-US', 'es-ES', 'fr-FR', 'de-DE']
      const namespaces = ['common', 'errors', 'forms']

      mockFetch.mockImplementation((url) => {
        // Simulate network delay
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                'test.key': `Value for ${url}`
              })
            })
          }, Math.random() * 50) // Random delay up to 50ms
        })
      })

      const loadPromises = languages.flatMap(language =>
        namespaces.map(namespace =>
          translationLoader.loadTranslation({
            language,
            namespace,
            loadPath: '/locales/{{lng}}/{{ns}}.json',
            cache: true,
            maxRetries: 1,
            retryDelay: 10
          })
        )
      )

      const results = await Promise.all(loadPromises)

      expect(results).toHaveLength(12) // 4 languages × 3 namespaces
      expect(results.every(result => result.success)).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(12)
    })

    it('should handle memory cleanup for large translation sets', async () => {
      // Load a large number of translations
      const largeTranslationSet = {}
      for (let i = 0; i < 1000; i++) {
        largeTranslationSet[`key.${i}`] = `Value ${i}`
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(largeTranslationSet)
      })

      const result = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'large',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true,
        maxRetries: 1,
        retryDelay: 10
      })

      expect(result.success).toBe(true)
      expect(Object.keys(result.data!)).toHaveLength(1000)

      // Clear cache to test memory cleanup
      translationLoader.clearCache()

      // Verify cache is cleared by loading again
      const result2 = await translationLoader.loadTranslation({
        language: 'en-US',
        namespace: 'large',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true,
        maxRetries: 1,
        retryDelay: 10
      })

      expect(result2.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2) // Called twice due to cache clear
    })
  })
})