import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container, Card, Button, EmptyState, useToast } from '@l4h/shared-ui'
import { uploads } from '@l4h/shared-ui'
import { useTranslation } from '@l4h/shared-ui'
import { Upload, File, Download, Trash2, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface UploadedFile {
  id: string
  fileName: string
  fileSize: number
  uploadDate: string
  status: 'pending' | 'clean' | 'infected' | 'quarantined'
  caseId: string
}

export default function UploadsPage() {
  const { t } = useTranslation()
  const { success, error } = useToast()
  const queryClient = useQueryClient()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Fetch uploaded files
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['uploads'],
    queryFn: () => uploads.list('current-case-id') // TODO: Get actual case ID
  })

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      // Get presigned URL
      const presignResponse = await uploads.presign({
        caseId: 'current-case-id', // TODO: Get actual case ID
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size
      })

      // Upload to gateway
      const uploadResponse = await fetch(presignResponse.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      // Confirm upload
      return uploads.confirm({
        caseId: 'current-case-id',
        fileName: file.name,
        uploadToken: presignResponse.uploadToken
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] })
      success(t('uploads.uploadComplete'))
    },
    onError: (err) => {
      error(t('uploads.uploadFailed'), err instanceof Error ? err.message : '')
    }
  })

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
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    // Validate file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      error(t('uploads.fileTooLarge'))
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
      error(t('uploads.invalidFileType'))
      return
    }

    setUploading(true)
    try {
      await uploadFileMutation.mutateAsync(file)
    } finally {
      setUploading(false)
    }
  }

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
        return t('uploads.fileClean')
      case 'infected':
        return t('uploads.virusDetected')
      case 'quarantined':
        return t('uploads.fileQuarantined')
      default:
        return t('status.pending')
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
            title={t('common.loading')}
          />
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('uploads.title')}</h1>
      </div>

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
            {t('uploads.dragDrop')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('uploads.or')} <span className="text-blue-600">{t('uploads.browseFiles')}</span>
          </p>
          <input
            type="file"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
          >
            {t('uploads.uploadFiles')}
          </label>
          <p className="text-sm text-gray-500 mt-2">
            {t('uploads.maxSize')} • {t('uploads.fileTypes')}
          </p>
        </div>
      </Card>

      {/* Files List */}
      {files.length === 0 ? (
        <Card>
          <EmptyState
            icon={File}
            title={t('uploads.noFiles')}
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
                      onClick={() => uploads.download(file.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement delete functionality
                        console.log('Delete file:', file.id)
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
              <span>{t('uploads.uploading')}</span>
            </div>
          </Card>
        </div>
      )}
    </Container>
  )
}

