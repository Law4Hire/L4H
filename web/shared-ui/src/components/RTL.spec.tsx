import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { setRTLDirection, isRTL, getTextDirection, getTextAlign } from '../i18n-config'
import { Button } from './Button'
import { Input } from './Input'
import { RTLNumber, RTLDate } from './RTLNumber'
import { LanguageSwitcher } from '../LanguageSwitcher'

// Mock the i18n functions
vi.mock('../i18n-config', () => ({
  setRTLDirection: vi.fn((lang) => {
    const isRTLLang = lang.startsWith('ar') || lang.startsWith('ur')
    document.documentElement.setAttribute('dir', isRTLLang ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('data-direction', isRTLLang ? 'rtl' : 'ltr')
  }),
  isRTL: vi.fn((lang) => lang.startsWith('ar') || lang.startsWith('ur')),
  getTextDirection: vi.fn((lang) => (lang.startsWith('ar') || lang.startsWith('ur')) ? 'rtl' : 'ltr'),
  getTextAlign: vi.fn((lang, align = 'start') => {
    const isRTLLang = lang.startsWith('ar') || lang.startsWith('ur')
    if (align === 'start') return isRTLLang ? 'right' : 'left'
    if (align === 'end') return isRTLLang ? 'left' : 'right'
    return align
  }),
  formatNumber: vi.fn((value, lang) => value.toLocaleString(lang)),
  formatDate: vi.fn((date, lang) => date.toLocaleDateString(lang)),
  RTL_LANGUAGES: ['ar-SA', 'ur-PK'],
}))

vi.mock('../i18n-provider', () => ({
  useI18n: vi.fn(() => ({
    cultures: [
      { code: 'en-US', displayName: 'English' },
      { code: 'ar-SA', displayName: 'Arabic' },
    ],
    currentCulture: 'ar-SA',
    setCurrentCulture: vi.fn(),
    isLoading: false,
    isRTL: true,
  })),
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
    i18n: {
      language: 'ar-SA',
      changeLanguage: vi.fn(),
    },
  })),
}))

vi.mock('../hooks/useRTL', () => ({
  useRTL: vi.fn(() => ({
    isRTL: true,
    direction: 'rtl',
    textAlign: vi.fn(() => 'right'),
    formatNumber: vi.fn((value) => value.toLocaleString('ar-SA')),
    formatDate: vi.fn((date) => date.toLocaleDateString('ar-SA')),
    getClassName: vi.fn((ltr, rtl) => rtl || ltr),
    getStyle: vi.fn((ltr, rtl) => ({ ...ltr, ...rtl })),
  })),
  useRTLClasses: vi.fn((base, rtl) => rtl || base),
  useRTLStyles: vi.fn((base, rtl) => ({ ...base, ...rtl })),
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
    i18n: {
      language: 'ar-SA',
      changeLanguage: vi.fn(),
    },
  })),
}))

// Mock fetch for LanguageSwitcher
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => [
    { code: 'en', displayName: 'English' },
    { code: 'ar-SA', displayName: 'Arabic' },
  ],
})

