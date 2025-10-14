import React, { useState, useEffect } from 'react'
import DocumentManagementInterface from '../../components/DocumentManagementInterface'

enum DocumentCategory {
  PersonalDocuments = 'Personal Documents',
  GovernmentForms = 'Government Forms',
  SupportingEvidence = 'Supporting Evidence',
  Correspondence = 'Correspondence',
  Legal = 'Legal',
  Other = 'Other'
}

interface Document {
  id: number
  fileName: string
  originalFileName: string
  fileUrl: string
  contentType: string
  fileSize: number
  category: DocumentCategory
  description: string
  uploadDate: string
  uploadedBy: string
  clientId?: number
  clientName?: string
}

const DocumentManagementPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const docs = await response.json()
        setDocuments(docs)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentUploaded = (document: Document) => {
    setDocuments(prev => [document, ...prev])
  }

  const handleDocumentDeleted = (documentId: number) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }

  const handleDocumentUpdated = (updatedDocument: Document) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === updatedDocument.id ? updatedDocument : doc
    ))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
        <p className="text-gray-600">Organize and manage all client documents</p>
      </div>

      {/* Document Management Interface */}
      <DocumentManagementInterface
        documents={documents}
        onDocumentUploaded={handleDocumentUploaded}
        onDocumentDeleted={handleDocumentDeleted}
        onDocumentUpdated={handleDocumentUpdated}
      />
    </div>
  )
}

export default DocumentManagementPage