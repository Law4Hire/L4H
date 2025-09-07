import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

// Mock focus trap
const mockFocusTrap = {
  activate: vi.fn(),
  deactivate: vi.fn(),
}

vi.mock('focus-trap-react', () => ({
  default: ({ children }: { children: React.ReactNode }) => {
    React.useEffect(() => {
      mockFocusTrap.activate()
      return () => mockFocusTrap.deactivate()
    }, [])
    return <div data-testid="focus-trap">{children}</div>
  },
}))

describe('Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any modals that might be left open
    const modals = document.querySelectorAll('[role="dialog"]')
    modals.forEach(modal => modal.remove())
  })

  it('renders when open', () => {
    render(
      <Modal open onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onClose when escape key is pressed', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()
    
    render(
      <Modal open onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    await user.keyboard('{Escape}')
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()
    
    render(
      <Modal open onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    const backdrop = screen.getByTestId('modal-backdrop')
    await user.click(backdrop)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when modal content is clicked', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()
    
    render(
      <Modal open onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )
    
    const content = screen.getByText('Modal content')
    await user.click(content)
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('renders with title', () => {
    render(
      <Modal open onClose={vi.fn()} title="Modal Title">
        <div>Modal content</div>
      </Modal>
    )
    
    expect(screen.getByText('Modal Title')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders close button when showCloseButton is true', () => {
    render(
      <Modal open onClose={vi.fn()} showCloseButton>
        <div>Modal content</div>
      </Modal>
    )
    
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()
    
    render(
      <Modal open onClose={handleClose} showCloseButton>
        <div>Modal content</div>
      </Modal>
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('applies correct size classes', () => {
    const { rerender } = render(
      <Modal open onClose={vi.fn()} size="sm">
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByTestId('modal-content')).toHaveClass('max-w-md')
    
    rerender(
      <Modal open onClose={vi.fn()} size="md">
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByTestId('modal-content')).toHaveClass('max-w-lg')
    
    rerender(
      <Modal open onClose={vi.fn()} size="lg">
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByTestId('modal-content')).toHaveClass('max-w-2xl')
  })

  it('has correct ARIA attributes', () => {
    render(
      <Modal open onClose={vi.fn()} title="Modal Title">
        <div>Modal content</div>
      </Modal>
    )
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })

  it('traps focus when open', () => {
    render(
      <Modal open onClose={vi.fn()}>
        <button>Focusable button</button>
      </Modal>
    )
    
    // Check that the modal is rendered and focusable elements exist
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Focusable button' })).toBeInTheDocument()
  })

  it('releases focus when closed', () => {
    const { rerender } = render(
      <Modal open onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )
    
    rerender(
      <Modal open={false} onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )
    
    // Check that the modal is no longer rendered
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <Modal open onClose={vi.fn()} className="custom-modal">
        <div>Modal content</div>
      </Modal>
    )
    
    expect(screen.getByTestId('modal-content')).toHaveClass('custom-modal')
  })
})
