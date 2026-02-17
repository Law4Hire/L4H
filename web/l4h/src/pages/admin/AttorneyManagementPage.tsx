import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Card, Button, Input, Modal, useToast } from '@l4h/shared-ui'
import { 
  X, User, Mail, Edit, AlertTriangle, 
  Camera, MapPin, Briefcase, RefreshCw, CheckCircle, RotateCcw
} from 'lucide-react'
import { useAttorneys } from '../../hooks/useAttorneys'
import { AttorneyPhotoManager } from '../../components/admin/AttorneyPhotoManager'

interface AttorneyFormData {
  name: string
  title: string
  bio: string
  photoUrl: string
  email: string
  phone: string
  directPhone: string
  directEmail: string
  officeLocation: string
  defaultHourlyRate: number
  credentials: string
  practiceAreas: string
  languages: string
  isActive: boolean
  isManagingAttorney: boolean
  displayOrder: number
}

interface FormErrors {
  [key: string]: string
}

interface Attorney {
  id: number
  name: string
  title: string
  email: string
  phone: string
  bio?: string
  photoUrl?: string
  directPhone: string
  directEmail: string
  officeLocation: string
  practiceAreas: string // JSON string
  languages: string // JSON string
  credentials: string // JSON string
  defaultHourlyRate: number
  isManagingAttorney: boolean
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

const AttorneyManagementPage: React.FC = () => {
  const { attorneys, isLoading, createAttorney, updateAttorney, refetch: fetchAttorneys } = useAttorneys()
  const [showForm, setShowForm] = useState(false)
  const [editingAttorney, setEditingAttorney] = useState<Attorney | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [attorneyToDeactivate, setAttorneyToDeactivate] = useState<Attorney | null>(null)
  const [showPhotoManager, setShowPhotoManager] = useState(false)
  const [activePhotoAttorney, setActivePhotoAttorney] = useState<Attorney | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const { success, error } = useToast()

  const [formData, setFormData] = useState<AttorneyFormData>({
    name: '',
    title: '',
    bio: '',
    photoUrl: '',
    email: '',
    phone: '',
    directPhone: '',
    directEmail: '',
    officeLocation: '',
    defaultHourlyRate: 250,
    credentials: '',
    practiceAreas: '',
    languages: '',
    isActive: true,
    isManagingAttorney: false,
    displayOrder: 1
  })

  const handleReactivate = async (attorney: Attorney) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${attorney.id}/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to reactivate attorney')
      }

