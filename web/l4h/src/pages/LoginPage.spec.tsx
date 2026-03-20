import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './LoginPage'
import { auth } from '@l4h/shared-ui'
import { renderWithProviders } from '../test-utils'

const { mockSharedAuthLogin, mockSharedResendVerification } = vi.hoisted(() => ({
  mockSharedAuthLogin: vi.fn(),
  mockSharedResendVerification: vi.fn(),
}))

// Mock the shared-ui module
vi.mock('@l4h/shared-ui', async () => {
  const actual = await vi.importActual('@l4h/shared-ui')
  return {
    ...actual,
    auth: {
      login: mockSharedAuthLogin,
      resendVerification: mockSharedResendVerification,
    },
    setJwtToken: vi.fn(),
    cases: {
      mine: vi.fn(),
    },
    interview: {
      start: vi.fn(),
    },
    useAuth: () => ({
      login: async (email: string, password: string, rememberMe?: boolean) => {
        try {
          const result = await mockSharedAuthLogin({ email, password, rememberMe })
          return result?.token ? { success: true } : { success: false, error: 'Login failed' }
        } catch (error: any) {
          return { success: false, error: error?.message || 'Login failed' }
        }
      },
    }),
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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with email and password fields', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('renders remember me checkbox', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
  })

  it('has a form with proper aria-label', () => {
    renderWithProviders(<LoginPage />)

    const form = screen.getByRole('form')
    expect(form).toHaveAttribute('aria-label', 'Login form')
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    vi.mocked(auth.login).mockResolvedValue({
      token: 'mock-token',
      isStaff: false,
      isAdmin: false,
      isProfileComplete: true,
      isInterviewComplete: true,
    } as any)

    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      })
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error on login failure', async () => {
    const user = userEvent.setup()
    vi.mocked(auth.login).mockRejectedValue(new Error('Invalid credentials'))

    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      expect(alerts.some(el => el.textContent?.includes('Invalid credentials'))).toBe(true)
    })
  })
})
