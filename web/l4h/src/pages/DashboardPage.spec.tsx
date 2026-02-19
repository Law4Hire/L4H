import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { DashboardPage } from './DashboardPage'
import { cases } from '@l4h/shared-ui'
import { renderWithProviders } from '../test-utils'

// Mock the shared-ui module
vi.mock('@l4h/shared-ui', async () => {
  const actual = await vi.importActual('@l4h/shared-ui')
  return {
    ...actual,
    cases: {
      mine: vi.fn(),
      resetVisaType: vi.fn(),
    },
    interview: {
      start: vi.fn(),
      startAnonymous: vi.fn(),
    },
  }
})

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Test User' }, isAuthenticated: true }),
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard with welcome message', async () => {
    vi.mocked(cases.mine).mockResolvedValue([])

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Welcome to your Dashboard')).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching data', () => {
    vi.mocked(cases.mine).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithProviders(<DashboardPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays case status when cases are loaded', async () => {
    const mockCases = [
      { id: 'abc12345-6789', status: 'active', createdAt: '2024-01-15T10:00:00Z', isVisaLockedByAttorney: false },
    ]

    vi.mocked(cases.mine).mockResolvedValue(mockCases as any)

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument()
    })
  })

  it('shows no cases found when empty', async () => {
    vi.mocked(cases.mine).mockResolvedValue([])

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('No cases found')).toBeInTheDocument()
    })
  })

  it('shows quick link buttons', async () => {
    vi.mocked(cases.mine).mockResolvedValue([])

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Start AI Interview')).toBeInTheDocument()
      expect(screen.getByText('View Pricing')).toBeInTheDocument()
      expect(screen.getByText('Messages')).toBeInTheDocument()
    })
  })
})
