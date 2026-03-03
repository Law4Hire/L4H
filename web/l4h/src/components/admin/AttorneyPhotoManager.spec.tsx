import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AttorneyPhotoManager } from './AttorneyPhotoManager'
import { renderWithProviders } from '../../test-utils'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@l4h/shared-ui', async () => {
  const actual = await vi.importActual('@l4h/shared-ui')
  return {
    ...actual,
    useToast: () => ({ success: vi.fn(), error: vi.fn() }),
  }
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const IMAGE_PRIMARY = {
  id: '1',
  fileUrl: '/img/attorney-1.jpg',
  fileName: 'attorney-1.jpg',
  isPrimary: true,
  createdAt: '2025-01-01T00:00:00Z',
}

const IMAGE_SECONDARY = {
  id: '2',
  fileUrl: '/img/attorney-2.jpg',
  fileName: 'attorney-2.jpg',
  isPrimary: false,
  createdAt: '2025-01-02T00:00:00Z',
}

const TWO_IMAGES = [IMAGE_PRIMARY, IMAGE_SECONDARY]

/**
 * Builds a vitest-compatible fetch mock that handles all endpoints used by
 * AttorneyPhotoManager.  Pass `images` to override the GET /images response.
 */
function makeFetch(overrides: { images?: typeof TWO_IMAGES } = {}) {
  return vi.fn(async (url: string, options?: RequestInit): Promise<Response> => {
    const method = (options?.method ?? 'GET').toUpperCase()

    if (method === 'GET' && String(url).includes('/images')) {
      return { ok: true, json: async () => overrides.images ?? TWO_IMAGES } as Response
    }
    if (method === 'POST' && String(url).endsWith('/photo')) {
      return {
        ok: true,
        json: async () => ({
          id: '3',
          fileUrl: '/img/uploaded.jpg',
          fileName: 'uploaded.jpg',
          isPrimary: false,
          createdAt: '2025-01-03T00:00:00Z',
        }),
      } as Response
    }
    if (method === 'POST' && String(url).includes('/select')) {
      return {
        ok: true,
        json: async () => ({ photoUrl: IMAGE_SECONDARY.fileUrl }),
      } as Response
    }
    if (method === 'DELETE') {
      return { ok: true, json: async () => ({}) } as Response
    }
    return { ok: false, json: async () => ({}) } as Response
  })
}

const DEFAULT_PROPS = {
  attorneyId: 1,
  attorneyName: 'Test Attorney',
  onPhotoSelected: vi.fn(),
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('mock-jwt-token')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AttorneyPhotoManager — loading & layout', () => {
  it('shows a spinner while the image list is being fetched', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))) // never resolves
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders all three column headings after load', async () => {
    vi.stubGlobal('fetch', makeFetch())
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)
    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('Available Pictures')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('renders the three action buttons', async () => {
    vi.stubGlobal('fetch', makeFetch())
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Select Picture/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Delete Picture/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Upload Picture/i })).toBeInTheDocument()
    })
  })

  it('shows "No pictures available" when the attorney has no images', async () => {
    vi.stubGlobal('fetch', makeFetch({ images: [] }))
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)
    await waitFor(() => {
      expect(screen.getByText('No pictures available')).toBeInTheDocument()
    })
  })
})

describe('AttorneyPhotoManager — image selection behaviour', () => {
  it('auto-highlights the primary image on load', async () => {
    vi.stubGlobal('fetch', makeFetch())
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)
    await waitFor(() => {
      expect(screen.getByText('Current profile picture')).toBeInTheDocument()
    })
  })

  it('shows the primary image in the preview on load', async () => {
    vi.stubGlobal('fetch', makeFetch())
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)
    await waitFor(() => {
      const imgs = screen.getAllByRole('img')
      const previewImg = imgs.find(img => img.getAttribute('src') === IMAGE_PRIMARY.fileUrl)
      expect(previewImg).toBeTruthy()
    })
  })

  it('updates the preview when a different image is clicked in the list', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', makeFetch())
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)

    // Wait for the list to populate, then click the list button for IMAGE_SECONDARY
    await waitFor(() =>
      expect(screen.getAllByText(IMAGE_SECONDARY.fileName).length).toBeGreaterThan(0)
    )
    // The list button's accessible name contains the filename
    await user.click(screen.getByRole('button', { name: new RegExp(IMAGE_SECONDARY.fileName) }))

    await waitFor(() => {
      const imgs = screen.getAllByRole('img')
      const previewImg = imgs.find(img => img.getAttribute('src') === IMAGE_SECONDARY.fileUrl)
      expect(previewImg).toBeTruthy()
    })
  })

  it('Select Picture is disabled when the highlighted image is already primary', async () => {
    vi.stubGlobal('fetch', makeFetch())
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)
    // Wait for images to load — "Current profile picture" label confirms primary is shown
    await waitFor(() =>
      expect(screen.getByText('Current profile picture')).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: /Select Picture/i })).toBeDisabled()
  })

  it('Select Picture becomes enabled after clicking a non-primary image', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', makeFetch())
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)

    await waitFor(() =>
      expect(screen.getAllByText(IMAGE_SECONDARY.fileName).length).toBeGreaterThan(0)
    )
    await user.click(screen.getByRole('button', { name: new RegExp(IMAGE_SECONDARY.fileName) }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Select Picture/i })).not.toBeDisabled()
    )
  })

  it('Select Picture is disabled when there are no images', async () => {
    vi.stubGlobal('fetch', makeFetch({ images: [] }))
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)
    await waitFor(() => screen.getByText('No pictures available'))
    expect(screen.getByRole('button', { name: /Select Picture/i })).toBeDisabled()
  })

  it('Delete Picture is disabled when there are no images', async () => {
    vi.stubGlobal('fetch', makeFetch({ images: [] }))
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)
    await waitFor(() => screen.getByText('No pictures available'))
    expect(screen.getByRole('button', { name: /Delete Picture/i })).toBeDisabled()
  })
})

