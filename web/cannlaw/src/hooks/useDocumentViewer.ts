import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

interface DocumentViewerState {
  isOpen: boolean
  documentId: number | null
  documentUrl: string | null
  documentName: string | null
  contentType: string | null
  isLoading: boolean
  error: string | null
}

interface ViewerOptions {
  enableDownload?: boolean
  enablePrint?: boolean
  enableFullscreen?: boolean
  showMetadata?: boolean
}

interface DocumentMetadata {
  id: number
  fileName: string
  originalFileName: string
  contentType: string
  fileSize: number
  category: string
  description?: string
  uploadDate: string
  uploadedBy: string
  client?: {
    id: number
    firstName: string
    lastName: string
  }
}

export function useDocumentViewer(options: ViewerOptions = {}) {
  const [viewerState, setViewerState] = useState<DocumentViewerState>({
    isOpen: false,
    documentId: null,
    documentUrl: null,
    documentName: null,
    contentType: null,
    isLoading: false,
    error: null
  })
  
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null)
  const [downloadCount, setDownloadCount] = useState(0)
  const { user } = useAuth()

  const openDocument = useCallback(async (documentId: number) => {
    if (!user) {
      setViewerState(prev => ({ ...prev, error: 'Authentication required' }))
      return
    }

    setViewerState(prev => ({
      ...prev,
      isOpen: true,
      documentId,
      isLoading: true,
      error: null
    }))

    try {
      const token = localStorage.getItem('jwt_token')
      
      // Fetch document metadata
      const metadataResponse = await fetch(`/api/v1/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch document metadata')
      }

      const documentMetadata: DocumentMetadata = await metadataResponse.json()
      setMetadata(documentMetadata)

      // Get document view URL
      const viewResponse = await fetch(`/api/v1/documents/${documentId}/view`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!viewResponse.ok) {
        throw new Error('Failed to get document view URL')
      }

      const { viewUrl } = await viewResponse.json()

      setViewerState(prev => ({
        ...prev,
        documentUrl: viewUrl,
        documentName: documentMetadata.originalFileName,
        contentType: documentMetadata.contentType,
        isLoading: false
      }))
    } catch (err) {
      console.error('Error opening document:', err)
      setViewerState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      }))
    }
  }, [user])

  const closeDocument = useCallback(() => {
    setViewerState({
      isOpen: false,
      documentId: null,
      documentUrl: null,
      documentName: null,
      contentType: null,
      isLoading: false,
      error: null
    })
    setMetadata(null)
  }, [])

  const downloadDocument = useCallback(async (documentId?: number) => {
    const targetDocumentId = documentId || viewerState.documentId
    if (!targetDocumentId || !user) return

    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/documents/${targetDocumentId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download document')
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 
                     metadata?.originalFileName || 
                     'document'

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setDownloadCount(prev => prev + 1)
    } catch (err) {
      console.error('Error downloading document:', err)
      setViewerState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to download document'
      }))
    }
  }, [viewerState.documentId, metadata, user])

  const printDocument = useCallback(() => {
    if (viewerState.documentUrl && canPrint()) {
      window.open(viewerState.documentUrl, '_blank')?.print()
    }
  }, [viewerState.documentUrl])

  const getPreviewUrl = useCallback(async (documentId: number): Promise<string | null> => {
    if (!user) return null

    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/documents/${documentId}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        return null
      }

      const { previewUrl } = await response.json()
      return previewUrl
    } catch (err) {
      console.error('Error getting preview URL:', err)
      return null
    }
  }, [user])

  const getThumbnailUrl = useCallback(async (documentId: number): Promise<string | null> => {
    if (!user) return null

    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/documents/${documentId}/thumbnail`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        return null
      }

      const { thumbnailUrl } = await response.json()
      return thumbnailUrl
    } catch (err) {
      console.error('Error getting thumbnail URL:', err)
      return null
    }
  }, [user])

  const canView = useCallback((documentId: number): boolean => {
    if (!user) return false
    
    // Admin can view any document
    if (user.role === 'Admin') return true
    
    // Legal professional can view documents for their assigned clients
    if (user.role === 'LegalProfessional') {
      // This would need to be checked against the document's client assignment
      // For now, assume they can view if they have general access
      return true
    }
    
    return false
  }, [user])

  const canDownload = useCallback((): boolean => {
    return options.enableDownload !== false && !!user
  }, [options.enableDownload, user])

  const canPrint = useCallback((): boolean => {
    return options.enablePrint !== false && !!user
  }, [options.enablePrint, user])

  const canFullscreen = useCallback((): boolean => {
    return options.enableFullscreen !== false
  }, [options.enableFullscreen])

  const isPreviewable = useCallback((contentType: string): boolean => {
    const previewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/html'
    ]
    
    return previewableTypes.includes(contentType.toLowerCase())
  }, [])

  const getFileIcon = useCallback((contentType: string): string => {
    if (contentType.startsWith('image/')) return '🖼️'
    if (contentType.includes('pdf')) return '📄'
    if (contentType.includes('word') || contentType.includes('document')) return '📝'
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '📊'
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '📊'
    if (contentType.includes('zip') || contentType.includes('archive')) return '📦'
    return '📎'
  }, [])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const getViewerComponent = useCallback((contentType: string) => {
    if (contentType.includes('pdf')) {
      return 'pdf-viewer'
    } else if (contentType.startsWith('image/')) {
      return 'image-viewer'
    } else if (contentType.startsWith('text/')) {
      return 'text-viewer'
    } else {
      return 'download-only'
    }
  }, [])

  return {
    viewerState,
    metadata,
    downloadCount,
    openDocument,
    closeDocument,
    downloadDocument,
    printDocument,
    getPreviewUrl,
    getThumbnailUrl,
    canView,
    canDownload: canDownload(),
    canPrint: canPrint(),
    canFullscreen: canFullscreen(),
    isPreviewable,
    getFileIcon,
    formatFileSize,
    getViewerComponent
  }
}