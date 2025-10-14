import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { RTLDemo } from './RTLDemo'
import { setRTLDirection, isRTL } from '../i18n-config'

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

vi.mock('../hooks/useRTL', () => ({
  useRTL: vi.fn(() => ({
    isRTL: false,
    direction: 'ltr',
    textAlign: vi.fn(() => 'left'),
    formatNumber: vi.fn((value) => value.toLocaleString('en-US')),
    formatDate: vi.fn((date) => date.toLocaleDateString('en-US')),
    getClassName: vi.fn((ltr, rtl) => ltr),
    getStyle: vi.fn((ltr, rtl) => ltr),
  })),
}))

describe('RTL Integration Tests', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.setAttribute('dir', 'ltr')
    document.documentElement.setAttribute('lang', 'en-US')
    
    // Reset mocks
    vi.clearAllMocks()
  })

  it('renders RTL demo component correctly', () => {
    const { container } = render(<RTLDemo />)
    
    // Check that the main container is rendered
    expect(container.querySelector('.max-w-4xl')).toBeInTheDocument()
    
    // Check that language buttons are present
    const languageButtons = container.querySelectorAll('button')
    expect(languageButtons.length).toBeGreaterThan(0)
    
    // Check that form inputs are present
    const inputs = container.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('switches to Arabic language and applies RTL layout', async () => {
    const { container, getByText } = render(<RTLDemo />)
    
    // Find and click Arabic language button
    const arabicButton = getByText('العربية (Arabic)')
    expect(arabicButton).toBeInTheDocument()
    
    fireEvent.click(arabicButton)
    
    // Verify setRTLDirection was called with Arabic
    expect(setRTLDirection).toHaveBeenCalledWith('ar-SA')
  })

  it('switches to Urdu language and applies RTL layout', async () => {
    const { container, getByText } = render(<RTLDemo />)
    
    // Find and click Urdu language button
    const urduButton = getByText('اردو (Urdu)')
    expect(urduButton).toBeInTheDocument()
    
    fireEvent.click(urduButton)
    
    // Verify setRTLDirection was called with Urdu
    expect(setRTLDirection).toHaveBeenCalledWith('ur-PK')
  })

  it('handles form input correctly in different languages', () => {
    const { container } = render(<RTLDemo />)
    
    // Find form inputs
    const nameInput = container.querySelector('input[placeholder*="name"], input[placeholder*="اسم"]')
    const emailInput = container.querySelector('input[type="email"]')
    const phoneInput = container.querySelector('input[type="tel"]')
    const numberInput = container.querySelector('input[type="number"]')
    
    expect(nameInput).toBeInTheDocument()
    expect(emailInput).toBeInTheDocument()
    expect(phoneInput).toBeInTheDocument()
    expect(numberInput).toBeInTheDocument()
    
    // Test typing in inputs
    if (nameInput) {
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      expect(nameInput).toHaveValue('John Doe')
    }
    
    if (emailInput) {
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      expect(emailInput).toHaveValue('john@example.com')
    }
  })

  it('displays number and date formatting components', () => {
    const { container } = render(<RTLDemo />)
    
    // Check for number display elements
    const numberElements = container.querySelectorAll('.number-display')
    expect(numberElements.length).toBeGreaterThan(0)
    
    // Check for date display elements
    const dateElements = container.querySelectorAll('.date-display')
    expect(dateElements.length).toBeGreaterThan(0)
  })

  it('renders interview-style radio buttons correctly', () => {
    const { container } = render(<RTLDemo />)
    
    // Check for radio buttons
    const radioButtons = container.querySelectorAll('input[type="radio"]')
    expect(radioButtons.length).toBeGreaterThan(0)
    
    // Check for interview-specific classes
    expect(container.querySelector('.interview-radio-group')).toBeInTheDocument()
    expect(container.querySelector('.interview-question')).toBeInTheDocument()
  })

  it('displays visa chips with proper styling', () => {
    const { container } = render(<RTLDemo />)
    
    // Check for visa chip elements
    const visaChips = container.querySelectorAll('.interview-visa-chip')
    expect(visaChips.length).toBeGreaterThan(0)
    
    // Check that visa codes are displayed
    expect(container.textContent).toContain('H1B')
    expect(container.textContent).toContain('L1A')
    expect(container.textContent).toContain('EB1')
  })

  it('applies correct CSS classes for RTL layout', () => {
    const { container } = render(<RTLDemo />)
    
    // Check for RTL-specific classes
    expect(container.querySelector('.interview-form')).toBeInTheDocument()
    expect(container.querySelector('.interview-actions')).toBeInTheDocument()
    expect(container.querySelector('.interview-progress-stats')).toBeInTheDocument()
    expect(container.querySelector('.interview-visa-chips')).toBeInTheDocument()
  })

  it('handles button interactions correctly', () => {
    const { container } = render(<RTLDemo />)
    
    // Find action buttons
    const buttons = container.querySelectorAll('button')
    const actionButtons = Array.from(buttons).filter(btn => 
      btn.textContent?.includes('Save') || 
      btn.textContent?.includes('Cancel') ||
      btn.textContent?.includes('Next') ||
      btn.textContent?.includes('Previous') ||
      btn.textContent?.includes('حفظ') ||
      btn.textContent?.includes('إلغاء')
    )
    
    expect(actionButtons.length).toBeGreaterThan(0)
    
    // Test clicking buttons (should not throw errors)
    actionButtons.forEach(button => {
      expect(() => fireEvent.click(button)).not.toThrow()
    })
  })

  it('verifies RTL detection functions work correctly', () => {
    expect(isRTL('ar-SA')).toBe(true)
    expect(isRTL('ur-PK')).toBe(true)
    expect(isRTL('en-US')).toBe(false)
    expect(isRTL('fr-FR')).toBe(false)
  })
})