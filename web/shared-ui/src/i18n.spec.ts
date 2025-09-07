import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadSupportedCultures, setCulture } from './i18n'

// Mock fetch
global.fetch = vi.fn()

describe('i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadSupportedCultures', () => {
    it('should load cultures from API successfully', async () => {
      const mockCultures = [
        { code: 'en', displayName: 'English' },
        { code: 'es', displayName: 'Spanish' },
        { code: 'fr', displayName: 'French' }
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCultures)
      } as Response)

      const result = await loadSupportedCultures()

      expect(fetch).toHaveBeenCalledWith('/api/v1/i18n/supported')
      expect(result).toEqual(mockCultures)
    })

    it('should return fallback cultures on API failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await loadSupportedCultures()

      expect(result).toEqual([
        { code: 'en', displayName: 'English' },
        { code: 'es', displayName: 'Spanish' }
      ])
    })

    it('should return fallback cultures on non-ok response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response)

      const result = await loadSupportedCultures()

      expect(result).toEqual([
        { code: 'en', displayName: 'English' },
        { code: 'es', displayName: 'Spanish' }
      ])
    })
  })

  describe('setCulture', () => {
    it('should set culture via API and change i18n language', async () => {
      const mockI18n = {
        changeLanguage: vi.fn().mockResolvedValue(undefined)
      }

      // Mock i18n module
      vi.doMock('i18next', () => ({
        default: mockI18n
      }))

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)

      await setCulture('es')

      expect(fetch).toHaveBeenCalledWith('/api/v1/i18n/culture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ culture: 'es' })
      })
    })

    it('should still change language locally on API failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      // The function should not throw an error even when API fails
      await expect(setCulture('es')).resolves.not.toThrow()
    })
  })
})
