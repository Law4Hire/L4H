import React, { useState, useRef } from 'react'
import { Card, Button, Input, Modal } from '@l4h/shared-ui'
import { Plus, Search, Download, Edit, X, CheckCircle } from '@l4h/shared-ui'

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

enum DocumentCategory {
  PersonalDocuments = 'Personal Documents',
  GovernmentForms = 'Government Forms',
  SupportingEvidence = 'Supporting Evidence',
  Correspondence = 'Correspondence',
  Legal = 'Legal',
  Other = 'Other'
}

interface DocumentManagementInterfaceProps {
  clientId?: number
  documents: Document[]
  onDocumentUploaded?: (document: Document) => void
  onDocumentDeleted?: (documentId: number) => void
  onDocumentUpdated?: (document: Document) => void
}

const DocumentManagementInterface: React.FC<DocumentManagementInterfaceProps> = ({
  clientId,
  documents,
  onDocumentUploaded,
  onDocumentDeleted,
  onDocumentUpdated
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload form state
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(DocumentCategory.Other)
  const [uploadDescription, setUploadDescription] = useState('')

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      setUploadFiles(prev => [...prev, ...files])
      setShowUploadModal(true)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setUploadFiles(prev => [...prev, ...files])
      setShowUploadModal(true)
    }
  }

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return

    setIsUploading(true)
    const token = localStorage.getItem('jwt_token')

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', uploadCategory)
        formData.append('description', uploadDescription)
        if (clientId) {
          formData.append('clientId', clientId.toString())
        }

        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

        const response = await fetch('/api/v1/documents/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (response.ok) {
          const uploadedDoc = await response.json()
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
          
          if (onDocumentUploaded) {
            onDocumentUploaded(uploadedDoc)
          }
        } else {
          throw new Error(`Failed to upload ${file.name}`)
        }
      }

      // Reset form
      setUploadFiles([])
      setUploadCategory(DocumentCategory.Other)
      setUploadDescription('')
      setShowUploadModal(false)
      setUploadProgress({})
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload some files. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }  
const handleDownload = async (document: Document) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/documents/${document.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = document.originalFileName
        window.document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        window.document.body.removeChild(a)
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download document')
    }
  }

  const handleEdit = (document: Document) => {
    setEditingDocument(document)
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingDocument) return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/documents/${editingDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: editingDocument.category,
          description: editingDocument.description
        })
      })

      if (response.ok) {
        const updatedDoc = await response.json()
        if (onDocumentUpdated) {
          onDocumentUpdated(updatedDoc)
        }
        setShowEditModal(false)
        setEditingDocument(null)
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update document')
    }
  }

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        if (onDocumentDeleted) {
          onDocumentDeleted(documentId)
        }
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document')
    }
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
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊'
    return '📎'
  }

  const getCategoryColor = (category: DocumentCategory): string => {
    switch (category) {
      case DocumentCategory.PersonalDocuments:
        return 'bg-blue-100 text-blue-800'
      case DocumentCategory.GovernmentForms:
        return 'bg-red-100 text-red-800'
      case DocumentCategory.SupportingEvidence:
        return 'bg-green-100 text-green-800'
      case DocumentCategory.Correspondence:
        return 'bg-purple-100 text-purple-800'
      case DocumentCategory.Legal:
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Document Management</h2>
          <p className="text-sm text-gray-600">{documents.length} documents</p>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {Object.values(DocumentCategory).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Drag and Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-4xl mb-4">📁</div>
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drag and drop files here
        </p>
        <p className="text-sm text-gray-600 mb-4">
          or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            browse to upload
          </button>
        </p>
        <p className="text-xs text-gray-500">
          Supports: PDF, DOC, DOCX, JPG, PNG, GIF (Max 10MB per file)
        </p>
      </div>  
    {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getFileIcon(doc.contentType)}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {doc.originalFileName}
                  </h4>
                  <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                  <Download className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(doc)}>
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(doc.category)}`}>
                  {doc.category}
                </span>
              </div>
              
              {doc.description && (
                <p className="text-xs text-gray-600 line-clamp-2">{doc.description}</p>
              )}
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</p>
                <p>By: {doc.uploadedBy}</p>
                {doc.clientName && <p>Client: {doc.clientName}</p>}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                  View/Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria.'
              : 'Upload your first document to get started.'
            }
          </p>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        open={showUploadModal}
        onClose={() => {
          setShowUploadModal(false)
          setUploadFiles([])
          setUploadProgress({})
        }}
        title="Upload Documents"
        size="lg"
      >
        <div className="space-y-4">
          {/* File List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Files to Upload ({uploadFiles.length})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uploadFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>{getFileIcon(file.type)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadProgress[file.name] !== undefined && (
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[file.name]}%` }}
                        ></div>
                      </div>
                    )}
                    
                    {uploadProgress[file.name] === 100 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : uploadProgress[file.name] !== undefined ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeUploadFile(index)}
                        disabled={isUploading}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              disabled={isUploading}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              {Object.values(DocumentCategory).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              disabled={isUploading}
              rows={3}
              placeholder="Add a description for these documents..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Upload Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadModal(false)
                setUploadFiles([])
                setUploadProgress({})
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={uploadFiles.length === 0 || isUploading}
              loading={isUploading}
            >
              {isUploading ? 'Uploading...' : `Upload ${uploadFiles.length} File${uploadFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Document Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingDocument(null)
        }}
        title="Edit Document"
        size="md"
      >
        {editingDocument && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
              <Input
                value={editingDocument.originalFileName}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={editingDocument.category}
                onChange={(e) => setEditingDocument({
                  ...editingDocument,
                  category: e.target.value as DocumentCategory
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.values(DocumentCategory).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editingDocument.description}
                onChange={(e) => setEditingDocument({
                  ...editingDocument,
                  description: e.target.value
                })}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingDocument(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DocumentManagementInterface