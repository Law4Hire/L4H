import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { apiClient } from '@l4h/shared-ui'

// Mock the API client
vi.mock('@l4h/shared-ui', async () => {
  const actual = await vi.importActual('@l4h/shared-ui')
  return {
    ...actual,
    apiClient: {
      getCases: vi.fn(),
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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard with welcome message', () => {
    renderWithRouter(<DashboardPage />)
    
    expect(screen.getByText(/welcome/i)).toBeInTheDocument()
  })

  it('loads and displays case status badges', async () => {
    const mockCases = [
      { id: '1', status: 'active', lastActivity: '2024-01-15T10:00:00Z' },
      { id: '2', status: 'pending', lastActivity: '2024-01-14T15:30:00Z' },
      { id: '3', status: 'closed', lastActivity: '2024-01-13T09:15:00Z' },
    ]

    vi.mocked(apiClient.getCases).mockResolvedValue({
      success: true,
      data: mockCases,
    })

    renderWithRouter(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('Closed')).toBeInTheDocument()
    })
  })

  it('displays last activity information', async () => {
    const mockCases = [
      { id: '1', status: 'active', lastActivity: '2024-01-15T10:00:00Z' },
    ]

    vi.mocked(apiClient.getCases).mockResolvedValue({
      success: true,
      data: mockCases,
    })

    renderWithRouter(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/last activity/i)).toBeInTheDocument()
    })
  })

  it('shows quick links to other pages', () => {
    renderWithRouter(<DashboardPage />)
    
    expect(screen.getByRole('link', { name: /appointments/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /messages/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /uploads/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /pricing/i })).toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    vi.mocked(apiClient.getCases).mockResolvedValue({
      success: false,
      error: 'Failed to load cases',
    })

    renderWithRouter(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load cases/i)).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching data', () => {
    vi.mocked(apiClient.getCases).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithRouter(<DashboardPage />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('navigates to correct pages when quick links are clicked', async () => {
    const user = userEvent.setup()

    renderWithRouter(<DashboardPage />)
    
    await user.click(screen.getByRole('link', { name: /appointments/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/appointments')
    
    await user.click(screen.getByRole('link', { name: /messages/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/messages')
    
    await user.click(screen.getByRole('link', { name: /uploads/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/uploads')
    
    await user.click(screen.getByRole('link', { name: /pricing/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/pricing')
  })

  it('displays case count summary', async () => {
    const mockCases = [
      { id: '1', status: 'active', lastActivity: '2024-01-15T10:00:00Z' },
      { id: '2', status: 'active', lastActivity: '2024-01-14T15:30:00Z' },
      { id: '3', status: 'pending', lastActivity: '2024-01-13T09:15:00Z' },
    ]

    vi.mocked(apiClient.getCases).mockResolvedValue({
      success: true,
      data: mockCases,
    })

    renderWithRouter(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/2 active cases/i)).toBeInTheDocument()
      expect(screen.getByText(/1 pending case/i)).toBeInTheDocument()
    })
  })

  it('has proper ARIA attributes', () => {
    renderWithRouter(<DashboardPage />)
    
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('supports keyboard navigation for quick links', async () => {
    const user = userEvent.setup()

    renderWithRouter(<DashboardPage />)
    
    const appointmentsLink = screen.getByRole('link', { name: /appointments/i })
    appointmentsLink.focus()
    expect(appointmentsLink).toHaveFocus()
    
    await user.keyboard('{Enter}')
    expect(mockNavigate).toHaveBeenCalledWith('/appointments')
  })
})
