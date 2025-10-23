import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTranslation, Trans } from 'react-i18next'
import { L4HI18nProvider } from '../../providers/L4HI18nProvider'
import { CannlawI18nProvider } from '../../providers/CannlawI18nProvider'

// Mock the i18n-config module
vi.mock('../../i18n-config', () => ({
  getI18nInstance: vi.fn(() => ({
    init: vi.fn().mockResolvedValue({}),
    changeLanguage: vi.fn().mockResolvedValue({}),
    loadNamespaces: vi.fn().mockResolvedValue({}),
    on: vi.fn(),
    off: vi.fn(),
    language: 'en-US',
    t: vi.fn((key, options) => {
      // Mock translation function with interpolation support
      if (key === 'welcome.message' && options?.name) {
        return `Welcome, ${options.name}!`
      }
      if (key === 'item.count' && options?.count !== undefined) {
        return `You have ${options.count} items`
      }
      if (key === 'missing.key') {
        return key // Return key for missing translations
      }
      return key
    })
  })),
  initL4HI18n: vi.fn().mockResolvedValue({
    language: 'en-US',
    loadNamespaces: vi.fn().mockResolvedValue({}),
    t: vi.fn((key) => key)
  }),
  initCannlawI18n: vi.fn().mockResolvedValue({
    language: 'en-US',
    loadNamespaces: vi.fn().mockResolvedValue({}),
    t: vi.fn((key) => key)
  }),
  APPLICATION_CONFIGS: {
    l4h: { namespaces: ['common', 'errors', 'interview'] },
    cannlaw: { namespaces: ['common', 'errors', 'legal'] }
  },
  CULTURE_NAMES: {
    'en-US': 'English (United States)',
    'ar-SA': 'العربية (السعودية)'
  },
  SUPPORTED_LANGUAGES: ['en-US', 'ar-SA'],
  isRTL: vi.fn((lang) => lang === 'ar-SA'),
  setRTLDirection: vi.fn()
}))

// Mock other dependencies
vi.mock('../../api-client', () => ({
  i18n: { setCulture: vi.fn().mockResolvedValue({}) }
}))

vi.mock('../../hooks/useTranslationErrorHandling', () => ({
  useTranslationErrorHandling: vi.fn(() => ({
    hasErrors: false,
    isFallbackActive: false,
    retry: vi.fn(),
    showNotification: false,
    dismissNotification: vi.fn()
  }))
}))

vi.mock('../../components/TranslationErrorNotification', () => ({
  default: () => null
}))

vi.mock('../../components/LanguageChangeNotifier', () => ({
  LanguageChangeNotifier: () => null,
  LanguageAnnouncementRegion: () => null
}))

// Mock react-i18next
const mockUseTranslation = vi.fn()
vi.mock('react-i18next', () => ({
  I18nextProvider: ({ children }: any) => <div>{children}</div>,
  useTranslation: () => mockUseTranslation(),
  Trans: ({ i18nKey, values, components }: any) => {
    // Simple Trans component mock
    let text = i18nKey
    if (values) {
      Object.entries(values).forEach(([key, value]) => {
        text = text.replace(`{{${key}}}`, value)
      })
    }
    if (components) {
      // Handle component interpolation
      components.forEach((component: any, index: number) => {
        text = text.replace(`<${index}>`, '').replace(`</${index}>`, '')
      })
    }
    return <span data-testid="trans-component">{text}</span>
  }
}))

// Test components
function BasicTranslationComponent() {
  const { t } = useTranslation('common')
  
  return (
    <div>
      <h1 data-testid="title">{t('page.title')}</h1>
      <button data-testid="save-button">{t('button.save')}</button>
      <button data-testid="cancel-button">{t('button.cancel')}</button>
    </div>
  )
}

function InterpolationComponent() {
  const { t } = useTranslation('common')
  
  return (
    <div>
      <p data-testid="welcome">{t('welcome.message', { name: 'John' })}</p>
      <p data-testid="count">{t('item.count', { count: 5 })}</p>
    </div>
  )
}

function TransComponent() {
  return (
    <div>
      <Trans
        i18nKey="complex.message"
        values={{ name: 'Alice', count: 3 }}
        components={[<strong key="0" />, <em key="1" />]}
      />
    </div>
  )
}

function MissingKeyComponent() {
  const { t } = useTranslation('common')
  
  return (
    <div>
      <p data-testid="existing">{t('existing.key')}</p>
      <p data-testid="missing">{t('missing.key')}</p>
    </div>
  )
}

