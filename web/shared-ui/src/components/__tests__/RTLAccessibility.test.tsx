import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { RTLAccessibleContainer, RTLAccessibleForm, RTLAccessibleNavigation } from '../RTLAccessibleContainer'
import { AccessibleContent } from '../AccessibleContent'
import { useRTLAccessibility } from '../../hooks/useRTLAccessibility'
import { useAccessibilityI18n } from '../../hooks/useAccessibilityI18n'

// Mock i18n instance
const mockI18n = {
  language: 'en-US',
  changeLanguage: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  getDataByLanguage: vi.fn(() => ({ displayName: 'English' }))
}

// Test component that uses RTL accessibility hooks
const TestRTLComponent: React.FC<{ language?: string }> = ({ language = 'en-US' }) => {
  const {
    isRTL,
    textDirection,
    getNavigationDirection,
    getRTLAriaAttributes
  } = useRTLAccessibility()
  
  const {
    announceToScreenReader,
    getAriaAttributes
  } = useAccessibilityI18n()
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const direction = getNavigationDirection(event.key)
    if (direction) {
      announceToScreenReader(`Navigation direction: ${direction}`)
    }
  }
  
  const ariaAttributes = getRTLAriaAttributes()
  
  return (
    <div
      data-testid="rtl-test-container"
      data-is-rtl={isRTL}
      data-text-direction={textDirection}
      {...ariaAttributes}
      onKeyDown={handleKeyDown}
    >
      <button data-testid="test-button">Test Button</button>
      <input data-testid="test-input" />
    </div>
  )
}

