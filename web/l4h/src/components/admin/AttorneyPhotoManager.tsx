import React, { useState, useEffect, useRef } from 'react'
import { Button, useToast } from '@l4h/shared-ui'
import { Camera, Trash2, Check, Upload, Loader2 } from 'lucide-react'

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
  onPhotoSelected
}) => {
  const [images, setImages] = useState<AttorneyImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  // highlightedId: the image currently highlighted in the middle column
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { success, error } = useToast()

  useEffect(() => {
    fetchImages()
  }, [attorneyId])

  const fetchImages = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${attorneyId}/images`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch images')
      const data: AttorneyImage[] = await response.json()
      setImages(data)
      // Auto-highlight the current primary image
      const primary = data.find(i => i.isPrimary)
      setHighlightedId(primary?.id ?? data[0]?.id ?? null)
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
    // Reset so the same file can be re-selected if needed
    e.target.value = ''

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
        headers: { 'Authorization': `Bearer ${token}` },
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

  const handleSelectPicture = async () => {
    if (!highlightedId) return
    const highlighted = images.find(i => i.id === highlightedId)
    if (highlighted?.isPrimary) return // already primary

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${attorneyId}/images/${highlightedId}/select`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Selection failed')
      const data = await response.json()
      onPhotoSelected(data.photoUrl)
      success('Profile picture updated')
      await fetchImages()
    } catch (err) {
      error('Failed to select image')
    }
  }

  const handleDeletePicture = async () => {
    if (!highlightedId) return
    if (!window.confirm('Delete this image?')) return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${attorneyId}/images/${highlightedId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Deletion failed')
      success('Image deleted')
      await fetchImages()
    } catch (err) {
      error('Failed to delete image')
    }
  }

  const highlightedImage = images.find(i => i.id === highlightedId) ?? null

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        Photos for {attorneyName}
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="flex gap-4">

          {/* LEFT — Preview */}
          <div className="flex-shrink-0 w-44 flex flex-col items-center gap-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Preview</p>
            <div className="w-44 h-44 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
              {highlightedImage ? (
                <img
                  src={highlightedImage.fileUrl}
                  alt={highlightedImage.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            {highlightedImage && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 truncate w-full px-1">
                {highlightedImage.fileName}
              </p>
            )}
            {highlightedImage?.isPrimary && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <Check size={12} /> Current
              </span>
            )}
          </div>

          {/* MIDDLE — Image list */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Available Pictures</p>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {images.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
                  <Camera size={28} />
                  <span className="text-sm">No pictures available</span>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
                  {images.map(image => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setHighlightedId(image.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        image.id === highlightedId
                          ? 'bg-blue-50 dark:bg-blue-900/30 ring-inset ring-1 ring-blue-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <img
                        src={image.fileUrl}
                        alt={image.fileName}
                        className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{image.fileName}</p>
                        {image.isPrimary && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">Current profile picture</span>
                        )}
                      </div>
                      {image.id === highlightedId && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Action buttons */}
          <div className="flex-shrink-0 w-36 flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</p>

            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center"
              onClick={handleSelectPicture}
              disabled={!highlightedId || highlightedImage?.isPrimary}
            >
              <Check size={14} className="mr-1.5" /> Select Picture
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 disabled:opacity-40"
              onClick={handleDeletePicture}
              disabled={!highlightedId}
            >
              <Trash2 size={14} className="mr-1.5" /> Delete Picture
            </Button>

            {/* Upload button — the ONLY trigger for the file selector */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading
                ? <Loader2 size={14} className="mr-1.5 animate-spin" />
                : <Upload size={14} className="mr-1.5" />}
              Upload Picture
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
            />
          </div>

        </div>
      )}
    </div>
  )
}
