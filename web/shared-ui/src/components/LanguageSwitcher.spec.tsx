import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { I18nProvider } from '../i18n-provider'
import { setCulture, loadSupportedCultures } from '../i18n'

// Mock the i18n functions
vi.mock('../i18n', () => ({
  setCulture: vi.fn(),
  loadSupportedCultures: vi.fn().mockResolvedValue([
    { code: 'en', displayName: 'English' },
    { code: 'es', displayName: 'Spanish' },
    { code: 'ar-SA', displayName: 'Arabic' },
  ]),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Helper to render with I18nProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<I18nProvider>{ui}</I18nProvider>)
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with current language', () => {
    renderWithProvider(<LanguageSwitcher />)
    
    // Should show loading state initially
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('loads supported cultures on mount', async () => {
    const { loadSupportedCultures } = await import('../i18n')

    renderWithProvider(<LanguageSwitcher />)

    await waitFor(() => {
      expect(loadSupportedCultures).toHaveBeenCalled()
    })

    // Should eventually show the select element
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  it('handles language change', async () => {
    const user = userEvent.setup()

    renderWithProvider(<LanguageSwitcher />)

    // Wait for cultures to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'es')

    expect(setCulture).toHaveBeenCalledWith('es')
  })

  it('shows loading state while fetching cultures', () => {
    // Mock loadSupportedCultures to never resolve
    vi.mocked(loadSupportedCultures).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithProvider(<LanguageSwitcher />)

    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    // Mock loadSupportedCultures to reject
    vi.mocked(loadSupportedCultures).mockRejectedValueOnce(new Error('API Error'))

    renderWithProvider(<LanguageSwitcher />)

    // Should show fallback cultures after error
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()

    renderWithProvider(<LanguageSwitcher />)

    // Wait for cultures to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    select.focus()
    expect(select).toHaveFocus()

    await user.selectOptions(select, 'es')

    expect(setCulture).toHaveBeenCalledWith('es')
  })

  it('applies custom className', async () => {
    renderWithProvider(<LanguageSwitcher className="custom-class" />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveClass('custom-class')
    })
  })

  it('supports aria attributes', async () => {
    renderWithProvider(
      <LanguageSwitcher
        aria-label="Select language"
        aria-describedby="language-help"
      />
    )

    await waitFor(() => {
      const select = screen.getByRole('combobox')
      expect(select).toHaveAttribute('aria-label', 'Select language')
      expect(select).toHaveAttribute('aria-describedby', 'language-help')
    })
  })

  it('renders with compact variant', async () => {
    renderWithProvider(<LanguageSwitcher variant="compact" />)

    await waitFor(() => {
      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('text-sm', 'py-1')
    })
  })

  it('renders with full variant', async () => {
    renderWithProvider(<LanguageSwitcher variant="full" />)

    await waitFor(() => {
      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('text-base', 'py-2')
    })
  })
})

