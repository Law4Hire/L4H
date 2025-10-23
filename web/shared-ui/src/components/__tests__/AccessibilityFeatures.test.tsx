import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AccessibleContent, AccessibleText, AccessibleHeading } from '../AccessibleContent'

// Mock the i18n config functions
vi.mock('../../i18n-config', () => ({
  isRTL: vi.fn((lang: string) => lang.startsWith('ar') || lang.startsWith('ur')),
  getTextDirection: vi.fn((lang: string) => lang.startsWith('ar') || lang.startsWith('ur') ? 'rtl' : 'ltr'),
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
    i18n: {
      language: 'en-US',
      changeLanguage: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      getDataByLanguage: vi.fn(() => ({ displayName: 'English' }))
    }
  })
}))

describe('Accessibility Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset DOM
    document.body.innerHTML = ''
    document.documentElement.setAttribute('dir', 'ltr')
    document.documentElement.setAttribute('lang', 'en-US')
  })
  
  describe('AccessibleContent', () => {
    it('should render with default attributes', () => {
      render(
        <AccessibleContent data-testid="accessible-content">
          Test content
        </AccessibleContent>
      )
      
      const content = screen.getByTestId('accessible-content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveTextContent('Test content')
    })
    
    it('should render with custom language attributes', () => {
      render(
        <AccessibleContent
          data-testid="accessible-content"
          language="ar-SA"
          setLangAttribute
          setDirAttribute
        >
          Arabic content
        </AccessibleContent>
      )
      
      const content = screen.getByTestId('accessible-content')
      expect(content).toHaveAttribute('lang', 'ar-SA')
      expect(content).toHaveAttribute('dir', 'rtl')
    })
    
    it('should apply custom text alignment', () => {
      render(
        <AccessibleContent
          data-testid="accessible-content"
          textAlign="center"
        >
          Centered content
        </AccessibleContent>
      )
      
      const content = screen.getByTestId('accessible-content')
      expect(content).toHaveStyle({ textAlign: 'center' })
    })
    
    it('should render as different HTML elements', () => {
      render(
        <AccessibleContent
          data-testid="accessible-section"
          as="section"
        >
          Section content
        </AccessibleContent>
      )
      
      const content = screen.getByTestId('accessible-section')
      expect(content.tagName).toBe('SECTION')
    })
  })
  
  describe('AccessibleText', () => {
    it('should render as paragraph by default', () => {
      render(
        <AccessibleText data-testid="accessible-text">
          Text content
        </AccessibleText>
      )
      
      const text = screen.getByTestId('accessible-text')
      expect(text.tagName).toBe('P')
      expect(text).toHaveTextContent('Text content')
    })
    
    it('should render as span when specified', () => {
      render(
        <AccessibleText data-testid="accessible-text" as="span">
          Span content
        </AccessibleText>
      )
      
      const text = screen.getByTestId('accessible-text')
      expect(text.tagName).toBe('SPAN')
    })
  })
  
  describe('AccessibleHeading', () => {
    it('should render as h1', () => {
      render(
        <AccessibleHeading data-testid="accessible-heading" level={1}>
          Heading 1
        </AccessibleHeading>
      )
      
      const heading = screen.getByTestId('accessible-heading')
      expect(heading.tagName).toBe('H1')
      expect(heading).toHaveTextContent('Heading 1')
    })
    
    it('should render as h3', () => {
      render(
        <AccessibleHeading data-testid="accessible-heading" level={3}>
          Heading 3
        </AccessibleHeading>
      )
      
      const heading = screen.getByTestId('accessible-heading')
      expect(heading.tagName).toBe('H3')
      expect(heading).toHaveTextContent('Heading 3')
    })
    
    it('should apply language attributes', () => {
      render(
        <AccessibleHeading
          data-testid="accessible-heading"
          level={2}
          language="ar-SA"
          setLangAttribute
          setDirAttribute
        >
          Arabic heading
        </AccessibleHeading>
      )
      
      const heading = screen.getByTestId('accessible-heading')
      expect(heading).toHaveAttribute('lang', 'ar-SA')
      expect(heading).toHaveAttribute('dir', 'rtl')
    })
  })
  
  describe('Language direction detection', () => {
    it('should detect RTL languages correctly', () => {
      const { isRTL } = require('../../i18n-config')
      
      expect(isRTL('ar-SA')).toBe(true)
      expect(isRTL('ur-PK')).toBe(true)
      expect(isRTL('en-US')).toBe(false)
      expect(isRTL('fr-FR')).toBe(false)
    })
    
    it('should get correct text direction', () => {
      const { getTextDirection } = require('../../i18n-config')
      
      expect(getTextDirection('ar-SA')).toBe('rtl')
      expect(getTextDirection('ur-PK')).toBe('rtl')
      expect(getTextDirection('en-US')).toBe('ltr')
      expect(getTextDirection('fr-FR')).toBe('ltr')
    })
  })
})