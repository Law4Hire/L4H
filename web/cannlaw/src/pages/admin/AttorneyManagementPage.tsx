import React, { useState, useRef } from 'react'
import { Card, Button, Input, Modal, useToast } from '@l4h/shared-ui'
import { X, User, Mail, Phone, Edit, AlertTriangle, CheckCircle, Upload, Image as ImageIcon } from '@l4h/shared-ui'
import { useAttorneys } from '../../hooks/useAttorneys'

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
  barNumber?: string
  licenseState?: string
  practiceAreas: string // JSON string
  languages: string // JSON string
  credentials: string // JSON string
  yearsOfExperience: number
  defaultHourlyRate: number
  isManagingAttorney: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const AttorneyManagementPage: React.FC = () => {
  const { attorneys, isLoading, createAttorney, updateAttorney, refetch: fetchAttorneys } = useAttorneys()
  const { success: toastSuccess, error: toastError } = useToast()
  
  const [showForm, setShowForm] = useState(false)
  const [editingAttorney, setEditingAttorney] = useState<Attorney | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [attorneyToDeactivate, setAttorneyToDeactivate] = useState<Attorney | null>(null)
  
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

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
    credentials: '[]',
    practiceAreas: '[]',
    languages: '["English"]',
    isActive: true,
    isManagingAttorney: false,
    displayOrder: 1
  })

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (formData.defaultHourlyRate < 0) errors.defaultHourlyRate = 'Hourly rate cannot be negative'
    
    // Simple JSON validation
    const jsonFields: (keyof AttorneyFormData)[] = ['credentials', 'practiceAreas', 'languages']
    jsonFields.forEach(field => {
      try {
        if (formData[field]) JSON.parse(formData[field] as string)
      } catch (e) {
        errors[field] = 'Invalid JSON format. Expected an array like ["Item 1", "Item 2"]'
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toastError('Invalid file type', 'Please select an image file (JPG, PNG, WebP)')
      return
    }

    // If we're creating a new attorney, we can't upload yet because we need an ID
    // Instead, we'll create a local preview URL
    if (!editingAttorney) {
        const previewUrl = URL.createObjectURL(file)
        setFormData(prev => ({ ...prev, photoUrl: previewUrl }))
        // In a real scenario, we might upload to a temp location or wait for creation
        toastSuccess('Photo selected', 'Photo will be saved when you create the attorney.')
        return
    }

    setUploadingPhoto(true)
    try {
      const uploadData = new FormData()
      uploadData.append('photo', file)

      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${editingAttorney.id}/photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      })

      if (!response.ok) throw new Error('Failed to upload photo')

      const result = await response.json()
      setFormData(prev => ({ ...prev, photoUrl: result.photoUrl }))
      toastSuccess('Success', 'Photo uploaded and updated successfully')
      fetchAttorneys()
    } catch (error: any) {
      toastError('Upload failed', error.message)
    } finally {
      setUploadingPhoto(false)
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
      credentials: '[]',
      practiceAreas: '[]',
      languages: '["English"]',
      isActive: true,
      isManagingAttorney: false,
      displayOrder: (attorneys?.length || 0) + 1
    })
    setEditingAttorney(null)
    setShowForm(false)
    setFormErrors({})
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
      defaultHourlyRate: attorney.defaultHourlyRate || 0,
      credentials: attorney.credentials || '[]',
      practiceAreas: attorney.practiceAreas || '[]',
      languages: attorney.languages || '["English"]',
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
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (editingAttorney) {
        await updateAttorney(editingAttorney.id, formData)
        toastSuccess('Success', 'Attorney profile updated successfully')
      } else {
        await createAttorney(formData)
        toastSuccess('Success', 'New attorney created successfully')
      }
      resetForm()
      fetchAttorneys()
    } catch (error: any) {
      toastError('Error', error.message || 'Failed to save attorney')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async () => {
    if (!attorneyToDeactivate) return
    try {
        const updated = { ...attorneyToDeactivate, isActive: false }
        await updateAttorney(attorneyToDeactivate.id, updated)
        toastSuccess('Success', `${attorneyToDeactivate.name} has been deactivated`)
        setShowDeactivateModal(false)
        fetchAttorneys()
    } catch (error: any) {
        toastError('Error', error.message)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 dark:bg-navy-950 min-h-screen transition-colors duration-300">
      <div className="flex justify-between items-center bg-white dark:bg-navy-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-navy-800">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy-900 dark:text-white">Attorney & Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Configure the legal professionals shown on the public site.</p>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)} className="bg-blue-900 hover:bg-blue-800 dark:bg-gold-600 dark:hover:bg-gold-500 dark:text-navy-900 font-bold">
            + Add Professional
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-8 border-t-4 border-t-gold-500 dark:border-t-gold-600 dark:bg-navy-900 dark:border-navy-800 animate-fade-in">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-navy-800 pb-4">
            <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-white">
              {editingAttorney ? `Edit Profile: ${editingAttorney.name}` : 'New Professional Profile'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
              <X size="lg" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Photo Section */}
              <div className="lg:col-span-1 space-y-4">
                <label className="block text-sm font-bold text-navy-900 dark:text-gray-300 uppercase tracking-wider">
                  Profile Photo
                </label>
                <div className="relative group">
                  {formData.photoUrl ? (
                    <img 
                      src={formData.photoUrl} 
                      alt="Preview" 
                      className="w-full aspect-square object-cover rounded-lg shadow-md border-4 border-white dark:border-navy-700"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 dark:bg-navy-800 rounded-lg flex flex-col items-center justify-center border-4 border-dashed border-gray-200 dark:border-navy-700">
                      <User className="w-16 h-16 text-gray-300 dark:text-navy-600" />
                      <span className="text-xs text-gray-400 mt-2">No Photo</span>
                    </div>
                  )}
                  
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-navy-900/50 rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center dark:text-white dark:border-navy-600"
                    >
                        <Upload size="sm" className="mr-2" />
                        {formData.photoUrl ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    {formData.photoUrl && (
                        <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                            className="text-xs text-red-500 hover:text-red-700 underline"
                        >
                            Remove Photo
                        </button>
                    )}
                </div>
              </div>

              {/* Main Info Section */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    label="Full Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Denise S. Cann"
                    error={formErrors.name}
                    className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
                  />
                  <Input
                    label="Title / Position"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Managing Attorney"
                    className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
                  />
                  <Input
                    label="Public Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="public@cannlaw.com"
                    className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
                  />
                  <Input
                    label="Public Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(410) 988-0123"
                    className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
                  />
                </div>
                <div className="space-y-4">
                  <Input
                    label="Office Location"
                    name="officeLocation"
                    value={formData.officeLocation}
                    onChange={handleInputChange}
                    placeholder="e.g. Baltimore Office"
                    className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
                  />
                  <Input
                    label="Default Hourly Rate ($)"
                    name="defaultHourlyRate"
                    type="number"
                    value={formData.defaultHourlyRate}
                    onChange={handleInputChange}
                    className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
                  />
                  <Input
                    label="Display Order (priority)"
                    name="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                    className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
                  />
                  <div className="flex space-x-6 pt-8">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 dark:border-navy-700 text-blue-600 focus:ring-blue-500 h-5 w-5"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-navy-900 dark:group-hover:text-white transition-colors">Active Profile</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="isManagingAttorney"
                        checked={formData.isManagingAttorney}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 dark:border-navy-700 text-gold-600 focus:ring-gold-500 h-5 w-5"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-navy-900 dark:group-hover:text-white transition-colors">Managing Attorney</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-navy-900 dark:text-gray-300 uppercase tracking-wider">Biography</label>
              <textarea
                name="bio"
                rows={6}
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full p-4 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg focus:ring-2 focus:ring-gold-500 dark:text-white transition-all"
                placeholder="Enter full professional biography..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-navy-900 dark:text-gray-300 uppercase tracking-wider">Practice Areas (JSON Array)</label>
                <textarea
                  name="practiceAreas"
                  rows={4}
                  value={formData.practiceAreas}
                  onChange={handleInputChange}
                  className="w-full p-3 font-mono text-xs bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded dark:text-gold-500"
                />
                {formErrors.practiceAreas && <p className="text-xs text-red-500">{formErrors.practiceAreas}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-navy-900 dark:text-gray-300 uppercase tracking-wider">Languages (JSON Array)</label>
                <textarea
                  name="languages"
                  rows={4}
                  value={formData.languages}
                  onChange={handleInputChange}
                  className="w-full p-3 font-mono text-xs bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded dark:text-gold-500"
                />
                {formErrors.languages && <p className="text-xs text-red-500">{formErrors.languages}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-navy-900 dark:text-gray-300 uppercase tracking-wider">Credentials (JSON Array)</label>
                <textarea
                  name="credentials"
                  rows={4}
                  value={formData.credentials}
                  onChange={handleInputChange}
                  className="w-full p-3 font-mono text-xs bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded dark:text-gold-500"
                />
                {formErrors.credentials && <p className="text-xs text-red-500">{formErrors.credentials}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-4 border-t border-gray-100 dark:border-navy-800 pt-6">
              <Button variant="outline" onClick={resetForm} disabled={isSubmitting} className="dark:text-white dark:border-navy-700">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting} className="px-12 bg-blue-900 hover:bg-blue-800 dark:bg-gold-600 dark:hover:bg-gold-500 dark:text-navy-900 font-bold border-none">
                {editingAttorney ? 'Update Profile' : 'Create Profile'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Attorney List */}
      <div className="grid grid-cols-1 gap-6">
        {attorneys.map((attorney) => (
          <Card key={attorney.id} className="overflow-hidden hover:shadow-md transition-shadow dark:bg-navy-900 dark:border-navy-800">
            <div className="flex flex-col md:flex-row p-6">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6 flex flex-col items-center">
                {attorney.photoUrl ? (
                  <img 
                    src={attorney.photoUrl} 
                    alt={attorney.name} 
                    className="w-24 h-24 rounded-full object-cover border-2 border-gold-500 shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center border-2 border-gray-200 dark:border-navy-700">
                    <User className="w-10 h-10 text-navy-300" />
                  </div>
                )}
                <span className="mt-2 text-[10px] font-bold uppercase tracking-tighter text-gray-400 dark:text-gray-500">Order: {attorney.displayOrder}</span>
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-serif font-bold text-navy-900 dark:text-white">{attorney.name}</h3>
                        {attorney.isManagingAttorney && (
                            <span className="bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-sm tracking-tighter">Managing</span>
                        )}
                        {!attorney.isActive && (
                            <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-sm tracking-tighter">Inactive</span>
                        )}
                    </div>
                    <p className="text-gold-600 dark:text-gold-400 font-medium text-sm mt-0.5">{attorney.title}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(attorney)} className="dark:text-white dark:border-navy-700 dark:hover:bg-navy-800">
                      <Edit size="sm" className="mr-1" /> Edit
                    </Button>
                    {attorney.isActive && (
                        <button
                            onClick={() => { setAttorneyToDeactivate(attorney); setShowDeactivateModal(true); }}
                            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium px-2"
                        >
                            Deactivate
                        </button>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 italic">
                  {attorney.bio || 'No biography provided.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center mr-6">
                    <Mail size="xs" className="mr-2 text-gold-500" /> {attorney.email || 'No public email'}
                  </div>
                  <div className="flex items-center mr-6">
                    <Phone size="xs" className="mr-2 text-gold-500" /> {attorney.phone || 'No public phone'}
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-navy-900 dark:text-gray-300 mr-1">Rate:</span> ${attorney.defaultHourlyRate}/hr
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Deactivation Modal */}
      <Modal
        open={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Confirm Deactivation"
      >
        <div className="p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Are you sure you want to deactivate <strong>{attorneyToDeactivate?.name}</strong>? 
            They will no longer be visible on the public website.
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => setShowDeactivateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700 border-none">Deactivate</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AttorneyManagementPage
