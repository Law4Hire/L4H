import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { PricingPage } from './PricingPage'
import { cases, pricing } from '@l4h/shared-ui'
import { renderWithProviders } from '../test-utils'

// Mock the shared-ui module
vi.mock('@l4h/shared-ui', async () => {
  const actual = await vi.importActual('@l4h/shared-ui')
  return {
    ...actual,
    cases: {
      mine: vi.fn(),
      setPackage: vi.fn(),
    },
    pricing: {
      get: vi.fn(),
    },
  }
})

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Test User', country: 'US' }, isAuthenticated: true }),
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders pricing page title', async () => {
    vi.mocked(cases.mine).mockResolvedValue([])

    renderWithProviders(<PricingPage />)

    await waitFor(() => {
      expect(screen.getByText('Our Service Packages')).toBeInTheDocument()
    })
  })

  it('shows message when no active case', async () => {
    vi.mocked(cases.mine).mockResolvedValue([])

    renderWithProviders(<PricingPage />)

    await waitFor(() => {
      expect(screen.getByText('You need to create a case before selecting a pricing package.')).toBeInTheDocument()
    })
  })

  it('displays pricing packages when case has qualified visa', async () => {
    vi.mocked(cases.mine).mockResolvedValue([
      { id: 'case-1', status: 'active', createdAt: '2024-01-01', visaTypeCode: 'H1B' },
    ] as any)

    vi.mocked(pricing.get).mockResolvedValue({
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
    } as any)

    renderWithProviders(<PricingPage />)

    await waitFor(() => {
      expect(screen.getByText('Basic Package')).toBeInTheDocument()
      expect(screen.getByText('Feature 1')).toBeInTheDocument()
      expect(screen.getByText('Feature 2')).toBeInTheDocument()
    })
  })
})
