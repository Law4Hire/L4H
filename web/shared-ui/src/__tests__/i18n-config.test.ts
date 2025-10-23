import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  RTL_LANGUAGES,
  SUPPORTED_LANGUAGES,
  CULTURE_NAMES,
  APPLICATION_NAMESPACES,
  isRTL,
  getTextDirection,
  getTextAlign,
  formatNumber,
  formatDate,
  formatCurrency,
  formatPercentage,
  formatRelativeTime,
  formatDuration,
  formatFileSize,
  setRTLDirection,
  getI18nInstance,
  APPLICATION_CONFIGS
} from '../i18n-config'

// Mock DOM methods
const mockDocumentElement = {
  dir: 'ltr',
  lang: 'en-US',
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn()
  },
  setAttribute: vi.fn(),
  style: {
    setProperty: vi.fn()
  }
}

const mockDocument = {
  documentElement: mockDocumentElement,
  cookie: '',
  dispatchEvent: vi.fn()
}

const mockNavigator = {
  language: 'en-US'
}

// Mock global objects
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
})

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
})

describe('i18n-config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDocument.cookie = ''
    mockNavigator.language = 'en-US'
    mockDocumentElement.dir = 'ltr'
    mockDocumentElement.lang = 'en-US'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Constants', () => {
    it('should have correct RTL languages', () => {
      expect(RTL_LANGUAGES).toContain('ar-SA')
      expect(RTL_LANGUAGES).toContain('ur-PK')
      expect(RTL_LANGUAGES).toContain('ar')
      expect(RTL_LANGUAGES).toContain('ur')
    })

    it('should have 21 supported languages', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(21)
      expect(SUPPORTED_LANGUAGES).toContain('en-US')
      expect(SUPPORTED_LANGUAGES).toContain('ar-SA')
      expect(SUPPORTED_LANGUAGES).toContain('zh-CN')
    })

    it('should have culture names for all supported languages', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(CULTURE_NAMES).toHaveProperty(lang)
        expect(typeof CULTURE_NAMES[lang]).toBe('string')
        expect(CULTURE_NAMES[lang].length).toBeGreaterThan(0)
      })
    })

    it('should have correct application namespaces', () => {
      expect(APPLICATION_NAMESPACES.shared).toEqual(['common', 'errors', 'forms', 'auth'])
      expect(APPLICATION_NAMESPACES.l4h).toEqual(['interview', 'dashboard', 'visa-library', 'pricing'])
      expect(APPLICATION_NAMESPACES.cannlaw).toEqual(['legal', 'billing', 'clients', 'cases'])
    })
  })

  describe('RTL Detection', () => {
    it('should correctly identify RTL languages', () => {
      expect(isRTL('ar-SA')).toBe(true)
      expect(isRTL('ur-PK')).toBe(true)
      expect(isRTL('ar')).toBe(true)
      expect(isRTL('ur')).toBe(true)
    })

    it('should correctly identify LTR languages', () => {
      expect(isRTL('en-US')).toBe(false)
      expect(isRTL('fr-FR')).toBe(false)
      expect(isRTL('zh-CN')).toBe(false)
      expect(isRTL('de-DE')).toBe(false)
    })

    it('should handle language codes without region', () => {
      expect(isRTL('ar')).toBe(true)
      expect(isRTL('en')).toBe(false)
    })
  })

  describe('Text Direction', () => {
    it('should return correct text direction', () => {
      expect(getTextDirection('ar-SA')).toBe('rtl')
      expect(getTextDirection('ur-PK')).toBe('rtl')
      expect(getTextDirection('en-US')).toBe('ltr')
      expect(getTextDirection('fr-FR')).toBe('ltr')
    })
  })

  describe('Text Alignment', () => {
    it('should return correct alignment for LTR languages', () => {
      expect(getTextAlign('en-US', 'start')).toBe('left')
      expect(getTextAlign('en-US', 'end')).toBe('right')
      expect(getTextAlign('en-US', 'center')).toBe('center')
      expect(getTextAlign('en-US', 'left')).toBe('left')
      expect(getTextAlign('en-US', 'right')).toBe('right')
    })

    it('should return correct alignment for RTL languages', () => {
      expect(getTextAlign('ar-SA', 'start')).toBe('right')
      expect(getTextAlign('ar-SA', 'end')).toBe('left')
      expect(getTextAlign('ar-SA', 'center')).toBe('center')
      expect(getTextAlign('ar-SA', 'left')).toBe('left')
      expect(getTextAlign('ar-SA', 'right')).toBe('right')
    })
  })

  describe('Number Formatting', () => {
    it('should format numbers correctly for different locales', () => {
      expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56')
      expect(formatNumber(1234.56, 'de-DE')).toBe('1.234,56')
      expect(formatNumber(1234.56, 'fr-FR')).toBe('1 234,56')
    })

    it('should handle RTL languages with Latin numerals', () => {
      const result = formatNumber(1234.56, 'ar-SA')
      expect(typeof result).toBe('string')
      expect(result).toContain('1234')
    })

    it('should fallback to English for unsupported locales', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = formatNumber(1234.56, 'invalid-locale')
      expect(result).toBe('1,234.56') // English format
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Date Formatting', () => {
    const testDate = new Date('2023-12-25T10:30:00Z')

    it('should format dates correctly for different locales', () => {
      const enResult = formatDate(testDate, 'en-US')
      const deResult = formatDate(testDate, 'de-DE')
      
      expect(typeof enResult).toBe('string')
      expect(typeof deResult).toBe('string')
      expect(enResult).not.toBe(deResult)
    })

    it('should handle RTL languages', () => {
      const result = formatDate(testDate, 'ar-SA')
      expect(typeof result).toBe('string')
    })

    it('should fallback to English for unsupported locales', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = formatDate(testDate, 'invalid-locale')
      expect(typeof result).toBe('string')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Currency Formatting', () => {
    it('should format currency correctly', () => {
      const result = formatCurrency(1234.56, 'en-US', 'USD')
      expect(result).toContain('$')
      expect(result).toContain('1,234.56')
    })

    it('should handle different currencies', () => {
      const eurResult = formatCurrency(1234.56, 'de-DE', 'EUR')
      expect(eurResult).toContain('€')
    })

    it('should fallback for invalid locales', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = formatCurrency(1234.56, 'invalid-locale', 'USD')
      expect(result).toContain('$')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Percentage Formatting', () => {
    it('should format percentages correctly', () => {
      const result = formatPercentage(0.1234, 'en-US')
      expect(result).toContain('%')
      expect(result).toContain('12')
    })

    it('should handle RTL languages', () => {
      const result = formatPercentage(0.1234, 'ar-SA')
      expect(result).toContain('%')
    })
  })

  describe('Relative Time Formatting', () => {
    it('should format relative time correctly', () => {
      const now = new Date()
      const future = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now
      const past = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago

      const futureResult = formatRelativeTime(future, 'en-US')
      const pastResult = formatRelativeTime(past, 'en-US')

      expect(futureResult).toContain('2')
      expect(pastResult).toContain('2')
    })

    it('should handle different locales', () => {
      const now = new Date()
      const future = new Date(now.getTime() + 2 * 60 * 60 * 1000)

      const enResult = formatRelativeTime(future, 'en-US')
      const frResult = formatRelativeTime(future, 'fr-FR')

      expect(typeof enResult).toBe('string')
      expect(typeof frResult).toBe('string')
    })
  })

  describe('Duration Formatting', () => {
    it('should format durations correctly', () => {
      expect(formatDuration(3661, 'en-US')).toContain('1h')
      expect(formatDuration(3661, 'en-US')).toContain('1m')
      expect(formatDuration(3661, 'en-US')).toContain('1s')
    })

    it('should handle zero duration', () => {
      expect(formatDuration(0, 'en-US')).toBe('0s')
    })

    it('should handle different styles', () => {
      const shortResult = formatDuration(3661, 'en-US', { style: 'short' })
      const longResult = formatDuration(3661, 'en-US', { style: 'long' })

      expect(typeof shortResult).toBe('string')
      expect(typeof longResult).toBe('string')
    })
  })

  describe('File Size Formatting', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0, 'en-US')).toBe('0 B')
      expect(formatFileSize(1024, 'en-US')).toBe('1 KB')
      expect(formatFileSize(1048576, 'en-US')).toBe('1 MB')
    })

    it('should handle binary format', () => {
      const result = formatFileSize(1024, 'en-US', { binary: true })
      expect(result).toContain('KiB')
    })

    it('should handle RTL languages', () => {
      const result = formatFileSize(1024, 'ar-SA')
      expect(result).toContain('KB')
    })
  })

  describe('RTL Direction Setting', () => {
    it('should set RTL direction for RTL languages', () => {
      setRTLDirection('ar-SA')

      expect(mockDocumentElement.dir).toBe('rtl')
      expect(mockDocumentElement.lang).toBe('ar-SA')
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('rtl')
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('ltr')
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-direction', 'rtl')
    })

    it('should set LTR direction for LTR languages', () => {
      setRTLDirection('en-US')

      expect(mockDocumentElement.dir).toBe('ltr')
      expect(mockDocumentElement.lang).toBe('en-US')
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('ltr')
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('rtl')
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-direction', 'ltr')
    })

    it('should set CSS custom properties', () => {
      setRTLDirection('ar-SA')

      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--text-align-start', 'right')
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--text-align-end', 'left')
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--is-rtl', '1')
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--is-ltr', '0')
    })

    it('should dispatch direction change events', () => {
      setRTLDirection('ar-SA')

      expect(mockDocument.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'directionchange',
          detail: expect.objectContaining({
            language: 'ar-SA',
            direction: 'rtl',
            isRTL: true
          })
        })
      )
    })

    it('should not update if direction is the same', () => {
      mockDocumentElement.dir = 'rtl'
      vi.clearAllMocks()

      setRTLDirection('ar-SA')

      expect(mockDocumentElement.classList.add).not.toHaveBeenCalled()
      expect(mockDocumentElement.classList.remove).not.toHaveBeenCalled()
    })
  })

  describe('i18n Instance', () => {
    it('should return a singleton instance', () => {
      const instance1 = getI18nInstance()
      const instance2 = getI18nInstance()

      expect(instance1).toBe(instance2)
    })

    it('should be a valid i18next instance', () => {
      const instance = getI18nInstance()

      expect(instance).toBeDefined()
      expect(typeof instance.init).toBe('function')
      expect(typeof instance.changeLanguage).toBe('function')
      expect(typeof instance.t).toBe('function')
    })
  })

  describe('Application Configurations', () => {
    it('should have correct L4H configuration', () => {
      const config = APPLICATION_CONFIGS.l4h

      expect(config.application).toBe('l4h')
      expect(config.namespaces).toEqual([
        ...APPLICATION_NAMESPACES.shared,
        ...APPLICATION_NAMESPACES.l4h
      ])
      expect(config.preloadNamespaces).toEqual(['common', 'errors'])
    })

    it('should have correct Cannlaw configuration', () => {
      const config = APPLICATION_CONFIGS.cannlaw

      expect(config.application).toBe('cannlaw')
      expect(config.namespaces).toEqual([
        ...APPLICATION_NAMESPACES.shared,
        ...APPLICATION_NAMESPACES.cannlaw
      ])
      expect(config.preloadNamespaces).toEqual(['common', 'errors', 'auth'])
    })

    it('should have correct shared configuration', () => {
      const config = APPLICATION_CONFIGS.shared

      expect(config.application).toBe('shared')
      expect(config.namespaces).toEqual(APPLICATION_NAMESPACES.shared)
      expect(config.preloadNamespaces).toEqual(['common', 'errors'])
    })
  })
})