      success('Attorney profile reactivated')
      await fetchAttorneys()
    } catch (err) {
      console.error('Error reactivating attorney:', err)
      error('Failed to reactivate attorney')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Set photoPreviewUrl when editing an attorney
  useEffect(() => {
    if (editingAttorney && editingAttorney.photoUrl) {
      setPhotoPreviewUrl(editingAttorney.photoUrl)
    } else {
      setPhotoPreviewUrl('')
    }
  }, [editingAttorney])

  // Validation functions
  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (formData.defaultHourlyRate < 0) {
      errors.defaultHourlyRate = 'Hourly rate cannot be negative'
    }

    if (formData.displayOrder < 0) {
      errors.displayOrder = 'Display order cannot be negative'
    }

    // Validate JSON fields
    if (formData.credentials) {
      try {
        JSON.parse(formData.credentials)
      } catch {
        errors.credentials = 'Please enter valid JSON array format'
      }
    }

    if (formData.practiceAreas) {
      try {
        JSON.parse(formData.practiceAreas)
      } catch {
        errors.practiceAreas = 'Please enter valid JSON array format'
      }
    }

    if (formData.languages) {
      try {
        JSON.parse(formData.languages)
      } catch {
        errors.languages = 'Please enter valid JSON array format'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      const numValue = parseFloat(value)
      // Allow empty string or 0, but prevent NaN if possible, though parseFloat('') is NaN
      // Better to check if value is empty string
      if (value === '') {
         setFormData(prev => ({ ...prev, [name]: 0 }))
      } else {
         setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Photo upload functions
  const uploadPhotoToServer = async (attorneyId: number, file: File) => {
    const uploadData = new FormData()
    uploadData.append('photo', file)

    const token = localStorage.getItem('jwt_token')
    const response = await fetch(`/api/v1/attorneys/${attorneyId}/photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: uploadData
    })

    if (!response.ok) {
      throw new Error('Failed to upload photo')
    }

    return await response.json()
  }

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      error('Please select an image file (JPG, PNG, WebP)')
      return
    }

    // If editing existing attorney, upload immediately
    if (editingAttorney) {
      setUploadingPhoto(true)
      try {
        const result = await uploadPhotoToServer(editingAttorney.id, file)
        setFormData(prev => ({ ...prev, photoUrl: result.photoUrl }))
        setPhotoPreviewUrl(result.photoUrl)
        success('Photo uploaded successfully')
        await fetchAttorneys()
      } catch (err) {
        console.error('Photo upload error:', err)
        error('Failed to upload photo')
      } finally {
        setUploadingPhoto(false)
      }
    } else {
      // If creating new attorney, store file for upload after save
      setPendingPhotoFile(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      
      // Revoke previous blob URL if exists to prevent memory leaks
      if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl)
      }
      
      setPhotoPreviewUrl(previewUrl)
      success('Photo selected. It will be uploaded when you save the profile.')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoUpload(e.target.files[0])
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      bio: '',
      photoUrl: '',
      email: '',
      phone: '',
      directPhone: '',
      directEmail: '',
      officeLocation: '',
      defaultHourlyRate: 250,
      credentials: '',
      practiceAreas: '',
      languages: '',
      isActive: true,
      isManagingAttorney: false,
      displayOrder: 1
    })
    setEditingAttorney(null)
    setShowForm(false)
    setFormErrors({})
    setPendingPhotoFile(null)
    if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl)
    }
    setPhotoPreviewUrl('')
  }

  const handleDeactivateAttorney = async () => {
    if (!attorneyToDeactivate) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${attorneyToDeactivate.id}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate attorney')
      }

      success('Attorney deactivated successfully')
      await fetchAttorneys()
      setShowDeactivateModal(false)
      setAttorneyToDeactivate(null)
    } catch (err) {
      console.error('Error deactivating attorney:', err)
      error('Failed to deactivate attorney')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (attorney: Attorney) => {
    setFormData({
      name: attorney.name || '',
      title: attorney.title || '',
      bio: attorney.bio || '',
      photoUrl: attorney.photoUrl || '',
      email: attorney.email || '',
      phone: attorney.phone || '',
      directPhone: attorney.directPhone || '',
      directEmail: attorney.directEmail || '',
      officeLocation: attorney.officeLocation || '',
      defaultHourlyRate: attorney.defaultHourlyRate || 250,
      credentials: attorney.credentials || '',
      practiceAreas: attorney.practiceAreas || '',
      languages: attorney.languages || '',
      isActive: attorney.isActive,
      isManagingAttorney: attorney.isManagingAttorney,
      displayOrder: attorney.displayOrder || 1
    })
    setEditingAttorney(attorney)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const attorneyData = {
        ...formData,
        photoUrl: formData.photoUrl || undefined,
        credentials: formData.credentials || '[]',
        practiceAreas: formData.practiceAreas || '[]',
        languages: formData.languages || '[]'
      }

      let result
      if (editingAttorney) {
        result = await updateAttorney(editingAttorney.id, attorneyData)
      } else {
        result = await createAttorney(attorneyData)
      }

      if (result.success) {
        // If there's a pending photo and we just created a new attorney, upload it
        if (pendingPhotoFile && (result as any).data?.id) {
          try {
            setUploadingPhoto(true)
            await uploadPhotoToServer((result as any).data.id, pendingPhotoFile)
            success(`Attorney created and photo uploaded successfully`)
          } catch (photoErr) {
            console.error('Photo upload error after creation:', photoErr)
            success(`Attorney created successfully, but photo upload failed`)
          } finally {
            setUploadingPhoto(false)
          }
        } else {
          success(`Attorney ${editingAttorney ? 'updated' : 'created'} successfully`)
        }
        resetForm()
        await fetchAttorneys()
      } else {
        error(result.error || 'Failed to save attorney')
      }
    } catch (err) {
      error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-gray-600 dark:text-gray-400">Loading attorney records...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex justify-between items-center transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attorney Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage legal professional profiles and public listings</p>
        </div>
        <Button
          variant="primary"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          Add New Professional
        </Button>
      </div>

      {/* Attorney Form */}
      {showForm && (
        <Card className="p-6 border-t-4 border-t-blue-600 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {editingAttorney ? <Edit size={20} /> : <User size={20} />}
              {editingAttorney ? `Edit: ${editingAttorney.name}` : 'New Professional Profile'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sidebar: Photo and Status */}
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl text-center space-y-4">
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider">
                    Profile Photo
                  </label>
                  <div className="relative group mx-auto w-32 h-32">
                    {(photoPreviewUrl || formData.photoUrl) ? (
                      <img
                        src={photoPreviewUrl || formData.photoUrl}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-md"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-600">
                        <User className="w-12 h-12 text-gray-300 dark:text-gray-500" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title={uploadingPhoto ? "Uploading..." : "Upload Photo"}
                    >
                      {uploadingPhoto ? <RefreshCw size={16} className="animate-spin" /> : <Camera size={16} />}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {pendingPhotoFile && !editingAttorney && (
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 italic">Photo selected. It will be uploaded when you save.</p>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Publicly Active</span>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Managing Attorney</span>
                      <input
                        type="checkbox"
                        name="isManagingAttorney"
                        checked={formData.isManagingAttorney}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider">
                    Display Order
                  </label>
                  <Input
                    name="displayOrder"
                    type="number"
                    min={0}
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Main Fields */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Denise S. Cann"
                      error={formErrors.name}
                      className="dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Professional Title</label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Senior Attorney"
                      className="dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Office Location</label>
                    <Input
                      name="officeLocation"
                      value={formData.officeLocation}
                      onChange={handleInputChange}
                      placeholder="e.g. Baltimore Office"
                      className="dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-gray-800/50 p-4 rounded-lg border border-blue-100 dark:border-gray-600">
                  <h3 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase mb-3 flex items-center gap-2">
                    <Mail size={14} /> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      name="email"
                      label="Public Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="public@cannlaw.com"
                      className="bg-white dark:bg-gray-800 dark:text-white"
                    />
                    <Input
                      name="phone"
                      label="Public Phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(410) 988-0123"
                      className="bg-white dark:bg-gray-800 dark:text-white"
                    />
                    <Input
                      name="directEmail"
                      label="Internal Direct Email"
                      value={formData.directEmail}
                      onChange={handleInputChange}
                      placeholder="direct@cannlaw.com"
                      className="bg-white dark:bg-gray-800 dark:text-white"
                    />
                    <Input
                      name="directPhone"
                      label="Internal Direct Phone"
                      value={formData.directPhone}
                      onChange={handleInputChange}
                      placeholder="(410) 988-XXXX"
                      className="bg-white dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Biography</label>
                  <textarea
                    name="bio"
                    rows={5}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Describe professional background and expertise..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Practice Areas (JSON)</label>
                    <textarea
                      name="practiceAreas"
                      rows={3}
                      value={formData.practiceAreas}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 font-mono text-xs dark:text-white"
                      placeholder='["Area 1", "Area 2"]'
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Languages (JSON)</label>
                    <textarea
                      name="languages"
                      rows={3}
                      value={formData.languages}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 font-mono text-xs dark:text-white"
                      placeholder='["English", "Spanish"]'
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Credentials (JSON)</label>
                    <textarea
                      name="credentials"
                      rows={3}
                      value={formData.credentials}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 font-mono text-xs dark:text-white"
                      placeholder='["J.D.", "LLM"]'
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-700">
                  <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={isSubmitting} className="px-8">
                    {editingAttorney ? 'Update Profile' : 'Create Profile'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Attorney List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {attorneys.map((attorney) => (
          <div
            key={attorney.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border-t-4 transition-all hover:shadow-xl ${
              attorney.isActive ? 'border-t-blue-600' : 'border-t-red-500 opacity-90 bg-red-50/30 dark:bg-red-900/10'
            }`}
          >
            <div className="p-6">
              {!attorney.isActive && (
                <div className="mb-4 flex items-center justify-center py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold uppercase tracking-[0.2em] rounded">
                  Deactivated Profile
                </div>
              )}
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative group/photo">
                  {attorney.photoUrl ? (
                    <img
                      src={attorney.photoUrl}
                      alt={attorney.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                      <User size={32} />
                    </div>
                  )}
                  {attorney.isActive && (
                    <button 
                      onClick={() => { setActivePhotoAttorney(attorney); setShowPhotoManager(true); }}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity text-white"
                      title="Manage Photos"
                    >
                      <Camera size={16} />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{attorney.name}</h3>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest truncate">{attorney.title}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{attorney.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{attorney.officeLocation || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-blue-400">
                  <Briefcase size={14} />
                  <span>${attorney.defaultHourlyRate}/hr</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                {attorney.isActive ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(attorney)}
                      className="flex items-center gap-1 dark:border-gray-600"
                    >
                      <Edit size={14} /> Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setAttorneyToDeactivate(attorney); setShowDeactivateModal(true); }}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:border-gray-600"
                    >
                      Deactivate
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleReactivate(attorney)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <RotateCcw size={14} /> Reactivate Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Manager Modal */}
      <Modal
        open={showPhotoManager}
        onClose={() => { setShowPhotoManager(false); setActivePhotoAttorney(null); fetchAttorneys(); }}
        title="Attorney Photo Management"
        size="lg"
      >
        {activePhotoAttorney && (
          <AttorneyPhotoManager
            attorneyId={activePhotoAttorney.id}
            attorneyName={activePhotoAttorney.name}
            currentPhotoUrl={activePhotoAttorney.photoUrl}
            onPhotoSelected={() => {}} // fetchAttorneys handles this via onClose
          />
        )}
        <div className="mt-8 flex justify-end">
          <Button variant="primary" onClick={() => { setShowPhotoManager(false); setActivePhotoAttorney(null); fetchAttorneys(); }}>
            Done
          </Button>
        </div>
      </Modal>

      {/* Deactivation Confirmation Modal */}
      <Modal
        open={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Deactivate Professional"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3 text-red-600 bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-100 dark:border-red-900">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm">
              Are you sure you want to deactivate <strong>{attorneyToDeactivate?.name}</strong>? They will no longer appear in public listings or be available for scheduling.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeactivateModal(false)}>Cancel</Button>
            <Button variant="primary" className="bg-red-600 hover:bg-red-700 border-none" onClick={handleDeactivateAttorney} loading={isSubmitting}>
              Deactivate Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AttorneyManagementPage
