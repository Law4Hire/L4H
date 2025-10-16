import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useTranslation } from '@l4h/shared-ui'
import DashboardPage from './DashboardPage'
import { apiClient } from '@l4h/shared-ui'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.welcome': 'Welcome back!',
        'app.tagline': 'Your Immigration Legal Partner',
        'dashboard.quickLinks': 'Quick Links',
        'dashboard.interview': 'Start Interview',
        'dashboard.pricing': 'View Pricing',
        'dashboard.appointments': 'My Appointments',
        'dashboard.messages': 'Messages',
        'dashboard.caseStatus': 'Case Status',
        'case.status.active': 'Active',
        'case.status.pending': 'Pending Review',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.view': 'View'
      }
      return translations[key] || key
    }
  })
}))

// Mock apiClient
vi.mock('@l4h/shared-ui', async () => {
  const actual = await vi.importActual('@l4h/shared-ui')
  return {
    ...actual,
    apiClient: {
      getMyCases: vi.fn(),
      startInterview: vi.fn()
    }
  }
})

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard with localized labels', async () => {
    const mockCases = [
      {
        id: 'case-123',
        userId: 'user-456',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        lastActivityAt: '2023-01-02T00:00:00Z'
      }
    ]

    vi.mocked(apiClient.getMyCases).mockResolvedValue(mockCases)

    render(<DashboardPage />)

    expect(screen.getByText('Welcome back!')).toBeInTheDocument()
    expect(screen.getByText('Your Immigration Legal Partner')).toBeInTheDocument()
    expect(screen.getByText('Quick Links')).toBeInTheDocument()
    expect(screen.getByText('Case Status')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Case #case-123')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('should show status badge with localized status', async () => {
    const mockCases = [
      {
        id: 'case-123',
        userId: 'user-456',
        status: 'pending',
        createdAt: '2023-01-01T00:00:00Z',
        lastActivityAt: '2023-01-02T00:00:00Z'
      }
    ]

    vi.mocked(apiClient.getMyCases).mockResolvedValue(mockCases)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Pending Review')).toBeInTheDocument()
    })
  })

  it('should display loading state initially', () => {
    vi.mocked(apiClient.getMyCases).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<DashboardPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display error message on API failure', async () => {
    vi.mocked(apiClient.getMyCases).mockRejectedValue(new Error('API Error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  it('should show no cases message when no cases exist', async () => {
    vi.mocked(apiClient.getMyCases).mockResolvedValue([])

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('No cases found')).toBeInTheDocument()
    })
  })
})