describe('AttorneyPhotoManager — Select Picture API call', () => {
  it('calls the /select endpoint when Select Picture is clicked', async () => {
    const user = userEvent.setup()
    const mockFetch = makeFetch()
    vi.stubGlobal('fetch', mockFetch)
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)

    await waitFor(() =>
      expect(screen.getAllByText(IMAGE_SECONDARY.fileName).length).toBeGreaterThan(0)
    )
    await user.click(screen.getByRole('button', { name: new RegExp(IMAGE_SECONDARY.fileName) }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Select Picture/i })).not.toBeDisabled()
    )
    await user.click(screen.getByRole('button', { name: /Select Picture/i }))

    await waitFor(() => {
      const selectCall = mockFetch.mock.calls.find(
        ([url, opts]) => String(url).includes('/select') && (opts as RequestInit)?.method === 'POST'
      )
      expect(selectCall).toBeTruthy()
      expect(String(selectCall![0])).toContain(`/images/${IMAGE_SECONDARY.id}/select`)
    })
  })

  it('calls onPhotoSelected callback with the new URL after selecting', async () => {
    const user = userEvent.setup()
    const onPhotoSelected = vi.fn()
    vi.stubGlobal('fetch', makeFetch())
    renderWithProviders(
      <AttorneyPhotoManager {...DEFAULT_PROPS} onPhotoSelected={onPhotoSelected} />
    )

    await waitFor(() =>
      expect(screen.getAllByText(IMAGE_SECONDARY.fileName).length).toBeGreaterThan(0)
    )
    await user.click(screen.getByRole('button', { name: new RegExp(IMAGE_SECONDARY.fileName) }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Select Picture/i })).not.toBeDisabled()
    )
    await user.click(screen.getByRole('button', { name: /Select Picture/i }))

    await waitFor(() => {
      expect(onPhotoSelected).toHaveBeenCalledWith(IMAGE_SECONDARY.fileUrl)
    })
  })
})

describe('AttorneyPhotoManager — Delete Picture API call', () => {
  it('calls the delete endpoint after the user confirms', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const mockFetch = makeFetch()
    vi.stubGlobal('fetch', mockFetch)
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)

    // Wait for primary image to load (it will be auto-highlighted)
    await waitFor(() =>
      expect(screen.getByText('Current profile picture')).toBeInTheDocument()
    )
    await user.click(screen.getByRole('button', { name: /Delete Picture/i }))

    await waitFor(() => {
      const deleteCall = mockFetch.mock.calls.find(
        ([url, opts]) =>
          String(url).includes(`/images/${IMAGE_PRIMARY.id}`) &&
          (opts as RequestInit)?.method === 'DELETE'
      )
      expect(deleteCall).toBeTruthy()
    })
  })

  it('does NOT call the delete endpoint when the user cancels the confirmation', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const mockFetch = makeFetch()
    vi.stubGlobal('fetch', mockFetch)
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)

    await waitFor(() =>
      expect(screen.getByText('Current profile picture')).toBeInTheDocument()
    )
    const callsBefore = mockFetch.mock.calls.length

    await user.click(screen.getByRole('button', { name: /Delete Picture/i }))

    expect(mockFetch.mock.calls.length).toBe(callsBefore)
  })
})

describe('AttorneyPhotoManager — Upload Picture (file input gateway)', () => {
  it('Upload Picture is the only button that triggers the file input', async () => {
    vi.stubGlobal('fetch', makeFetch())
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)
    await waitFor(() => screen.getByRole('button', { name: /Upload Picture/i }))

    // Only one hidden file input exists
    const fileInputs = document.querySelectorAll('input[type="file"]')
    expect(fileInputs.length).toBe(1)

    // Select Picture and Delete Picture do not reference a file input
    const selectBtn = screen.getByRole('button', { name: /Select Picture/i })
    const deleteBtn = screen.getByRole('button', { name: /Delete Picture/i })
    expect(selectBtn).not.toHaveAttribute('type', 'file')
    expect(deleteBtn).not.toHaveAttribute('type', 'file')
  })

  it('calls the photo upload endpoint when a valid image file is selected', async () => {
    const user = userEvent.setup()
    const mockFetch = makeFetch()
    vi.stubGlobal('fetch', mockFetch)
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)

    await waitFor(() => screen.getByRole('button', { name: /Upload Picture/i }))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const testFile = new File(['(binary image data)'], 'new-photo.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, testFile)

    await waitFor(() => {
      const uploadCall = mockFetch.mock.calls.find(
        ([url, opts]) => String(url).endsWith('/photo') && (opts as RequestInit)?.method === 'POST'
      )
      expect(uploadCall).toBeTruthy()
    })
  })

  it('does NOT upload when a non-image file is selected', async () => {
    const user = userEvent.setup()
    const mockFetch = makeFetch()
    vi.stubGlobal('fetch', mockFetch)
    renderWithProviders(<AttorneyPhotoManager {...DEFAULT_PROPS} />)

    await waitFor(() => screen.getByRole('button', { name: /Upload Picture/i }))

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const callsBefore = mockFetch.mock.calls.length

    const pdfFile = new File(['%PDF content'], 'document.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, pdfFile)

    // No additional fetch calls for an invalid file type
    expect(mockFetch.mock.calls.length).toBe(callsBefore)
  })
})