// Mock the i18n config functions
jest.mock('../../i18n-config', () => ({
  isRTL: jest.fn((lang: string) => lang.startsWith('ar') || lang.startsWith('ur')),
  getTextDirection: jest.fn((lang: string) => lang.startsWith('ar') || lang.startsWith('ur') ? 'rtl' : 'ltr'),
  SUPPORTED_LANGUAGES: ['en-US', 'ar-SA', 'ur-PK'],
  CULTURE_NAMES: {
    'en-US': 'English',
    'ar-SA': 'Arabic',
    'ur-PK': 'Urdu'
  }
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('RTL Accessibility Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset DOM
    document.body.innerHTML = ''
    document.documentElement.setAttribute('dir', 'ltr')
    document.documentElement.setAttribute('lang', 'en-US')
  })
  
  describe('useRTLAccessibility hook', () => {
    it('should detect RTL languages correctly', () => {
      mockI18n.language = 'ar-SA'
      
      render(<TestRTLComponent language="ar-SA" />)
      
      const container = screen.getByTestId('rtl-test-container')
      expect(container).toHaveAttribute('data-is-rtl', 'true')
      expect(container).toHaveAttribute('data-text-direction', 'rtl')
      expect(container).toHaveAttribute('dir', 'rtl')
    })
    
    it('should detect LTR languages correctly', () => {
      mockI18n.language = 'en-US'
      
      render(<TestRTLComponent language="en-US" />)
      
      const container = screen.getByTestId('rtl-test-container')
      expect(container).toHaveAttribute('data-is-rtl', 'false')
      expect(container).toHaveAttribute('data-text-direction', 'ltr')
      expect(container).toHaveAttribute('dir', 'ltr')
    })
    
    it('should handle keyboard navigation direction correctly for RTL', async () => {
      mockI18n.language = 'ar-SA'
      const user = userEvent.setup()
      
      render(<TestRTLComponent language="ar-SA" />)
      
      const container = screen.getByTestId('rtl-test-container')
      
      // In RTL, ArrowLeft should be forward navigation
      await user.type(container, '{ArrowLeft}')
      
      // Check if announcement was made (would be in a live region)
      await waitFor(() => {
        const liveRegion = document.querySelector('[aria-live]')
        expect(liveRegion).toBeTruthy()
      })
    })
    
    it('should handle keyboard navigation direction correctly for LTR', async () => {
      mockI18n.language = 'en-US'
      const user = userEvent.setup()
      
      render(<TestRTLComponent language="en-US" />)
      
      const container = screen.getByTestId('rtl-test-container')
      
      // In LTR, ArrowRight should be forward navigation
      await user.type(container, '{ArrowRight}')
      
      // Check if announcement was made
      await waitFor(() => {
        const liveRegion = document.querySelector('[aria-live]')
        expect(liveRegion).toBeTruthy()
      })
    })
  })
  
  describe('RTLAccessibleContainer', () => {
    it('should render with correct RTL attributes', () => {
      mockI18n.language = 'ar-SA'
      
      render(
        <RTLAccessibleContainer data-testid="rtl-container">
          <button>Test Button</button>
        </RTLAccessibleContainer>
      )
      
      const container = screen.getByTestId('rtl-container')
      expect(container).toHaveAttribute('dir', 'rtl')
      expect(container).toHaveStyle({ direction: 'rtl' })
    })
    
    it('should manage focus order for RTL layouts', async () => {
      mockI18n.language = 'ar-SA'
      const user = userEvent.setup()
      
      render(
        <RTLAccessibleContainer data-testid="rtl-container" manageFocusOrder>
          <button data-testid="button1">Button 1</button>
          <button data-testid="button2">Button 2</button>
          <button data-testid="button3">Button 3</button>
        </RTLAccessibleContainer>
      )
      
      const button1 = screen.getByTestId('button1')
      const button2 = screen.getByTestId('button2')
      const button3 = screen.getByTestId('button3')
      
      // Focus should be managed in reverse order for RTL
      button1.focus()
      
      // Tab should go to previous button in RTL
      await user.keyboard('{Tab}')
      expect(document.activeElement).toBe(button3)
    })
    
    it('should handle custom focus order', async () => {
      mockI18n.language = 'ar-SA'
      
      render(
        <RTLAccessibleContainer
          data-testid="rtl-container"
          manageFocusOrder
          customFocusOrder={['[data-priority="high"]', '[data-priority="low"]']}
        >
          <button data-testid="button1" data-priority="low">Low Priority</button>
          <button data-testid="button2" data-priority="high">High Priority</button>
        </RTLAccessibleContainer>
      )
      
      const container = screen.getByTestId('rtl-container')
      const highPriorityButton = screen.getByTestId('button2')
      const lowPriorityButton = screen.getByTestId('button1')
      
      // High priority button should be first in focus order (even in RTL)
      expect(highPriorityButton).toHaveAttribute('tabindex', '0')
      expect(lowPriorityButton).toHaveAttribute('tabindex', '-1')
    })
  })
  
  describe('RTLAccessibleForm', () => {
    it('should render form with RTL attributes and focus management', () => {
      mockI18n.language = 'ar-SA'
      
      render(
        <RTLAccessibleForm data-testid="rtl-form">
          <input data-testid="input1" type="text" />
          <input data-testid="input2" type="email" />
          <button data-testid="submit" type="submit">Submit</button>
        </RTLAccessibleForm>
      )
      
      const form = screen.getByTestId('rtl-form')
      expect(form).toHaveAttribute('dir', 'rtl')
      expect(form.tagName).toBe('FORM')
    })
    
    it('should handle form field focus order correctly in RTL', async () => {
      mockI18n.language = 'ar-SA'
      
      render(
        <RTLAccessibleForm data-testid="rtl-form">
          <input data-testid="text-input" type="text" />
          <input data-testid="email-input" type="email" />
          <button data-testid="submit-button" type="submit">Submit</button>
        </RTLAccessibleForm>
      )
      
      const textInput = screen.getByTestId('text-input')
      const emailInput = screen.getByTestId('email-input')
      const submitButton = screen.getByTestId('submit-button')
      
      // Check that focus order is managed
      expect(textInput).toHaveAttribute('tabindex')
      expect(emailInput).toHaveAttribute('tabindex')
      expect(submitButton).toHaveAttribute('tabindex')
    })
  })
  
  describe('RTLAccessibleNavigation', () => {
    it('should render navigation with RTL attributes', () => {
      mockI18n.language = 'ar-SA'
      
      render(
        <RTLAccessibleNavigation data-testid="rtl-nav" orientation="horizontal">
          <a href="#1" data-testid="nav-link1">Link 1</a>
          <a href="#2" data-testid="nav-link2">Link 2</a>
          <a href="#3" data-testid="nav-link3">Link 3</a>
        </RTLAccessibleNavigation>
      )
      
      const nav = screen.getByTestId('rtl-nav')
      expect(nav).toHaveAttribute('dir', 'rtl')
      expect(nav).toHaveAttribute('role', 'navigation')
      expect(nav).toHaveAttribute('aria-orientation', 'horizontal')
      expect(nav.tagName).toBe('NAV')
    })
    
    it('should handle navigation keyboard events in RTL', async () => {
      mockI18n.language = 'ar-SA'
      const user = userEvent.setup()
      
      render(
        <RTLAccessibleNavigation data-testid="rtl-nav">
          <a href="#1" data-testid="nav-link1">Link 1</a>
          <a href="#2" data-testid="nav-link2">Link 2</a>
        </RTLAccessibleNavigation>
      )
      
      const link1 = screen.getByTestId('nav-link1')
      const link2 = screen.getByTestId('nav-link2')
      
      link1.focus()
      
      // Arrow navigation should work in RTL context
      await user.keyboard('{ArrowLeft}')
      // In RTL, left arrow should move forward
      expect(document.activeElement).toBe(link2)
    })
  })
  
  describe('AccessibleContent', () => {
    it('should render with correct language attributes', () => {
      render(
        <AccessibleContent
          data-testid="accessible-content"
          language="ar-SA"
          setLangAttribute
          setDirAttribute
        >
          Test content
        </AccessibleContent>
      )
      
      const content = screen.getByTestId('accessible-content')
      expect(content).toHaveAttribute('lang', 'ar-SA')
      expect(content).toHaveAttribute('dir', 'rtl')
    })
    
    it('should announce content changes when enabled', async () => {
      const { rerender } = render(
        <AccessibleContent
          data-testid="accessible-content"
          announceChanges
          announcementPriority="polite"
        >
          Initial content
        </AccessibleContent>
      )
      
      // Change content
      rerender(
        <AccessibleContent
          data-testid="accessible-content"
          announceChanges
          announcementPriority="polite"
        >
          Updated content
        </AccessibleContent>
      )
      
      // Check if live region was created for announcement
      await waitFor(() => {
        const liveRegion = document.querySelector('[aria-live="polite"]')
        expect(liveRegion).toBeTruthy()
      })
    })
    
    it('should apply correct text alignment for RTL', () => {
      mockI18n.language = 'ar-SA'
      
      render(
        <AccessibleContent
          data-testid="accessible-content"
          textAlign="start"
        >
          RTL content
        </AccessibleContent>
      )
      
      const content = screen.getByTestId('accessible-content')
      expect(content).toHaveStyle({ textAlign: 'right' })
    })
  })
  
  describe('Language direction changes', () => {
    it('should announce direction changes to screen readers', async () => {
      const { rerender } = render(<TestRTLComponent language="en-US" />)
      
      // Change to RTL language
      mockI18n.language = 'ar-SA'
      rerender(<TestRTLComponent language="ar-SA" />)
      
      // Check if direction change event was dispatched
      await waitFor(() => {
        // The hook should create a live region for announcements
        const liveRegions = document.querySelectorAll('[aria-live]')
        expect(liveRegions.length).toBeGreaterThan(0)
      })
    })
    
    it('should update HTML attributes when direction changes', async () => {
      const { rerender } = render(<TestRTLComponent language="en-US" />)
      
      // Initially LTR
      expect(document.documentElement).toHaveAttribute('dir', 'ltr')
      
      // Change to RTL
      mockI18n.language = 'ar-SA'
      rerender(<TestRTLComponent language="ar-SA" />)
      
      // Should update to RTL
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('dir', 'rtl')
      })
    })
  })
  
  describe('Focus management', () => {
    it('should trap focus within RTL containers', async () => {
      mockI18n.language = 'ar-SA'
      const user = userEvent.setup()
      
      render(
        <RTLAccessibleContainer data-testid="focus-trap" manageFocusOrder>
          <button data-testid="first-button">First</button>
          <button data-testid="second-button">Second</button>
          <button data-testid="third-button">Third</button>
        </RTLAccessibleContainer>
      )
      
      const firstButton = screen.getByTestId('first-button')
      const secondButton = screen.getByTestId('second-button')
      const thirdButton = screen.getByTestId('third-button')
      
      // Focus first button
      firstButton.focus()
      
      // Tab should move through buttons in RTL order
      await user.keyboard('{Tab}')
      expect(document.activeElement).toBe(thirdButton)
      
      await user.keyboard('{Tab}')
      expect(document.activeElement).toBe(secondButton)
    })
    
    it('should handle Shift+Tab correctly in RTL', async () => {
      mockI18n.language = 'ar-SA'
      const user = userEvent.setup()
      
      render(
        <RTLAccessibleContainer data-testid="focus-trap" manageFocusOrder>
          <button data-testid="first-button">First</button>
          <button data-testid="second-button">Second</button>
        </RTLAccessibleContainer>
      )
      
      const firstButton = screen.getByTestId('first-button')
      const secondButton = screen.getByTestId('second-button')
      
      // Focus second button
      secondButton.focus()
      
      // Shift+Tab should move to first button
      await user.keyboard('{Shift>}{Tab}{/Shift}')
      expect(document.activeElement).toBe(firstButton)
    })
  })
  
  describe('Keyboard navigation', () => {
    it('should handle arrow keys correctly in RTL context', async () => {
      mockI18n.language = 'ar-SA'
      const user = userEvent.setup()
      
      render(
        <RTLAccessibleContainer
          data-testid="rtl-container"
          adjustKeyboardNavigation
        >
          <button data-testid="button1">Button 1</button>
          <button data-testid="button2">Button 2</button>
        </RTLAccessibleContainer>
      )
      
      const button1 = screen.getByTestId('button1')
      const button2 = screen.getByTestId('button2')
      
      button1.focus()
      
      // In RTL, left arrow should move forward
      await user.keyboard('{ArrowLeft}')
      expect(document.activeElement).toBe(button2)
      
      // In RTL, right arrow should move backward
      await user.keyboard('{ArrowRight}')
      expect(document.activeElement).toBe(button1)
    })
    
    it('should handle Home and End keys correctly in RTL', async () => {
      mockI18n.language = 'ar-SA'
      const user = userEvent.setup()
      
      render(
        <RTLAccessibleContainer
          data-testid="rtl-container"
          adjustKeyboardNavigation
        >
          <button data-testid="button1">Button 1</button>
          <button data-testid="button2">Button 2</button>
          <button data-testid="button3">Button 3</button>
        </RTLAccessibleContainer>
      )
      
      const button1 = screen.getByTestId('button1')
      const button2 = screen.getByTestId('button2')
      const button3 = screen.getByTestId('button3')
      
      button2.focus()
      
      // Home should go to the start (which is right in RTL)
      await user.keyboard('{Home}')
      expect(document.activeElement).toBe(button3)
      
      // End should go to the end (which is left in RTL)
      await user.keyboard('{End}')
      expect(document.activeElement).toBe(button1)
    })
  })
})