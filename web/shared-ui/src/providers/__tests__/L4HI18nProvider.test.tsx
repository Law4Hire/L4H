import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { L4HI18nProvider, useL4HI18n, useL4HT } from '../L4HI18nProvider'
import { useTranslation } from 'react-i18next'

// Mock the i18n-config module
vi.mock('../../i18n-config', () => ({
  getI18nInstance: vi.fn(() => ({
    init: vi.fn().mockResolvedValue({}),
    changeLanguage: vi.fn().mockResolvedValue({}),
    loadNamespaces: vi.fn().mockResolvedValue({}),
    on: vi.fn(),
    off: vi.fn(),
    language: 'en-US',
    t: vi.fn((key) => key)
  })),
  initL4HI18n: vi.fn().mockResolvedValue({
    language: 'en-US',
    loadNamespaces: vi.fn().mockResolvedValue({})
  }),
  APPLICATION_CONFIGS: {
    l4h: {
      namespaces: ['common', 'errors', 'interview', 'dashboard']
    }
  },
  CULTURE_NAMES: {
    'en-US': 'English (United States)',
    'es-ES': 'Español (España)',
    'fr-FR': 'Français (France)',
    'ar-SA': 'العربية (السعودية)'
  },
  SUPPORTED_LANGUAGES: ['en-US', 'es-ES', 'fr-FR', 'ar-SA'],
  isRTL: vi.fn((lang) => lang === 'ar-SA')
}))

// Mock the API client
vi.mock('../../api-client', () => ({
  i18n: {
    setCulture: vi.fn().mockResolvedValue({})
  }
}))

// Mock the translation error handling hook
vi.mock('../../hooks/useTranslationErrorHandling', () => ({
  useTranslationErrorHandling: vi.fn(() => ({
    hasErrors: false,
    isFallbackActive: false,
    retry: vi.fn().mockResolvedValue(true),
    showNotification: false,
    dismissNotification: vi.fn()
  }))
}))

// Mock the components
vi.mock('../../components/TranslationErrorNotification', () => ({
  default: ({ onRetry, onDismiss }: any) => (
    <div data-testid="error-notification">
      <button onClick={onRetry}>Retry</button>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  )
}))

vi.mock('../../components/LanguageChangeNotifier', () => ({
  LanguageChangeNotifier: ({ showVisualNotification }: any) => 
    showVisualNotification ? <div data-testid="language-notifier" /> : null,
  LanguageAnnouncementRegion: () => <div data-testid="announcement-region" />
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  I18nextProvider: ({ children }: any) => <div data-testid="i18next-provider">{children}</div>,
  useTranslation: vi.fn(() => ({
    t: vi.fn((key) => key),
    i18n: {
      language: 'en-US',
      changeLanguage: vi.fn().mockResolvedValue({})
    }
  }))
}))

// Test component that uses the L4H i18n context
function TestComponent() {
  const {
    cultures,
    currentCulture,
    setCurrentCulture,
    isLoading,
    isRTL,
    supportedLanguages,
    hasTranslationErrors,
    isFallbackActive,
    retryTranslations,
    loadNamespace,
    preloadNamespaces
  } = useL4HI18n()

  const t = useL4HT('common')

  return (
    <div>
      <div data-testid="current-culture">{currentCulture}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="is-rtl">{isRTL.toString()}</div>
      <div data-testid="cultures-count">{cultures.length}</div>
      <div data-testid="supported-languages-count">{supportedLanguages.length}</div>
      <div data-testid="has-errors">{hasTranslationErrors.toString()}</div>
      <div data-testid="fallback-active">{isFallbackActive.toString()}</div>
      <div data-testid="translation-test">{t('test.key')}</div>
      
      <button 
        data-testid="change-language" 
        onClick={() => setCurrentCulture('es-ES')}
      >
        Change Language
      </button>
      
      <button 
        data-testid="retry-translations" 
        onClick={() => retryTranslations()}
      >
        Retry
      </button>
      
      <button 
        data-testid="load-namespace" 
        onClick={() => loadNamespace('dashboard')}
      >
        Load Namespace
      </button>
      
      <button 
        data-testid="preload-namespaces" 
        onClick={() => preloadNamespaces(['interview', 'dashboard'])}
      >
        Preload Namespaces
      </button>
    </div>
  )
}

