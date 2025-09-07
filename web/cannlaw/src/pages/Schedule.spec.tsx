import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useTranslation } from 'react-i18next'
import SchedulePage from './SchedulePage'
import { apiClient } from '@l4h/shared-ui'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'schedule.upcoming': 'Upcoming Appointments',
        'schedule.noAppointments': 'No upcoming appointments',
        'schedule.client': 'Client',
        'schedule.time': 'Time',
        'schedule.type': 'Type',
        'schedule.status': 'Status',
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
      getStaffAppointments: vi.fn()
    }
  }
})

describe('SchedulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render schedule with localized table headers', async () => {
    const mockAppointments = [
      {
        id: 'apt-123',
        caseId: 'case-456',
        staffUserId: 'staff-789',
        scheduledStart: '2023-01-01T10:00:00Z',
        scheduledEnd: '2023-01-01T11:00:00Z',
        status: 'confirmed',
        type: 'consultation'
      }
    ]

    vi.mocked(apiClient.getStaffAppointments).mockResolvedValue(mockAppointments)

    render(<SchedulePage />)

    expect(screen.getByText('Upcoming Appointments')).toBeInTheDocument()
    expect(screen.getByText('Client')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Case #case-456')).toBeInTheDocument()
      expect(screen.getByText('confirmed')).toBeInTheDocument()
    })
  })

  it('should show no appointments message when empty', async () => {
    vi.mocked(apiClient.getStaffAppointments).mockResolvedValue([])

    render(<SchedulePage />)

    await waitFor(() => {
      expect(screen.getByText('No upcoming appointments')).toBeInTheDocument()
    })
  })

  it('should display loading state initially', () => {
    vi.mocked(apiClient.getStaffAppointments).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<SchedulePage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display error message on API failure', async () => {
    vi.mocked(apiClient.getStaffAppointments).mockRejectedValue(new Error('API Error'))

    render(<SchedulePage />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })
})
