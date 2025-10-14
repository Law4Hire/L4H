import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  url?: string
}

interface UploadOptions {
  maxFileSize?: number // in bytes
  allowedTypes?: string[]
  onProgress?: (progress: UploadProgress) => void
  onComplete?: (result: UploadResult) => void
  onError?: (error: string) => void
}

interface UploadResult {
  success: boolean
  error?: string
  fileUrl?: string
  fileName?: string
  fileId?: string
}

interface FileValidation {
  isValid: boolean
  error?: string
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const { user } = useAuth()

  const validateFile = useCallback((file: File, options?: UploadOptions): FileValidation => {
    // Check file size
    const maxSize = options?.maxFileSize || 10 * 1024 * 1024 // 10MB default
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
      }
    }

    // Check file type
    if (options?.allowedTypes && options.allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      const mimeType = file.type.toLowerCase()
      
      const isAllowed = options.allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.substring(1)
        } else if (type.includes('/')) {
          return mimeType === type || mimeType.startsWith(type.split('/')[0] + '/')
        }
        return false
      })

      if (!isAllowed) {
        return {
          isValid: false,
          error: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
        }
      }
    }

    return { isValid: true }
  }, [])

  const uploadFile = useCallback(async (
    file: File, 
    endpoint: string, 
    options?: UploadOptions
  ): Promise<UploadResult> => {
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate file
    const validation = validateFile(file, options)
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const progress: UploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }

    // Add to uploads map
    setUploads(prev => new Map(prev.set(fileId, progress)))
    setIsUploading(true)

    try {
      const token = localStorage.getItem('jwt_token')
      const formData = new FormData()
      formData.append('file', file)

      // Update status to uploading
      const uploadingProgress = { ...progress, status: 'uploading' as const }
      setUploads(prev => new Map(prev.set(fileId, uploadingProgress)))
      options?.onProgress?.(uploadingProgress)

      const xhr = new XMLHttpRequest()

      return new Promise<UploadResult>((resolve) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progressPercent = Math.round((event.loaded / event.total) * 100)
            const updatedProgress = { ...uploadingProgress, progress: progressPercent }
            setUploads(prev => new Map(prev.set(fileId, updatedProgress)))
            options?.onProgress?.(updatedProgress)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              const completedProgress = {
                ...uploadingProgress,
                status: 'completed' as const,
                progress: 100,
                url: response.fileUrl
              }
              setUploads(prev => new Map(prev.set(fileId, completedProgress)))
              
              const result = {
                success: true,
                fileUrl: response.fileUrl,
                fileName: response.fileName || file.name,
                fileId: response.fileId || fileId
              }
              
              options?.onProgress?.(completedProgress)
              options?.onComplete?.(result)
              resolve(result)
            } catch (err) {
              const errorProgress = {
                ...uploadingProgress,
                status: 'error' as const,
                error: 'Invalid response from server'
              }
              setUploads(prev => new Map(prev.set(fileId, errorProgress)))
              options?.onError?.('Invalid response from server')
              resolve({ success: false, error: 'Invalid response from server' })
            }
          } else {
            const errorMessage = xhr.responseText || `Upload failed with status ${xhr.status}`
            const errorProgress = {
              ...uploadingProgress,
              status: 'error' as const,
              error: errorMessage
            }
            setUploads(prev => new Map(prev.set(fileId, errorProgress)))
            options?.onError?.(errorMessage)
            resolve({ success: false, error: errorMessage })
          }
          
          setIsUploading(false)
        })

        xhr.addEventListener('error', () => {
          const errorMessage = 'Network error during upload'
          const errorProgress = {
            ...uploadingProgress,
            status: 'error' as const,
            error: errorMessage
          }
          setUploads(prev => new Map(prev.set(fileId, errorProgress)))
          options?.onError?.(errorMessage)
          setIsUploading(false)
          resolve({ success: false, error: errorMessage })
        })

        xhr.open('POST', endpoint)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      const errorProgress = {
        ...progress,
        status: 'error' as const,
        error: errorMessage
      }
      setUploads(prev => new Map(prev.set(fileId, errorProgress)))
      setIsUploading(false)
      return { success: false, error: errorMessage }
    }
  }, [user, validateFile])

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    endpoint: string,
    options?: UploadOptions
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = []
    
    for (const file of files) {
      const result = await uploadFile(file, endpoint, options)
      results.push(result)
    }
    
    return results
  }, [uploadFile])

  const removeUpload = useCallback((fileId: string) => {
    setUploads(prev => {
      const newMap = new Map(prev)
      newMap.delete(fileId)
      return newMap
    })
  }, [])

  const clearUploads = useCallback(() => {
    setUploads(new Map())
  }, [])

  const getUploadProgress = useCallback((fileId: string): UploadProgress | undefined => {
    return uploads.get(fileId)
  }, [uploads])

  const getAllUploads = useCallback((): UploadProgress[] => {
    return Array.from(uploads.values())
  }, [uploads])

  const getCompletedUploads = useCallback((): UploadProgress[] => {
    return Array.from(uploads.values()).filter(upload => upload.status === 'completed')
  }, [uploads])

  const getFailedUploads = useCallback((): UploadProgress[] => {
    return Array.from(uploads.values()).filter(upload => upload.status === 'error')
  }, [uploads])

  const retryUpload = useCallback(async (
    fileId: string,
    file: File,
    endpoint: string,
    options?: UploadOptions
  ): Promise<UploadResult> => {
    // Remove the failed upload
    removeUpload(fileId)
    // Start a new upload
    return uploadFile(file, endpoint, options)
  }, [uploadFile, removeUpload])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const getFileIcon = useCallback((fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    const iconMap: Record<string, string> = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      txt: '📄',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      webp: '🖼️',
      zip: '📦',
      rar: '📦',
      xlsx: '📊',
      xls: '📊',
      ppt: '📊',
      pptx: '📊'
    }
    
    return iconMap[extension || ''] || '📎'
  }, [])

  return {
    uploads: getAllUploads(),
    isUploading,
    uploadFile,
    uploadMultipleFiles,
    removeUpload,
    clearUploads,
    getUploadProgress,
    getCompletedUploads,
    getFailedUploads,
    retryUpload,
    validateFile,
    formatFileSize,
    getFileIcon
  }
}