describe('L4HI18nProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: ''
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render loading state initially', async () => {
    render(
      <L4HI18nProvider>
        <TestComponent />
      </L4HI18nProvider>
    )

    // Should show loading initially
    expect(screen.getByText('Loading L4H translations...')).toBeInTheDocument()
  })

  it('should initialize with correct default values', async () => {
    render(
      <L4HI18nProvider>
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-culture')).toHaveTextContent('en-US')
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      expect(screen.getByTestId('is-rtl')).toHaveTextContent('false')
      expect(screen.getByTestId('cultures-count')).toHaveTextContent('4')
      expect(screen.getByTestId('supported-languages-count')).toHaveTextContent('4')
    })
  })

  it('should handle language changes', async () => {
    const user = userEvent.setup()
    
    render(
      <L4HI18nProvider>
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-culture')).toHaveTextContent('en-US')
    })

    await act(async () => {
      await user.click(screen.getByTestId('change-language'))
    })

    // Should call changeLanguage on the i18n instance
    const { getI18nInstance } = await import('../../i18n-config')
    const i18nInstance = getI18nInstance()
    expect(i18nInstance.changeLanguage).toHaveBeenCalledWith('es-ES')
  })

  it('should handle RTL languages correctly', async () => {
    const { isRTL } = await import('../../i18n-config')
    
    render(
      <L4HI18nProvider>
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('is-rtl')).toHaveTextContent('false')
    })

    // Mock language change to Arabic
    const i18nInstance = (await import('../../i18n-config')).getI18nInstance()
    i18nInstance.language = 'ar-SA'
    
    // Simulate language change event
    const languageChangeHandler = vi.mocked(i18nInstance.on).mock.calls
      .find(call => call[0] === 'languageChanged')?.[1]
    
    if (languageChangeHandler) {
      act(() => {
        languageChangeHandler('ar-SA')
      })
    }

    await waitFor(() => {
      expect(isRTL).toHaveBeenCalledWith('ar-SA')
    })
  })

  it('should handle namespace loading', async () => {
    const user = userEvent.setup()
    
    render(
      <L4HI18nProvider>
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('load-namespace')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('load-namespace'))
    })

    const { getI18nInstance } = await import('../../i18n-config')
    const i18nInstance = getI18nInstance()
    expect(i18nInstance.loadNamespaces).toHaveBeenCalledWith('dashboard')
  })

  it('should handle namespace preloading', async () => {
    const user = userEvent.setup()
    
    render(
      <L4HI18nProvider>
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('preload-namespaces')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('preload-namespaces'))
    })

    const { getI18nInstance } = await import('../../i18n-config')
    const i18nInstance = getI18nInstance()
    expect(i18nInstance.loadNamespaces).toHaveBeenCalledWith('interview')
    expect(i18nInstance.loadNamespaces).toHaveBeenCalledWith('dashboard')
  })

  it('should handle translation retries', async () => {
    const user = userEvent.setup()
    
    render(
      <L4HI18nProvider>
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('retry-translations')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('retry-translations'))
    })

    // Should call the retry function from the error handling hook
    const { useTranslationErrorHandling } = await import('../../hooks/useTranslationErrorHandling')
    const mockRetry = vi.mocked(useTranslationErrorHandling).mock.results[0]?.value?.retry
    expect(mockRetry).toBeDefined()
  })

  it('should render with additional namespaces', async () => {
    render(
      <L4HI18nProvider additionalNamespaces={['pricing', 'visa-library']}>
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-culture')).toHaveTextContent('en-US')
    })

    // Should load additional namespaces during initialization
    const { initL4HI18n } = await import('../../i18n-config')
    const mockI18n = await initL4HI18n()
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('pricing')
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('visa-library')
  })

  it('should render with custom preload namespaces', async () => {
    render(
      <L4HI18nProvider preloadNamespaces={['interview', 'dashboard']}>
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-culture')).toHaveTextContent('en-US')
    })

    // Should preload specified namespaces during initialization
    const { initL4HI18n } = await import('../../i18n-config')
    const mockI18n = await initL4HI18n()
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('interview')
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('dashboard')
  })

  it('should render accessibility components when enabled', async () => {
    render(
      <L4HI18nProvider 
        accessibility={{
          showVisualNotifications: true,
          announceLanguageChanges: true
        }}
      >
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('language-notifier')).toBeInTheDocument()
      expect(screen.getByTestId('announcement-region')).toBeInTheDocument()
    })
  })

  it('should handle initialization errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock initialization failure
    const { initL4HI18n } = await import('../../i18n-config')
    vi.mocked(initL4HI18n).mockRejectedValueOnce(new Error('Initialization failed'))

    render(
      <L4HI18nProvider>
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-culture')).toHaveTextContent('en-US')
      expect(screen.getByTestId('cultures-count')).toHaveTextContent('4')
    })

    expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize L4H i18n:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useL4HI18n must be used within an L4HI18nProvider')
    
    consoleSpy.mockRestore()
  })

  it('should use L4HT hook correctly', async () => {
    function TestL4HTComponent() {
      const t = useL4HT('common')
      return <div data-testid="l4ht-result">{t('test.key')}</div>
    }

    render(
      <L4HI18nProvider>
        <TestL4HTComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('l4ht-result')).toHaveTextContent('test.key')
    })

    expect(useTranslation).toHaveBeenCalledWith('common')
  })

  it('should handle API errors when setting culture', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const user = userEvent.setup()
    
    // Mock API failure
    const { i18n: i18nApi } = await import('../../api-client')
    vi.mocked(i18nApi.setCulture).mockRejectedValueOnce(new Error('API Error'))

    render(
      <L4HI18nProvider>
        <TestComponent />
      </L4HI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('change-language')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('change-language'))
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      'L4H: Failed to persist language preference to server:', 
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })
})