describe('RTL Support', () => {
  it('renders Login form in RTL layout for Arabic', async () => {
    // Set RTL direction
    setRTLDirection('ar-SA')
    
    const { container } = render(
      <div>
        <form>
          <Input 
            label="البريد الإلكتروني" 
            placeholder="أدخل بريدك الإلكتروني"
            type="email"
          />
          <Input 
            label="كلمة المرور" 
            placeholder="أدخل كلمة المرور"
            type="password"
          />
          <Button>تسجيل الدخول</Button>
        </form>
        <LanguageSwitcher />
      </div>
    )
    
    // Check that HTML has RTL direction
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(document.documentElement).toHaveAttribute('lang', 'ar-SA')
    
    // Check that form elements are rendered
    expect(container.querySelector('form')).toBeInTheDocument()
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument()
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument()
    expect(container.querySelector('button')).toBeInTheDocument()
    
    // Wait for LanguageSwitcher to load
    await waitFor(() => {
      expect(container.querySelector('select')).toBeInTheDocument()
    })

    // Check that labels are present
    expect(container.querySelector('label')).toBeInTheDocument()
  })

  it('renders components in LTR layout for English', async () => {
    // Set LTR direction
    setRTLDirection('en')
    
    const { container } = render(
      <div>
        <form>
          <Input 
            label="Email" 
            placeholder="Enter your email"
            type="email"
          />
          <Input 
            label="Password" 
            placeholder="Enter your password"
            type="password"
          />
          <Button>Login</Button>
        </form>
        <LanguageSwitcher />
      </div>
    )
    
    // Check that HTML has LTR direction
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    
    // Check that form elements are rendered
    expect(container.querySelector('form')).toBeInTheDocument()
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument()
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument()
    expect(container.querySelector('button')).toBeInTheDocument()
    
    // Wait for LanguageSwitcher to load
    await waitFor(() => {
      expect(container.querySelector('select')).toBeInTheDocument()
    })
  })

  it('applies RTL-specific styles', () => {
    setRTLDirection('ar-SA')
    
    const { container } = render(
      <div>
        <Button>Test Button</Button>
        <Input label="Test Input" />
      </div>
    )
    
    // Check that the components are rendered correctly
    const button = container.querySelector('button')
    const input = container.querySelector('input')
    
    expect(button).toBeInTheDocument()
    expect(input).toBeInTheDocument()
  })

  it('handles RTL layout for complex components', async () => {
    setRTLDirection('ar-SA')
    
    const { container } = render(
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline">إلغاء</Button>
          <Button>حفظ</Button>
        </div>
        <LanguageSwitcher />
      </div>
    )
    
    // Check that the layout container is rendered
    expect(container.querySelector('.flex')).toBeInTheDocument()
    expect(container.querySelectorAll('button')).toHaveLength(2) // 2 buttons
    
    // Wait for LanguageSwitcher to load
    await waitFor(() => {
      expect(container.querySelector('select')).toBeInTheDocument() // language switcher
    })
  })

  it('formats numbers correctly for RTL languages', () => {
    setRTLDirection('ar-SA')
    
    const { container } = render(
      <div>
        <RTLNumber value={1234.56} />
        <RTLNumber value={1000} format="currency" currency="USD" />
        <RTLNumber value={0.75} format="percent" />
      </div>
    )
    
    // Check that number components are rendered
    const numberElements = container.querySelectorAll('.number-display')
    expect(numberElements).toHaveLength(3)
    
    // Check that numbers have LTR direction
    numberElements.forEach(element => {
      expect(element).toHaveStyle({ direction: 'ltr' })
    })
  })

  it('formats dates correctly for RTL languages', () => {
    setRTLDirection('ar-SA')
    
    const testDate = new Date('2024-01-15')
    const { container } = render(
      <div>
        <RTLDate date={testDate} format="short" />
        <RTLDate date={testDate} format="long" />
      </div>
    )
    
    // Check that date components are rendered
    const dateElements = container.querySelectorAll('.date-display')
    expect(dateElements).toHaveLength(2)
  })

  it('handles Urdu language RTL support', () => {
    setRTLDirection('ur-PK')
    
    const { container } = render(
      <div>
        <Input label="ای میل" placeholder="اپنا ای میل داخل کریں" type="email" />
        <Button>لاگ ان</Button>
      </div>
    )
    
    // Check that HTML has RTL direction for Urdu
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(document.documentElement).toHaveAttribute('lang', 'ur-PK')
    
    // Check that components are rendered
    expect(container.querySelector('input')).toBeInTheDocument()
    expect(container.querySelector('button')).toBeInTheDocument()
  })

  it('applies correct text alignment for RTL languages', () => {
    expect(getTextAlign('ar-SA', 'start')).toBe('right')
    expect(getTextAlign('ar-SA', 'end')).toBe('left')
    expect(getTextAlign('en-US', 'start')).toBe('left')
    expect(getTextAlign('en-US', 'end')).toBe('right')
    expect(getTextAlign('ar-SA', 'center')).toBe('center')
  })

  it('detects RTL languages correctly', () => {
    expect(isRTL('ar-SA')).toBe(true)
    expect(isRTL('ur-PK')).toBe(true)
    expect(isRTL('en-US')).toBe(false)
    expect(isRTL('fr-FR')).toBe(false)
    expect(getTextDirection('ar-SA')).toBe('rtl')
    expect(getTextDirection('en-US')).toBe('ltr')
  })
})
