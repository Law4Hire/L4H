import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { authClient } from '@l4h/shared-ui'

// Mock the auth client
vi.mock('@l4h/shared-ui', async () => {
  const actual = await vi.importActual('@l4h/shared-ui')
  return {
    ...actual,
    authClient: {
      login: vi.fn(),
      remember: vi.fn(),
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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with email and password fields', () => {
    renderWithRouter(<LoginPage />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('renders remember me checkbox', () => {
    renderWithRouter(<LoginPage />)
    
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
  })

  it('handles form submission with valid credentials', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authClient.login).mockResolvedValue({
      success: true,
      token: 'mock-token',
    })
    const mockRemember = vi.mocked(authClient.remember).mockResolvedValue()

    renderWithRouter(<LoginPage />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByLabelText(/remember me/i))
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockRemember).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error message on login failure', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authClient.login).mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    })

    renderWithRouter(<LoginPage />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows loading state during login', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authClient.login).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderWithRouter(<LoginPage />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled()
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()

    renderWithRouter(<LoginPage />)
    
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()

    renderWithRouter(<LoginPage />)
    
    await user.type(screen.getByLabelText(/email/i), 'invalid-email')
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()

    renderWithRouter(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })
    
    emailInput.focus()
    expect(emailInput).toHaveFocus()
    
    await user.keyboard('{Tab}')
    expect(passwordInput).toHaveFocus()
    
    await user.keyboard('{Tab}')
    expect(loginButton).toHaveFocus()
  })

  it('handles remember me functionality', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authClient.login).mockResolvedValue({
      success: true,
      token: 'mock-token',
    })
    const mockRemember = vi.mocked(authClient.remember).mockResolvedValue()

    renderWithRouter(<LoginPage />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    
    // Don't check remember me
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockRemember).not.toHaveBeenCalled()
    })
  })

  it('has proper ARIA attributes', () => {
    renderWithRouter(<LoginPage />)
    
    const form = screen.getByRole('form')
    expect(form).toHaveAttribute('aria-label', 'Login form')
    
    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('required')
    
    const passwordInput = screen.getByLabelText(/password/i)
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('required')
  })
})
