import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CasesPage from './CasesPage'
import { apiClient } from '@l4h/shared-ui'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'cases.assigned': 'Assigned Cases',
        'cases.noCases': 'No assigned cases',
        'cases.caseNumber': 'Case #',
        'cases.client': 'Client',
        'cases.status': 'Status',
        'cases.lastActivity': 'Last Activity',
        'cases.actions': 'Actions',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.view': 'View',
        'common.edit': 'Edit'
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
      getMyCases: vi.fn()
    }
  }
})

describe('CasesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render cases table with localized headers', async () => {
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

    render(<CasesPage />)

    expect(screen.getByText('Assigned Cases')).toBeInTheDocument()
    expect(screen.getByText('Case #')).toBeInTheDocument()
    expect(screen.getByText('Client')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Last Activity')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('#case-123')).toBeInTheDocument()
      expect(screen.getByText('active')).toBeInTheDocument()
    })
  })

  it('should show no cases message when empty', async () => {
    vi.mocked(apiClient.getMyCases).mockResolvedValue([])

    render(<CasesPage />)

    await waitFor(() => {
      expect(screen.getByText('No assigned cases')).toBeInTheDocument()
    })
  })

  it('should display loading state initially', () => {
    vi.mocked(apiClient.getMyCases).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<CasesPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display error message on API failure', async () => {
    vi.mocked(apiClient.getMyCases).mockRejectedValue(new Error('API Error'))

    render(<CasesPage />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })
})
