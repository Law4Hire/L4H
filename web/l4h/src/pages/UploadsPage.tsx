import React, { useState, useCallback } from 'react'
import { Container, Card, Button, EmptyState, useToast, useQuery, useMutation, useQueryClient } from '@l4h/shared-ui'
import { uploads, cases } from '@l4h/shared-ui'
import { Upload, File, Download, Trash2, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { apiClient } from '../apiClient'

interface UploadedFile {
  id: string
  fileName: string
  fileSize: number
  uploadDate: string
  status: 'pending' | 'clean' | 'infected' | 'quarantined'
  caseId: string
}

export default function UploadsPage() {
  const { success, error } = useToast()
  const queryClient = useQueryClient()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)

  const { data: casesList = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: cases.mine
  })

  const activeCaseId = casesList[0]?.id as string | undefined

  // Fetch uploaded files
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['uploads', activeCaseId],
    queryFn: async () => {
      const uploadItems = await uploads.list(activeCaseId!)
      return uploadItems.map((item: any) => ({
        id: item.id,
        fileName: item.originalName,
        fileSize: item.sizeBytes,
        uploadDate: item.createdAt,
        status: item.status,
        caseId: activeCaseId
      }))
    },
    enabled: !!activeCaseId
  })

  // Fetch verified legal documents from the pool
  const { data: verifiedDocs = [], isLoading: isLoadingPool } = useQuery({
    queryKey: ['verified-docs'],
    queryFn: () => apiClient.getMyVerifiedDocuments()
  })

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeCaseId) {
        throw new Error('No case is available for uploads yet.')
      }

      // Get presigned URL
      const presignResponse = await uploads.presign({
        caseId: activeCaseId,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size
      })

      // Upload to gateway
      const uploadResponse = await fetch(presignResponse.url, {
        method: 'PUT',
        body: file,
        headers: presignResponse.headers
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      // Confirm upload
      return uploads.confirm({
        caseId: activeCaseId,
        key: presignResponse.key
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads', activeCaseId] })
      success('File uploaded successfully')
    },
    onError: (err) => {
      error('File upload failed', err instanceof Error ? err.message : '')
    }
  })

  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      error('File is too large. Maximum size is 25MB.')
      return
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      error('Invalid file type.')
      return
    }

    setUploading(true)
    try {
      await uploadFileMutation.mutateAsync(file)
    } finally {
      setUploading(false)
    }
  }, [activeCaseId, error, uploadFileMutation])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }, [handleFileUpload])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [handleFileUpload])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clean':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'infected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'quarantined':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'clean':
        return 'File is clean'
      case 'infected':
        return 'Virus detected!'
      case 'quarantined':
        return 'File is quarantined'
      default:
        return 'Pending'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <Container>
        <Card>
          <EmptyState
            icon={Upload}
            title={'Loading...'}
          />
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{'File Uploads'}</h1>
      </div>

      {!activeCaseId && (
        <Card className="mb-6">
          <EmptyState
            icon={File}
            title={'No case available yet'}
            description="Create or activate a case before uploading documents."
          />
        </Card>
      )}

      {/* Verified Legal Documents */}
      {verifiedDocs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{'Verified Legal Documents'}</h2>
          <Card>
            <div className="space-y-4">
              {verifiedDocs.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border-l-4 border-green-500 bg-green-50/30 rounded-r-lg">
                  <div className="flex items-center space-x-4">
                    <File className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.originalFileName}</h3>
                      <div className="text-sm text-gray-500">
                        {'Verified on '} {format(new Date(doc.verifiedAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(doc.fileUrl, '_blank')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Upload Area */}
      <Card className="mb-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {'Drag and drop files here'}
          </h3>
          <p className="text-gray-600 mb-4">
            {'or'} <span className="text-blue-600">{'browse files'}</span>
          </p>
          <input
            type="file"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            disabled={!activeCaseId}
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${activeCaseId ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            {'Upload Files'}
          </label>
          <p className="text-sm text-gray-500 mt-2">
            {'Max file size: 25MB'} • {'Allowed file types: PDF, JPG, PNG, DOC, DOCX'}
          </p>
        </div>
      </Card>

      {/* Files List */}
      {files.length === 0 ? (
        <Card>
          <EmptyState
            icon={File}
            title={'No files uploaded yet'}
            description="Upload your first file to get started"
          />
        </Card>
      ) : (
        <Card>
          <div className="space-y-4">
            {files.map((file: UploadedFile) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <File className="h-8 w-8 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {file.fileName}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>{format(new Date(file.uploadDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(file.status)}
                    <span className="text-sm font-medium">
                      {getStatusText(file.status)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const blob = await uploads.download(file.id)
                          const url = window.URL.createObjectURL(blob)
                          const link = document.createElement('a')
                          link.href = url
                          link.download = file.fileName
                          link.click()
                          window.URL.revokeObjectURL(url)
                        } catch (err) {
                          error('Download failed', err instanceof Error ? err.message : '')
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await uploads.delete(file.id)
                          queryClient.invalidateQueries({ queryKey: ['uploads', activeCaseId] })
                          success('File deleted successfully')
                        } catch (err) {
                          error('Delete failed', err instanceof Error ? err.message : '')
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <Upload className="h-6 w-6 animate-pulse" />
              <span>{'Uploading...'}</span>
            </div>
          </Card>
        </div>
      )}
    </Container>
  )
}

