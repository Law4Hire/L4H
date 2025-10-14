import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

interface Document {
  id: number
  clientId: number
  client?: {
    id: number
    firstName: string
    lastName: string
  }
  fileName: string
  originalFileName: string
  fileUrl: string
  contentType: string
  fileSize: number
  category: DocumentCategory
  description?: string
  uploadDate: string
  uploadedBy: string
  uploadedByUser?: {
    id: number
    name: string
  }
}

enum DocumentCategory {
  PersonalDocuments = 'Personal Documents',
  GovernmentForms = 'Government Forms',
  SupportingEvidence = 'Supporting Evidence',
  Correspondence = 'Correspondence',
  Legal = 'Legal',
  Other = 'Other'
}

interface DocumentFilters {
  clientId?: number
  category?: DocumentCategory
  searchTerm?: string
  uploadedBy?: string
  startDate?: string
  endDate?: string
  sortBy?: 'name' | 'uploadDate' | 'size' | 'category'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

interface DocumentsResponse {
  documents: Document[]
  totalCount: number
  totalPages: number
  currentPage: number
  totalSize: number
}

interface DocumentResult {
  success: boolean
  error?: string
  document?: Document
}

export function useDocuments(clientId?: number) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalSize, setTotalSize] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchDocuments({ clientId })
  }, [clientId, user])

  const fetchDocuments = async (filters?: DocumentFilters) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('jwt_token')
      
      // Build query parameters
      const params = new URLSearchParams()
      
      // Apply role-based filtering
      if (user?.role === 'LegalProfessional' && user.attorneyId && !filters?.clientId) {
        params.append('attorneyId', user.attorneyId.toString())
      }
      
      // Apply search filters
      if (filters?.clientId) params.append('clientId', filters.clientId.toString())
      if (filters?.category) params.append('category', filters.category)
      if (filters?.searchTerm) params.append('search', filters.searchTerm)
      if (filters?.uploadedBy) params.append('uploadedBy', filters.uploadedBy)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.sortBy) params.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())

      const response = await fetch(`/api/v1/documents?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied: You do not have permission to view documents')
        }
        throw new Error('Failed to fetch documents')
      }
      
      const result: DocumentsResponse = await response.json()
      setDocuments(result.documents)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setCurrentPage(result.currentPage)
      setTotalSize(result.totalSize)
      setError(null)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const getDocument = async (id: number): Promise<Document> => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/documents/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch document')
      }
      
      return await response.json()
    } catch (err) {
      console.error('Error fetching document:', err)
      throw err
    }
  }

  const uploadDocument = async (
    clientId: number,
    file: File,
    category: DocumentCategory,
    description?: string
  ): Promise<DocumentResult> => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('jwt_token')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clientId', clientId.toString())
      formData.append('category', category)
      if (description) formData.append('description', description)

      const response = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to upload document')
      }

      const newDocument = await response.json()
      await fetchDocuments({ clientId }) // Refresh data
      return { success: true, document: newDocument }
    } catch (err) {
      console.error('Error uploading document:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const updateDocument = async (id: number, updates: Partial<Document>): Promise<DocumentResult> => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update document')
      }

      const updatedDocument = await response.json()
      await fetchDocuments({ clientId }) // Refresh data
      return { success: true, document: updatedDocument }
    } catch (err) {
      console.error('Error updating document:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteDocument = async (id: number): Promise<DocumentResult> => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete document')
      }

      await fetchDocuments({ clientId }) // Refresh data
      return { success: true }
    } catch (err) {
      console.error('Error deleting document:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const downloadDocument = async (id: number): Promise<DocumentResult> => {
    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/documents/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to download document')
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'document'

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

      return { success: true }
    } catch (err) {
      console.error('Error downloading document:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    }
  }

  const getDocumentsByCategory = async (category: DocumentCategory) => {
    return fetchDocuments({ clientId, category })
  }

  const searchDocuments = async (searchTerm: string) => {
    return fetchDocuments({ clientId, searchTerm })
  }

  const getRecentDocuments = async (days: number = 7) => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    return fetchDocuments({ 
      clientId, 
      startDate: startDate.toISOString().split('T')[0],
      sortBy: 'uploadDate',
      sortOrder: 'desc'
    })
  }

  const canUploadDocument = (targetClientId?: number): boolean => {
    if (!user) return false
    
    // Admin can upload to any client
    if (user.role === 'Admin') return true
    
    // Legal professional can upload to their assigned clients
    if (user.role === 'LegalProfessional' && targetClientId) {
      // This would need to be checked against the client's assigned attorney
      // For now, assume they can upload if they have access to the client
      return true
    }
    
    return false
  }

  const canEditDocument = (document: Document): boolean => {
    if (!user) return false
    
    // Admin can edit any document
    if (user.role === 'Admin') return true
    
    // Legal professional can edit documents they uploaded for their clients
    if (user.role === 'LegalProfessional' && document.uploadedBy === user.email) {
      return true
    }
    
    return false
  }

  const canDeleteDocument = (document: Document): boolean => {
    if (!user) return false
    
    // Admin can delete any document
    if (user.role === 'Admin') return true
    
    // Legal professional can delete documents they uploaded
    if (user.role === 'LegalProfessional' && document.uploadedBy === user.email) {
      return true
    }
    
    return false
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (contentType: string): string => {
    if (contentType.startsWith('image/')) return '🖼️'
    if (contentType.includes('pdf')) return '📄'
    if (contentType.includes('word') || contentType.includes('document')) return '📝'
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '📊'
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '📊'
    if (contentType.includes('zip') || contentType.includes('archive')) return '📦'
    return '📎'
  }

  const getCategoryColor = (category: DocumentCategory): string => {
    const colors: Record<DocumentCategory, string> = {
      [DocumentCategory.PersonalDocuments]: 'blue',
      [DocumentCategory.GovernmentForms]: 'green',
      [DocumentCategory.SupportingEvidence]: 'purple',
      [DocumentCategory.Correspondence]: 'orange',
      [DocumentCategory.Legal]: 'red',
      [DocumentCategory.Other]: 'gray'
    }
    return colors[category] || 'gray'
  }

  return {
    documents,
    totalCount,
    totalPages,
    currentPage,
    totalSize,
    isLoading,
    error,
    isUpdating,
    getDocument,
    uploadDocument,
    updateDocument,
    deleteDocument,
    downloadDocument,
    getDocumentsByCategory,
    searchDocuments,
    getRecentDocuments,
    searchDocuments: fetchDocuments,
    refetch: () => fetchDocuments({ clientId }),
    canUploadDocument,
    canEditDocument,
    canDeleteDocument,
    formatFileSize,
    getFileIcon,
    getCategoryColor,
    DocumentCategory
  }
}