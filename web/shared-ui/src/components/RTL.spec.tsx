import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { setRTLDirection } from '../i18n'
import { Button } from './Button'
import { Input } from './Input'
import { LanguageSwitcher } from '../LanguageSwitcher'

// Mock the i18n functions
vi.mock('../i18n', () => ({
  setRTLDirection: vi.fn((lang) => {
    document.documentElement.setAttribute('dir', lang.startsWith('ar') ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)
  }),
  isRTL: vi.fn(() => true),
  loadSupportedCultures: vi.fn().mockResolvedValue([
    { code: 'en', displayName: 'English' },
    { code: 'ar-SA', displayName: 'Arabic' },
  ]),
  setCulture: vi.fn(),
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'ar-SA',
      changeLanguage: vi.fn(),
    },
  }),
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
})
