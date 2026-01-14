import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Button, Input, useToast, fetchJson, apiClient } from '@l4h/shared-ui'
import { User, Mail, Phone, MapPin, Camera } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface AttorneyProfile {
  id: number
  name: string
  title: string
  bio: string
  photoUrl: string
  email: string
  phone: string
  directPhone: string
  directEmail: string
  officeLocation: string
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const { success, error } = useToast()
  const [profile, setProfile] = useState<AttorneyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<AttorneyProfile | null>(null) // Define formData state


  const fetchProfile = useCallback(async () => {
    if (!user) return // Ensure user is available for profile fetching
    setIsLoading(true)
    try {
      const token = localStorage.getItem('jwt_token')
      const headers = { Authorization: `Bearer ${token}` }
      const response = await fetchJson(`/v1/users/${user.id}/profile`, { headers })
      setProfile(response.data)
      setFormData(response.data) // Initialize form with fetched data
    } catch (err) {
      console.error('Error fetching profile:', err)
      error('Error fetching profile', (err as Error).message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }, [user, error])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (profile) {
      setProfile({ ...profile, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      setIsSubmitting(true)
      await fetchJson('/v1/attorneys/me', {
        method: 'PUT',
        body: JSON.stringify(profile)
      })
      success('Profile updated successfully')
    } catch (err) {
      error('An error occurred while saving', (err as Error).message || 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profile) {
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('photo', file)

      try {
        setUploadingPhoto(true)
        // Note: fetchJson handles JSON, but for FormData we might need to handle headers differently 
        // or let the browser set Content-Type. fetchJson forces Content-Type: application/json.
        // So we fallback to raw fetch for file upload but use getJwtToken logic if needed, 
        // or ideally update fetchJson. For now, let's use a small helper or manual fetch 
        // but with the token retrieval logic from a shared place if possible.
        
        const token = localStorage.getItem('jwt_token')
        const response = await fetch(`/api/v1/attorneys/${profile.id}/photo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }, // FormData sets its own Content-Type
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          setProfile({ ...profile, photoUrl: result.photoUrl })
          success('Photo uploaded successfully')
        } else {
          error('Failed to upload photo', (await response.json()).message || 'Unknown error')
        }
      } catch (err) {
        error('Error uploading photo', (err as Error).message || 'Unknown error')
      } finally {
        setUploadingPhoto(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Profile not found. Please contact administrator.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-navy-900 rounded-lg shadow-sm p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Edit Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Update your public attorney information</p>
        </div>
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-navy-50 dark:border-navy-800 shadow-inner">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-400" />
              </div>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-gold-500 rounded-full text-navy-900 shadow-md hover:bg-gold-400 transition-all"
            title="Change Photo"
          >
            <Camera size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            className="hidden" 
            accept="image/*"
          />
          {uploadingPhoto && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-full">
              <div className="animate-spin h-5 w-5 border-2 border-navy-600 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <Input value={profile.name} disabled className="bg-gray-50 cursor-not-allowed" />
              <p className="text-xs text-gray-500 mt-1">Name cannot be changed here. Please contact admin.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Professional Title</label>
              <Input name="title" value={profile.title} onChange={handleInputChange} placeholder="e.g. Senior Attorney" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Office Location</label>
              <Input name="officeLocation" value={profile.officeLocation} onChange={handleInputChange} placeholder="e.g. Baltimore Office" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Biography</label>
              <textarea 
                name="bio"
                value={profile.bio} 
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-md bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Share your experience and expertise..."
              />
            </div>
          </div>
        </Card>

        <Card title="Contact Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Public Email</label>
              <Input name="email" value={profile.email} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Public Phone</label>
              <Input name="phone" value={profile.phone} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direct Email (Internal)</label>
              <Input name="directEmail" value={profile.directEmail} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direct Phone (Internal)</label>
              <Input name="directPhone" value={profile.directPhone} onChange={handleInputChange} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={isSaving} size="lg" className="px-10 bg-navy-900 dark:bg-gold-500 dark:text-navy-900">
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ProfilePage