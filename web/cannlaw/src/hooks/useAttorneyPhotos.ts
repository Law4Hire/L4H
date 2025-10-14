import { useState } from 'react'
import { useAuth } from './useAuth'
import { useFileUpload } from './useFileUpload'

interface AttorneyPhoto {
  id: number
  attorneyId: number
  photoUrl: string
  originalFileName: string
  fileSize: number
  uploadDate: string
  uploadedBy: string
}

interface PhotoUploadResult {
  success: boolean
  error?: string
  photoUrl?: string
}

export function useAttorneyPhotos() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { user } = useAuth()
  const { uploadFile, validateFile } = useFileUpload()

  const uploadAttorneyPhoto = async (attorneyId: number, file: File): Promise<PhotoUploadResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Validate file
    const validation = validateFile(file, {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['.jpg', '.jpeg', '.png', '.webp', 'image/jpeg', 'image/png', 'image/webp']
    })

    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const result = await uploadFile(
        file,
        `/api/v1/attorneys/${attorneyId}/photo`,
        {
          maxFileSize: 5 * 1024 * 1024,
          allowedTypes: ['.jpg', '.jpeg', '.png', '.webp'],
          onProgress: (progress) => {
            setUploadProgress(progress.progress)
          }
        }
      )

      if (result.success) {
        return { 
          success: true, 
          photoUrl: result.fileUrl 
        }
      } else {
        return { 
          success: false, 
          error: result.error 
        }
      }
    } catch (err) {
      console.error('Error uploading attorney photo:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteAttorneyPhoto = async (attorneyId: number): Promise<PhotoUploadResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/attorneys/${attorneyId}/photo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete attorney photo')
      }

      return { success: true }
    } catch (err) {
      console.error('Error deleting attorney photo:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    }
  }

  const getAttorneyPhoto = async (attorneyId: number): Promise<AttorneyPhoto | null> => {
    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/attorneys/${attorneyId}/photo`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 404) {
        return null // No photo found
      }

      if (!response.ok) {
        throw new Error('Failed to fetch attorney photo')
      }

      return await response.json()
    } catch (err) {
      console.error('Error fetching attorney photo:', err)
      throw err
    }
  }

  const updateAttorneyPhoto = async (attorneyId: number, file: File): Promise<PhotoUploadResult> => {
    // Delete existing photo first, then upload new one
    const deleteResult = await deleteAttorneyPhoto(attorneyId)
    if (!deleteResult.success && deleteResult.error !== 'Photo not found') {
      return deleteResult
    }

    return uploadAttorneyPhoto(attorneyId, file)
  }

  const processImageForUpload = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Set target dimensions (e.g., 400x400 for attorney photos)
        const targetSize = 400
        canvas.width = targetSize
        canvas.height = targetSize

        // Calculate scaling to maintain aspect ratio
        const scale = Math.min(targetSize / img.width, targetSize / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale

        // Center the image
        const x = (targetSize - scaledWidth) / 2
        const y = (targetSize - scaledHeight) / 2

        // Fill background with white
        if (ctx) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, targetSize, targetSize)

          // Draw the scaled image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(processedFile)
            } else {
              reject(new Error('Failed to process image'))
            }
          }, 'image/jpeg', 0.9)
        } else {
          reject(new Error('Canvas context not available'))
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const uploadProcessedAttorneyPhoto = async (attorneyId: number, file: File): Promise<PhotoUploadResult> => {
    try {
      const processedFile = await processImageForUpload(file)
      return uploadAttorneyPhoto(attorneyId, processedFile)
    } catch (err) {
      console.error('Error processing image:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to process image' 
      }
    }
  }

  const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'File must be an image' }
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return { isValid: false, error: 'Image size must be less than 5MB' }
    }

    // Check image dimensions (optional - can be done after loading)
    return { isValid: true }
  }

  const getPhotoUploadUrl = (attorneyId: number): string => {
    return `/api/v1/attorneys/${attorneyId}/photo`
  }

  const canUploadPhoto = (): boolean => {
    return user?.role === 'Admin'
  }

  const canDeletePhoto = (): boolean => {
    return user?.role === 'Admin'
  }

  const getDefaultPhotoUrl = (): string => {
    return '/images/default-attorney-photo.png'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    isUploading,
    uploadProgress,
    uploadAttorneyPhoto,
    deleteAttorneyPhoto,
    getAttorneyPhoto,
    updateAttorneyPhoto,
    uploadProcessedAttorneyPhoto,
    processImageForUpload,
    validateImageFile,
    getPhotoUploadUrl,
    canUploadPhoto: canUploadPhoto(),
    canDeletePhoto: canDeletePhoto(),
    getDefaultPhotoUrl,
    formatFileSize
  }
}