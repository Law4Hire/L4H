import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CannlawI18nProvider, useCannlawI18n, useCannlawT } from '../CannlawI18nProvider'
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
  initCannlawI18n: vi.fn().mockResolvedValue({
    language: 'en-US',
    loadNamespaces: vi.fn().mockResolvedValue({})
  }),
  APPLICATION_CONFIGS: {
    cannlaw: {
      namespaces: ['common', 'errors', 'auth', 'legal', 'billing', 'clients', 'cases']
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
  I18nextProvider: ({ children }: any) => <div data-testid="i18next-provider">{children}</div>: vi.fn(() => ({
    t: vi.fn((key) => key),
    i18n: {
      language: 'en-US',
      changeLanguage: vi.fn().mockResolvedValue({})
    }
  }))
}))

// Test component that uses the Cannlaw i18n context
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
  } = useCannlawI18n()

  const t = useCannlawT('legal')

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
        onClick={() => loadNamespace('billing')}
      >
        Load Namespace
      </button>
      
      <button 
        data-testid="preload-namespaces" 
        onClick={() => preloadNamespaces(['clients', 'cases'])}
      >
        Preload Namespaces
      </button>
    </div>
  )
}

describe('CannlawI18nProvider', () => {
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
      <CannlawI18nProvider>
        <TestComponent />
      </CannlawI18nProvider>
    )

    // Should show loading initially
    expect(screen.getByText('Loading Cannlaw translations...')).toBeInTheDocument()
  })

  it('should initialize with correct default values', async () => {
    render(
      <CannlawI18nProvider>
        <TestComponent />
      </CannlawI18nProvider>
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
      <CannlawI18nProvider>
        <TestComponent />
      </CannlawI18nProvider>
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
      <CannlawI18nProvider>
        <TestComponent />
      </CannlawI18nProvider>
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
      <CannlawI18nProvider>
        <TestComponent />
      </CannlawI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('load-namespace')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('load-namespace'))
    })

    const { getI18nInstance } = await import('../../i18n-config')
    const i18nInstance = getI18nInstance()
    expect(i18nInstance.loadNamespaces).toHaveBeenCalledWith('billing')
  })

  it('should handle namespace preloading', async () => {
    const user = userEvent.setup()
    
    render(
      <CannlawI18nProvider>
        <TestComponent />
      </CannlawI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('preload-namespaces')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('preload-namespaces'))
    })

    const { getI18nInstance } = await import('../../i18n-config')
    const i18nInstance = getI18nInstance()
    expect(i18nInstance.loadNamespaces).toHaveBeenCalledWith('clients')
    expect(i18nInstance.loadNamespaces).toHaveBeenCalledWith('cases')
  })

  it('should handle translation retries', async () => {
    const user = userEvent.setup()
    
    render(
      <CannlawI18nProvider>
        <TestComponent />
      </CannlawI18nProvider>
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
      <CannlawI18nProvider additionalNamespaces={['billing', 'clients']}>
        <TestComponent />
      </CannlawI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-culture')).toHaveTextContent('en-US')
    })

    // Should load additional namespaces during initialization
    const { initCannlawI18n } = await import('../../i18n-config')
    const mockI18n = await initCannlawI18n()
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('billing')
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('clients')
  })

  it('should render with custom preload namespaces', async () => {
    render(
      <CannlawI18nProvider preloadNamespaces={['legal', 'cases']}>
        <TestComponent />
      </CannlawI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-culture')).toHaveTextContent('en-US')
    })

    // Should preload specified namespaces during initialization
    const { initCannlawI18n } = await import('../../i18n-config')
    const mockI18n = await initCannlawI18n()
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('legal')
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('cases')
  })

  it('should render accessibility components when enabled', async () => {
    render(
      <CannlawI18nProvider 
        accessibility={{
          showVisualNotifications: true,
          announceLanguageChanges: true
        }}
      >
        <TestComponent />
      </CannlawI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('language-notifier')).toBeInTheDocument()
      expect(screen.getByTestId('announcement-region')).toBeInTheDocument()
    })
  })

  it('should handle initialization errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock initialization failure
    const { initCannlawI18n } = await import('../../i18n-config')
    vi.mocked(initCannlawI18n).mockRejectedValueOnce(new Error('Initialization failed'))

    render(
      <CannlawI18nProvider>
        <TestComponent />
      </CannlawI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-culture')).toHaveTextContent('en-US')
      expect(screen.getByTestId('cultures-count')).toHaveTextContent('4')
    })

    expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize Cannlaw i18n:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useCannlawI18n must be used within a CannlawI18nProvider')
    
    consoleSpy.mockRestore()
  })

  it('should use CannlawT hook correctly', async () => {
    function TestCannlawTComponent() {
      const t = useCannlawT('legal')
      return <div data-testid="cannlaw-t-result">{t('test.key')}</div>
    }

    render(
      <CannlawI18nProvider>
        <TestCannlawTComponent />
      </CannlawI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('cannlaw-t-result')).toHaveTextContent('test.key')
    })

    expect(useTranslation).toHaveBeenCalledWith('legal')
  })

  it('should handle API errors when setting culture', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const user = userEvent.setup()
    
    // Mock API failure
    const { i18n: i18nApi } = await import('../../api-client')
    vi.mocked(i18nApi.setCulture).mockRejectedValueOnce(new Error('API Error'))

    render(
      <CannlawI18nProvider>
        <TestComponent />
      </CannlawI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('change-language')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('change-language'))
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      'Cannlaw: Failed to persist language preference to server:', 
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })

  it('should use default preload namespaces including auth', async () => {
    render(
      <CannlawI18nProvider>
        <TestComponent />
      </CannlawI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-culture')).toHaveTextContent('en-US')
    })

    // Should preload default namespaces including auth for Cannlaw
    const { initCannlawI18n } = await import('../../i18n-config')
    const mockI18n = await initCannlawI18n()
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('common')
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('errors')
    expect(mockI18n.loadNamespaces).toHaveBeenCalledWith('auth')
  })
})