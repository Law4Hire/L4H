import { TranslationLoader } from '../TranslationLoader'

// Mock fetch for testing
global.fetch = jest.fn()

describe('TranslationLoader', () => {
  let loader: TranslationLoader
  
  beforeEach(() => {
    loader = new TranslationLoader()
    jest.clearAllMocks()
  })

  afterEach(() => {
    loader.clearCache()
  })

  describe('loadTranslation', () => {
    it('should load translation successfully', async () => {
      const mockTranslation = { hello: 'Hello', world: 'World' }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTranslation)
      })

      const result = await loader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTranslation)
      expect(result.fromCache).toBe(false)
    })

    it('should return cached result on second call', async () => {
      const mockTranslation = { hello: 'Hello', world: 'World' }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTranslation)
      })

      // First call
      await loader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json'
      })

      // Second call should use cache
      const result = await loader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTranslation)
      expect(result.fromCache).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure with exponential backoff', async () => {
      ;(fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hello: 'Hello' })
        })

      const result = await loader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        maxRetries: 3,
        retryDelay: 10 // Short delay for testing
      })

      expect(result.success).toBe(true)
      expect(result.retryCount).toBe(2)
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await loader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        maxRetries: 2,
        retryDelay: 10
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
      expect(result.retryCount).toBe(2)
      expect(fetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })

  describe('preloadNamespaces', () => {
    it('should preload multiple namespaces', async () => {
      const mockCommon = { hello: 'Hello' }
      const mockErrors = { error: 'Error' }
      
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCommon)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockErrors)
        })

      const results = await loader.preloadNamespaces(
        'en-US',
        ['common', 'errors'],
        '/locales/{{lng}}/{{ns}}.json'
      )

      expect(results.common.success).toBe(true)
      expect(results.common.data).toEqual(mockCommon)
      expect(results.errors.success).toBe(true)
      expect(results.errors.data).toEqual(mockErrors)
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('cache management', () => {
    it('should clear cache for specific language/namespace', async () => {
      const mockTranslation = { hello: 'Hello' }
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTranslation)
      })

      // Load translation
      await loader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json'
      })

      // Clear specific cache
      loader.clearCache('en-US', 'common')

      // Next call should fetch again
      await loader.loadTranslation({
        language: 'en-US',
        namespace: 'common',
        loadPath: '/locales/{{lng}}/{{ns}}.json'
      })

      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should provide cache statistics', () => {
      const stats = loader.getCacheStats()
      
      expect(stats).toHaveProperty('totalEntries')
      expect(stats).toHaveProperty('cacheHitRate')
      expect(stats).toHaveProperty('expiredEntries')
      expect(stats).toHaveProperty('cacheSize')
    })
  })
})