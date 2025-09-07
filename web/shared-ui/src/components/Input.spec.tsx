import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'

describe('Input', () => {
  it('renders with correct placeholder', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('handles value changes', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello')
    
    expect(handleChange).toHaveBeenCalled()
    expect(input).toHaveValue('Hello')
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    
    render(<Input />)
    
    const input = screen.getByRole('textbox')
    input.focus()
    expect(input).toHaveFocus()
    
    await user.keyboard('{Tab}')
    expect(input).not.toHaveFocus()
  })

  it('applies correct variant classes', () => {
    const { rerender } = render(<Input variant="default" />)
    expect(screen.getByRole('textbox')).toHaveClass('border-gray-300')
    
    rerender(<Input variant="error" />)
    expect(screen.getByRole('textbox')).toHaveClass('border-error-500')
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<Input size="sm" />)
    expect(screen.getByRole('textbox')).toHaveClass('px-3', 'py-1.5', 'text-sm')
    
    rerender(<Input size="md" />)
    expect(screen.getByRole('textbox')).toHaveClass('px-3', 'py-2', 'text-base')
    
    rerender(<Input size="lg" />)
    expect(screen.getByRole('textbox')).toHaveClass('px-4', 'py-3', 'text-lg')
  })

  it('handles disabled state', () => {
    render(<Input disabled />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input.className).toContain('opacity-50')
    expect(input.className).toContain('cursor-not-allowed')
  })

  it('shows error message when provided', () => {
    render(<Input error="This field is required" />)
    
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveClass('border-error-500')
  })

  it('shows helper text when provided', () => {
    render(<Input helperText="Enter your email address" />)
    
    expect(screen.getByText('Enter your email address')).toBeInTheDocument()
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Input ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })

  it('supports aria attributes', () => {
    render(
      <Input 
        aria-label="Custom label" 
        aria-describedby="description"
        aria-required="true"
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-label', 'Custom label')
    expect(input).toHaveAttribute('aria-describedby', 'description')
    expect(input).toHaveAttribute('aria-required', 'true')
  })

  it('associates label with input', () => {
    render(<Input label="Email" id="email" />)
    
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('id', 'email')
  })

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
    
    rerender(<Input type="password" />)
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password')
    
    rerender(<Input type="number" />)
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
  })
})
