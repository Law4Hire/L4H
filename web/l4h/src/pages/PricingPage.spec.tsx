import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { PricingPage } from './PricingPage'
import { apiClient } from '@l4h/shared-ui'

// Mock the API client
vi.mock('@l4h/shared-ui', async () => {
  const actual = await vi.importActual('@l4h/shared-ui')
  return {
    ...actual,
    apiClient: {
      getPricing: vi.fn(),
      selectPackage: vi.fn(),
    },
  }
})

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders pricing page with title', () => {
    renderWithRouter(<PricingPage />)
    
    expect(screen.getByText(/pricing/i)).toBeInTheDocument()
  })

  it('loads and displays pricing packages', async () => {
    const mockPricing = {
      packages: [
        {
          id: 'basic',
          name: 'Basic Package',
          description: 'Essential services',
          price: 1000,
          currency: 'USD',
          features: ['Feature 1', 'Feature 2'],
        },
        {
          id: 'premium',
          name: 'Premium Package',
          description: 'Advanced services',
          price: 2500,
          currency: 'USD',
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
        },
      ],
    }

    vi.mocked(apiClient.getPricing).mockResolvedValue({
      success: true,
      data: mockPricing,
    })

    renderWithRouter(<PricingPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Basic Package')).toBeInTheDocument()
      expect(screen.getByText('Premium Package')).toBeInTheDocument()
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
      expect(screen.getByText('$2,500.00')).toBeInTheDocument()
    })
  })

  it('displays package features', async () => {
    const mockPricing = {
      packages: [
        {
          id: 'basic',
          name: 'Basic Package',
          description: 'Essential services',
          price: 1000,
          currency: 'USD',
          features: ['Feature 1', 'Feature 2'],
        },
      ],
    }

    vi.mocked(apiClient.getPricing).mockResolvedValue({
      success: true,
      data: mockPricing,
    })

    renderWithRouter(<PricingPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Feature 1')).toBeInTheDocument()
      expect(screen.getByText('Feature 2')).toBeInTheDocument()
    })
  })

  it('handles package selection', async () => {
    const user = userEvent.setup()
    const mockPricing = {
      packages: [
        {
          id: 'basic',
          name: 'Basic Package',
          description: 'Essential services',
          price: 1000,
          currency: 'USD',
          features: ['Feature 1'],
        },
      ],
    }

    vi.mocked(apiClient.getPricing).mockResolvedValue({
      success: true,
      data: mockPricing,
    })

    vi.mocked(apiClient.selectPackage).mockResolvedValue({
      success: true,
      data: { caseId: 'case-123' },
    })

    renderWithRouter(<PricingPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Basic Package')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /select package/i }))
    
    await waitFor(() => {
      expect(apiClient.selectPackage).toHaveBeenCalledWith('basic')
      expect(screen.getByText(/package selected successfully/i)).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching pricing', () => {
    vi.mocked(apiClient.getPricing).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithRouter(<PricingPage />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    vi.mocked(apiClient.getPricing).mockResolvedValue({
      success: false,
      error: 'Failed to load pricing',
    })

    renderWithRouter(<PricingPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load pricing/i)).toBeInTheDocument()
    })
  })

  it('shows error message on package selection failure', async () => {
    const user = userEvent.setup()
    const mockPricing = {
      packages: [
        {
          id: 'basic',
          name: 'Basic Package',
          description: 'Essential services',
          price: 1000,
          currency: 'USD',
          features: ['Feature 1'],
        },
      ],
    }

    vi.mocked(apiClient.getPricing).mockResolvedValue({
      success: true,
      data: mockPricing,
    })

    vi.mocked(apiClient.selectPackage).mockResolvedValue({
      success: false,
      error: 'Selection failed',
    })

    renderWithRouter(<PricingPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Basic Package')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /select package/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/selection failed/i)).toBeInTheDocument()
    })
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    const mockPricing = {
      packages: [
        {
          id: 'basic',
          name: 'Basic Package',
          description: 'Essential services',
          price: 1000,
          currency: 'USD',
          features: ['Feature 1'],
        },
      ],
    }

    vi.mocked(apiClient.getPricing).mockResolvedValue({
      success: true,
      data: mockPricing,
    })

    renderWithRouter(<PricingPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Basic Package')).toBeInTheDocument()
    })

    const selectButton = screen.getByRole('button', { name: /select package/i })
    selectButton.focus()
    expect(selectButton).toHaveFocus()
    
    await user.keyboard('{Enter}')
    expect(apiClient.selectPackage).toHaveBeenCalledWith('basic')
  })

  it('has proper ARIA attributes', async () => {
    const mockPricing = {
      packages: [
        {
          id: 'basic',
          name: 'Basic Package',
          description: 'Essential services',
          price: 1000,
          currency: 'USD',
          features: ['Feature 1'],
        },
      ],
    }

    vi.mocked(apiClient.getPricing).mockResolvedValue({
      success: true,
      data: mockPricing,
    })

    renderWithRouter(<PricingPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select package/i })).toBeInTheDocument()
    })
  })
})
