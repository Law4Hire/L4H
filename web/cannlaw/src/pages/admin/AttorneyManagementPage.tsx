import React, { useState, useRef } from 'react'
import { Card, Button, Input, Modal } from '@l4h/shared-ui'
import { X, User, Mail, Phone, Edit, AlertTriangle, CheckCircle } from '@l4h/shared-ui'
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

const AttorneyManagementPage: React.FC = () => {
  const { attorneys, isLoading, createAttorney, updateAttorney, refetch: fetchAttorneys } = useAttorneys()
  const [showForm, setShowForm] = useState(false)
  const [editingAttorney, setEditingAttorney] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [attorneyToDeactivate, setAttorneyToDeactivate] = useState<any>(null)
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
    credentials: '',
    practiceAreas: '',
    languages: '',
    isActive: true,
    isManagingAttorney: false,
    displayOrder: 1
  })

  // Validation functions
  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (formData.directEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.directEmail)) {
      errors.directEmail = 'Please enter a valid email address'
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Please enter a valid phone number'
    }

    if (formData.directPhone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.directPhone.replace(/[\s\-\(\)]/g, ''))) {
      errors.directPhone = 'Please enter a valid phone number'
    }

    if (formData.defaultHourlyRate <= 0) {
      errors.defaultHourlyRate = 'Hourly rate must be greater than 0'
    }

    // Validate JSON fields
    if (formData.credentials) {
      try {
        JSON.parse(formData.credentials)
      } catch {
        errors.credentials = 'Please enter valid JSON format'
      }
    }

    if (formData.practiceAreas) {
      try {
        JSON.parse(formData.practiceAreas)
      } catch {
        errors.practiceAreas = 'Please enter valid JSON format'
      }
    }

    if (formData.languages) {
      try {
        JSON.parse(formData.languages)
      } catch {
        errors.languages = 'Please enter valid JSON format'
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
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Photo upload functions
  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/attorneys/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload photo')
      }

      const result = await response.json()
      setFormData(prev => ({ ...prev, photoUrl: result.photoUrl }))
    } catch (error) {
      console.error('Photo upload error:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoUpload(e.dataTransfer.files[0])
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
    setSubmitStatus('idle')
    setFormErrors({})
  }

  const handleDeactivateAttorney = async () => {
    if (!attorneyToDeactivate) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${attorneyToDeactivate.id}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate attorney')
      }

      await fetchAttorneys() // Refresh data
      setShowDeactivateModal(false)
      setAttorneyToDeactivate(null)
      setSubmitStatus('success')
    } catch (error) {
      console.error('Error deactivating attorney:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (attorney: any) => {
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const attorneyData = {
        ...formData,
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
        setSubmitStatus('success')
        resetForm()
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attorney Management</h1>
          <p className="text-gray-600">Manage attorney profiles and information</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowForm(true)}
        >
          Add New Attorney
        </Button>
      </div>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            Attorney {editingAttorney ? 'updated' : 'created'} successfully!
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            Failed to {editingAttorney ? 'update' : 'create'} attorney. Please try again.
          </p>
        </div>
      )}

      {/* Attorney Form */}
      {showForm && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingAttorney ? 'Edit Attorney' : 'Add New Attorney'}
            </h2>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attorney Photo
              </label>
              <div className="flex items-start space-x-4">
                {/* Photo Preview */}
                <div className="flex-shrink-0">
                  {formData.photoUrl ? (
                    <div className="relative">
                      <img 
                        src={formData.photoUrl} 
                        alt="Attorney photo"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size="sm" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Upload Area */}
                <div className="flex-1">
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="mx-auto h-8 w-8 text-gray-400 mb-2">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop a photo here, or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-500 font-medium"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, WebP up to 5MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  {uploadingPhoto && (
                    <div className="mt-2 text-sm text-blue-600">
                      Uploading photo...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Denise S. Cann"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Managing Attorney"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Public Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="dcann@cannlaw.com"
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Public Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(410) 783-1888"
                  className={formErrors.phone ? 'border-red-500' : ''}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="directEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Direct Email (Internal)
                </label>
                <Input
                  id="directEmail"
                  name="directEmail"
                  type="email"
                  value={formData.directEmail}
                  onChange={handleInputChange}
                  placeholder="denise.direct@cannlaw.com"
                  className={formErrors.directEmail ? 'border-red-500' : ''}
                />
                {formErrors.directEmail && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.directEmail}</p>
                )}
              </div>

              <div>
                <label htmlFor="directPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Direct Phone (Internal)
                </label>
                <Input
                  id="directPhone"
                  name="directPhone"
                  type="tel"
                  value={formData.directPhone}
                  onChange={handleInputChange}
                  placeholder="(410) 783-1889"
                  className={formErrors.directPhone ? 'border-red-500' : ''}
                />
                {formErrors.directPhone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.directPhone}</p>
                )}
              </div>

              <div>
                <label htmlFor="officeLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  Office Location
                </label>
                <Input
                  id="officeLocation"
                  name="officeLocation"
                  type="text"
                  value={formData.officeLocation}
                  onChange={handleInputChange}
                  placeholder="Baltimore Office"
                />
              </div>

              <div>
                <label htmlFor="defaultHourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Hourly Rate ($)
                </label>
                <Input
                  id="defaultHourlyRate"
                  name="defaultHourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.defaultHourlyRate}
                  onChange={handleInputChange}
                  placeholder="250.00"
                  className={formErrors.defaultHourlyRate ? 'border-red-500' : ''}
                />
                {formErrors.defaultHourlyRate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.defaultHourlyRate}</p>
                )}
              </div>
            </div>

            {/* Biography */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Biography
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Attorney biography and experience..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* JSON Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="credentials" className="block text-sm font-medium text-gray-700 mb-1">
                  Credentials (JSON)
                </label>
                <textarea
                  id="credentials"
                  name="credentials"
                  rows={4}
                  value={formData.credentials}
                  onChange={handleInputChange}
                  placeholder={`[
  "Licensed in Maryland",
  "Member of AILA"
]`}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                    formErrors.credentials ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.credentials && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.credentials}</p>
                )}
              </div>

              <div>
                <label htmlFor="practiceAreas" className="block text-sm font-medium text-gray-700 mb-1">
                  Practice Areas (JSON)
                </label>
                <textarea
                  id="practiceAreas"
                  name="practiceAreas"
                  rows={4}
                  value={formData.practiceAreas}
                  onChange={handleInputChange}
                  placeholder={`[
  "Family Immigration",
  "Employment Visas"
]`}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                    formErrors.practiceAreas ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.practiceAreas && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.practiceAreas}</p>
                )}
              </div>

              <div>
                <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-1">
                  Languages (JSON)
                </label>
                <textarea
                  id="languages"
                  name="languages"
                  rows={4}
                  value={formData.languages}
                  onChange={handleInputChange}
                  placeholder={`[
  "English",
  "Mandarin Chinese"
]`}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                    formErrors.languages ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.languages && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.languages}</p>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <Input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  min="1"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center space-x-4 pt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isManagingAttorney"
                    checked={formData.isManagingAttorney}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Managing Attorney</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingAttorney ? 'Update Attorney' : 'Create Attorney'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Attorney List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Attorneys ({attorneys.length})
          </h2>
        </div>

        {attorneys.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attorneys</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first attorney.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {attorneys.map((attorney) => (
              <Card key={attorney.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      {attorney.photoUrl ? (
                        <img 
                          src={attorney.photoUrl} 
                          alt={attorney.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{attorney.name}</h3>
                          {attorney.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {attorney.isManagingAttorney && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Managing Attorney
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            attorney.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {attorney.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {attorney.title && (
                          <p className="text-sm text-gray-600 mb-2">{attorney.title}</p>
                        )}
                        
                        {attorney.officeLocation && (
                          <p className="text-sm text-gray-500 mb-2">📍 {attorney.officeLocation}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {attorney.bio && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">{attorney.bio}</p>
                  )}

                  {/* Contact Information */}
                  <div className="space-y-2 mb-4">
                    {attorney.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{attorney.email}</span>
                      </div>
                    )}
                    {attorney.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{attorney.phone}</span>
                      </div>
                    )}
                    {attorney.defaultHourlyRate && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">Rate: ${attorney.defaultHourlyRate}/hour</span>
                      </div>
                    )}
                  </div>

                  {/* Practice Areas */}
                  {attorney.practiceAreas && attorney.practiceAreas !== '[]' && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">PRACTICE AREAS</p>
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(attorney.practiceAreas).slice(0, 3).map((area: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                            {area}
                          </span>
                        ))}
                        {JSON.parse(attorney.practiceAreas).length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                            +{JSON.parse(attorney.practiceAreas).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(attorney)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      {attorney.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAttorneyToDeactivate(attorney)
                            setShowDeactivateModal(true)
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Deactivate
                        </Button>
                      )}
                    </div>
                    
                    <span className="text-xs text-gray-500">
                      Order: {attorney.displayOrder}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Deactivation Confirmation Modal */}
      <Modal
        open={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Deactivate Attorney"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
            <div>
              <p className="text-sm text-gray-900">
                Are you sure you want to deactivate <strong>{attorneyToDeactivate?.name}</strong>?
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This will:
              </p>
              <ul className="text-sm text-gray-600 mt-1 ml-4 list-disc">
                <li>Remove them from public attorney listings</li>
                <li>Prevent new client assignments</li>
                <li>Require reassignment of existing clients</li>
                <li>Preserve all historical data and time entries</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeactivateModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeactivateAttorney}
              loading={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Deactivating...' : 'Deactivate Attorney'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AttorneyManagementPage