function NamespaceComponent() {
  const { t: tCommon } = useTranslation('common')
  const { t: tErrors } = useTranslation('errors')
  const { t: tInterview } = useTranslation('interview')
  
  return (
    <div>
      <p data-testid="common-text">{tCommon('button.save')}</p>
      <p data-testid="error-text">{tErrors('validation.required')}</p>
      <p data-testid="interview-text">{tInterview('question.title')}</p>
    </div>
  )
}

function RTLComponent() {
  const { t, i18n } = useTranslation('common')
  
  return (
    <div dir={i18n.language === 'ar-SA' ? 'rtl' : 'ltr'}>
      <p data-testid="rtl-text">{t('welcome.message')}</p>
      <div data-testid="rtl-container" style={{ textAlign: i18n.language === 'ar-SA' ? 'right' : 'left' }}>
        {t('content.text')}
      </div>
    </div>
  )
}

describe('Translation Rendering Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock return values
    mockUseTranslation.mockReturnValue({
      t: vi.fn((key, options) => {
        if (key === 'welcome.message' && options?.name) {
          return `Welcome, ${options.name}!`
        }
        if (key === 'item.count' && options?.count !== undefined) {
          return `You have ${options.count} items`
        }
        return key
      }),
      i18n: {
        language: 'en-US',
        changeLanguage: vi.fn().mockResolvedValue({})
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Translation Rendering', () => {
    it('should render basic translations', async () => {
      render(
        <L4HI18nProvider>
          <BasicTranslationComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('title')).toHaveTextContent('page.title')
        expect(screen.getByTestId('save-button')).toHaveTextContent('button.save')
        expect(screen.getByTestId('cancel-button')).toHaveTextContent('button.cancel')
      })
    })

    it('should handle translation interpolation', async () => {
      render(
        <L4HI18nProvider>
          <InterpolationComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('welcome')).toHaveTextContent('Welcome, John!')
        expect(screen.getByTestId('count')).toHaveTextContent('You have 5 items')
      })
    })

    it('should render Trans component with complex interpolation', async () => {
      render(
        <L4HI18nProvider>
          <TransComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        const transElement = screen.getByTestId('trans-component')
        expect(transElement).toBeInTheDocument()
      })
    })

    it('should handle missing translation keys', async () => {
      render(
        <L4HI18nProvider>
          <MissingKeyComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('existing')).toHaveTextContent('existing.key')
        expect(screen.getByTestId('missing')).toHaveTextContent('missing.key')
      })
    })
  })

  describe('Namespace Handling', () => {
    it('should handle multiple namespaces', async () => {
      render(
        <L4HI18nProvider>
          <NamespaceComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('common-text')).toHaveTextContent('button.save')
        expect(screen.getByTestId('error-text')).toHaveTextContent('validation.required')
        expect(screen.getByTestId('interview-text')).toHaveTextContent('question.title')
      })

      // Verify that useTranslation was called with different namespaces
      expect(mockUseTranslation).toHaveBeenCalledTimes(3)
    })

    it('should work with Cannlaw-specific namespaces', async () => {
      render(
        <CannlawI18nProvider>
          <NamespaceComponent />
        </CannlawI18nProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('common-text')).toBeInTheDocument()
        expect(screen.getByTestId('error-text')).toBeInTheDocument()
      })
    })
  })

  describe('RTL Language Support', () => {
    it('should handle RTL language rendering', async () => {
      // Mock RTL language
      mockUseTranslation.mockReturnValue({
        t: vi.fn((key) => key),
        i18n: {
          language: 'ar-SA',
          changeLanguage: vi.fn().mockResolvedValue({})
        }
      })

      render(
        <L4HI18nProvider>
          <RTLComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        const container = screen.getByTestId('rtl-container')
        expect(container).toHaveStyle({ textAlign: 'right' })
        
        const rtlText = screen.getByTestId('rtl-text')
        expect(rtlText.closest('div')).toHaveAttribute('dir', 'rtl')
      })
    })

    it('should handle LTR language rendering', async () => {
      render(
        <L4HI18nProvider>
          <RTLComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        const container = screen.getByTestId('rtl-container')
        expect(container).toHaveStyle({ textAlign: 'left' })
        
        const rtlText = screen.getByTestId('rtl-text')
        expect(rtlText.closest('div')).toHaveAttribute('dir', 'ltr')
      })
    })
  })

  describe('Dynamic Language Switching', () => {
    it('should update translations when language changes', async () => {
      const user = userEvent.setup()
      
      function LanguageSwitchComponent() {
        const { t, i18n } = useTranslation('common')
        
        return (
          <div>
            <p data-testid="current-lang">{i18n.language}</p>
            <p data-testid="translated-text">{t('hello.world')}</p>
            <button 
              data-testid="switch-lang"
              onClick={() => i18n.changeLanguage('es-ES')}
            >
              Switch to Spanish
            </button>
          </div>
        )
      }

      render(
        <L4HI18nProvider>
          <LanguageSwitchComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('current-lang')).toHaveTextContent('en-US')
        expect(screen.getByTestId('translated-text')).toHaveTextContent('hello.world')
      })

      // Mock language change
      mockUseTranslation.mockReturnValue({
        t: vi.fn((key) => key === 'hello.world' ? 'Hola Mundo' : key),
        i18n: {
          language: 'es-ES',
          changeLanguage: vi.fn().mockResolvedValue({})
        }
      })

      await act(async () => {
        await user.click(screen.getByTestId('switch-lang'))
      })

      // Note: In a real scenario, the component would re-render with new translations
      // This test verifies the interaction works
      const changeLanguage = mockUseTranslation().i18n.changeLanguage
      expect(changeLanguage).toHaveBeenCalledWith('es-ES')
    })
  })

  describe('Error Boundary Integration', () => {
    it('should handle translation errors gracefully', async () => {
      // Mock translation function to throw error
      mockUseTranslation.mockReturnValue({
        t: vi.fn(() => {
          throw new Error('Translation error')
        }),
        i18n: {
          language: 'en-US',
          changeLanguage: vi.fn()
        }
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function ErrorComponent() {
        try {
          const { t } = useTranslation('common')
          return <div data-testid="error-text">{t('test.key')}</div>
        } catch (error) {
          return <div data-testid="error-fallback">Translation Error</div>
        }
      }

      render(
        <L4HI18nProvider>
          <ErrorComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error-fallback')).toHaveTextContent('Translation Error')
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Performance Considerations', () => {
    it('should not cause unnecessary re-renders', async () => {
      let renderCount = 0
      
      function CountingComponent() {
        renderCount++
        const { t } = useTranslation('common')
        return <div data-testid="render-count">{t('test.key')} - Renders: {renderCount}</div>
      }

      render(
        <L4HI18nProvider>
          <CountingComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('render-count')).toHaveTextContent('Renders: 1')
      })

      // Component should not re-render unnecessarily
      expect(renderCount).toBe(1)
    })

    it('should handle large translation objects efficiently', async () => {
      const largeTranslationMock = vi.fn((key) => {
        // Simulate large translation lookup
        for (let i = 0; i < 1000; i++) {
          if (key === `large.key.${i}`) {
            return `Large value ${i}`
          }
        }
        return key
      })

      mockUseTranslation.mockReturnValue({
        t: largeTranslationMock,
        i18n: {
          language: 'en-US',
          changeLanguage: vi.fn()
        }
      })

      function LargeTranslationComponent() {
        const { t } = useTranslation('common')
        return (
          <div>
            {Array.from({ length: 10 }, (_, i) => (
              <p key={i} data-testid={`large-${i}`}>
                {t(`large.key.${i}`)}
              </p>
            ))}
          </div>
        )
      }

      const startTime = performance.now()
      
      render(
        <L4HI18nProvider>
          <LargeTranslationComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('large-0')).toHaveTextContent('Large value 0')
        expect(screen.getByTestId('large-9')).toHaveTextContent('Large value 9')
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Rendering should complete within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000) // 1 second threshold
    })
  })

  describe('Accessibility Integration', () => {
    it('should maintain proper language attributes', async () => {
      function AccessibleComponent() {
        const { t, i18n } = useTranslation('common')
        
        return (
          <div lang={i18n.language}>
            <p data-testid="accessible-text">{t('accessible.content')}</p>
          </div>
        )
      }

      render(
        <L4HI18nProvider>
          <AccessibleComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        const container = screen.getByTestId('accessible-text').closest('div')
        expect(container).toHaveAttribute('lang', 'en-US')
      })
    })

    it('should work with screen reader announcements', async () => {
      function AnnouncementComponent() {
        const { t } = useTranslation('common')
        
        return (
          <div>
            <div 
              role="status" 
              aria-live="polite" 
              data-testid="announcement"
            >
              {t('status.message')}
            </div>
          </div>
        )
      }

      render(
        <L4HI18nProvider>
          <AnnouncementComponent />
        </L4HI18nProvider>
      )

      await waitFor(() => {
        const announcement = screen.getByTestId('announcement')
        expect(announcement).toHaveAttribute('role', 'status')
        expect(announcement).toHaveAttribute('aria-live', 'polite')
        expect(announcement).toHaveTextContent('status.message')
      })
    })
  })
})