import React, { useState, useEffect } from 'react'
import { Card, Button, Modal, useToast } from '@l4h/shared-ui'
import { Camera, Trash2, Check, Upload, X, Loader2 } from 'lucide-react'

interface AttorneyImage {
  id: string
  fileUrl: string
  fileName: string
  isPrimary: boolean
  createdAt: string
}

interface AttorneyPhotoManagerProps {
  attorneyId: number
  attorneyName: string
  currentPhotoUrl?: string
  onPhotoSelected: (url: string) => void
}

export const AttorneyPhotoManager: React.FC<AttorneyPhotoManagerProps> = ({
  attorneyId,
  attorneyName,
  currentPhotoUrl,
  onPhotoSelected
}) => {
  const [images, setImages] = useState<AttorneyImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const { success, error } = useToast()

  useEffect(() => {
    fetchImages()
  }, [attorneyId])

  const fetchImages = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${attorneyId}/images`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch images')
      const data = await response.json()
      setImages(data)
      
      // Auto-select primary image
      const primary = data.find((i: AttorneyImage) => i.isPrimary)
      if (primary) setSelectedImageId(primary.id)
    } catch (err) {
      console.error('Error fetching attorney images:', err)
      error('Failed to load images')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      error('Please select an image file')
      return
    }

    const formData = new FormData()
    formData.append('photo', file)

    setIsUploading(true)
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${attorneyId}/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')
      
      success('Image uploaded successfully')
      await fetchImages()
    } catch (err) {
      error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelect = async (imageId: string) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${attorneyId}/images/${imageId}/select`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Selection failed')
      
      const data = await response.json()
      setSelectedImageId(imageId)
      onPhotoSelected(data.photoUrl)
      success('Profile picture updated')
      await fetchImages()
    } catch (err) {
      error('Failed to select image')
    }
  }

  const handleDelete = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${attorneyId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Deletion failed')
      
      success('Image deleted')
      if (selectedImageId === imageId) setSelectedImageId(null)
      await fetchImages()
    } catch (err) {
      error('Failed to delete image')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manage Photos for {attorneyName}</h3>
        <div className="relative">
          <input
            type="file"
            id="photo-upload"
            className="hidden"
            accept=".jpg,.jpeg,.jfif,.png,.gif,.tiff,.tif,.heic,.webp,image/*"
            onChange={handleUpload}
            disabled={isUploading}
          />
          <label
            htmlFor="photo-upload"
            className="cursor-pointer inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 text-sm gap-2"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload New Photo
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No photos uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div 
              key={image.id}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                image.id === selectedImageId 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <img 
                src={image.fileUrl} 
                alt={image.fileName}
                className="w-full aspect-square object-cover"
              />
              
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white p-1 rounded-full shadow-lg">
                  <Check size={12} />
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-blue-600 hover:bg-blue-700 text-xs py-1 px-2"
                    onClick={() => handleSelect(image.id)}
                  >
                    Select
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/90 hover:bg-red-50 text-red-600 border-none p-1.5"
                  onClick={() => handleDelete(image.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImageId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-400">
            <Camera size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Profile Picture Tip</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              The selected image will be used as the primary profile picture across the entire platform.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
