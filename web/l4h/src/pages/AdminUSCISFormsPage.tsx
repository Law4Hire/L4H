import React, { useState, useEffect } from 'react'
import { Card, Button, Modal, Input, useToast } from '@l4h/shared-ui'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface FormPricing {
  id: string
  selfFilePriceUSD: number | null
  paralegalPriceUSD: number | null
  lawyerPriceUSD: number | null
  llcFeeUSD: number
  llcFeePercentage: number | null
  description: string | null
  effectiveDate: string
}

interface USCISForm {
  id: string
  formNumber: string
  formName: string
  description: string | null
  formUrl: string | null
  estimatedTimeMinutes: number | null
  isActive: boolean
  pricing: FormPricing | null
  visaTypeMappingCount: number
  createdAt: string
  updatedAt: string
}

interface VisaType {
  id: number
  code: string
  name: string
}

interface VisaTypeMapping {
  id: string
  formId: string
  visaTypeId: number
  visaTypeCode: string
  visaTypeName: string
  isRequired: boolean
  displayOrder: number
  notes: string | null
}

interface FormDependency {
  id: string
  parentFormId: string
  dependentFormId: string
  dependentFormNumber: string
  dependentFormName: string
  visaTypeId: number
  visaTypeCode: string
  visaTypeName: string
  isRequired: boolean
  dependencyReason: string | null
  displayOrder: number
}

interface FormFormData {
  formNumber: string
  formName: string
  description: string
  formUrl: string
  estimatedTimeMinutes: number
  isActive: boolean
}

interface PricingFormData {
  selfFilePriceUSD: string
  paralegalPriceUSD: string
  lawyerPriceUSD: string
  llcFeeUSD: string
  llcFeePercentage: string
  description: string
}

// ============================================================================
// Main Component
// ============================================================================

const AdminUSCISFormsPage: React.FC = () => {
  const { success, error } = useToast()

  // State - Forms List
  const [forms, setForms] = useState<USCISForm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // State - Form CRUD
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingForm, setEditingForm] = useState<USCISForm | null>(null)
  const [formData, setFormData] = useState<FormFormData>({
    formNumber: '',
    formName: '',
    description: '',
    formUrl: '',
    estimatedTimeMinutes: 0,
    isActive: true
  })

  // State - Pricing Management
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [pricingForm, setPricingForm] = useState<USCISForm | null>(null)
  const [pricingData, setPricingData] = useState<PricingFormData>({
    selfFilePriceUSD: '',
    paralegalPriceUSD: '',
    lawyerPriceUSD: '',
    llcFeeUSD: '',
    llcFeePercentage: '',
    description: ''
  })
  const [pricingHistory, setPricingHistory] = useState<FormPricing[]>([])

  // State - Visa Type Mappings
  const [showMappingsModal, setShowMappingsModal] = useState(false)
  const [mappingsForm, setMappingsForm] = useState<USCISForm | null>(null)
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([])
  const [mappings, setMappings] = useState<VisaTypeMapping[]>([])
  const [selectedVisaType, setSelectedVisaType] = useState<number | null>(null)
  const [mappingNotes, setMappingNotes] = useState('')
  const [mappingRequired, setMappingRequired] = useState(true)

  // State - Form Dependencies
  const [showDependenciesModal, setShowDependenciesModal] = useState(false)
  const [dependenciesForm, setDependenciesForm] = useState<USCISForm | null>(null)
  const [dependencies, setDependencies] = useState<FormDependency[]>([])
  const [selectedDependentForm, setSelectedDependentForm] = useState<string | null>(null)
  const [selectedDependencyVisaType, setSelectedDependencyVisaType] = useState<number | null>(null)
  const [dependencyReason, setDependencyReason] = useState('')
  const [dependencyRequired, setDependencyRequired] = useState(false)

  // State - Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formToDelete, setFormToDelete] = useState<USCISForm | null>(null)

  // State - File Upload
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadForm, setUploadForm] = useState<USCISForm | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('jwt_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const getUploadHeaders = () => {
    const token = localStorage.getItem('jwt_token')
    return {
      'Authorization': `Bearer ${token}`
    }
  }

  const loadForms = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/admin/uscis-forms', {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to load forms: ${response.status}`)
      }

      const data = await response.json()
      setForms(data)
    } catch (err) {
      console.error('Error loading forms:', err)
      error('Failed to load USCIS forms')
    } finally {
      setLoading(false)
    }
  }, [error])

  const loadVisaTypes = React.useCallback(async () => {
    try {
      const response = await fetch('/api/v1/visa-types', {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to load visa types: ${response.status}`)
      }

      const data = await response.json()
      setVisaTypes(data)
    } catch (err) {
      console.error('Error loading visa types:', err)
      error('Failed to load visa types')
    }
  }, [error])

  // ============================================================================
  // Load Data
  // ============================================================================

  useEffect(() => {
    loadForms()
    loadVisaTypes()
  }, [loadForms, loadVisaTypes])

  // ============================================================================
  // Form CRUD Operations
  // ============================================================================

  const handleCreateForm = () => {
    setEditingForm(null)
    setFormData({
      formNumber: '',
      formName: '',
      description: '',
      formUrl: '',
      estimatedTimeMinutes: 0,
      isActive: true
    })
    setShowFormModal(true)
  }

  const handleEditForm = (form: USCISForm) => {
    setEditingForm(form)
    setFormData({
      formNumber: form.formNumber,
      formName: form.formName,
      description: form.description || '',
      formUrl: form.formUrl || '',
      estimatedTimeMinutes: form.estimatedTimeMinutes || 0,
      isActive: form.isActive
    })
    setShowFormModal(true)
  }

  const handleSaveForm = async () => {
    try {
      if (!formData.formNumber || !formData.formName) {
        error('Form number and name are required')
        return
      }

      const method = editingForm ? 'PUT' : 'POST'
      const url = editingForm
        ? `/api/v1/admin/uscis-forms/${editingForm.id}`
        : '/api/v1/admin/uscis-forms'

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`Failed to save form: ${response.status}`)
      }

      success(editingForm ? 'Form updated successfully' : 'Form created successfully')
      setShowFormModal(false)
      await loadForms()
    } catch (err) {
      console.error('Error saving form:', err)
      error('Failed to save form')
    }
  }

  const handleDeleteForm = async () => {
    if (!formToDelete) return

    try {
      const response = await fetch(`/api/v1/admin/uscis-forms/${formToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to delete form: ${response.status}`)
      }

      success('Form deleted successfully')
      setShowDeleteConfirm(false)
      setFormToDelete(null)
      await loadForms()
    } catch (err) {
      console.error('Error deleting form:', err)
      error('Failed to delete form')
    }
  }

  // ============================================================================
  // File Upload
  // ============================================================================

  const handleUploadClick = (form: USCISForm) => {
    setUploadForm(form)
    setUploadFile(null)
    setShowUploadModal(true)
  }

  const handleUploadFile = async () => {
    if (!uploadForm || !uploadFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      const response = await fetch(`/api/v1/admin/uscis-forms/${uploadForm.id}/file`, {
        method: 'POST',
        headers: getUploadHeaders(),
        body: formData
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `Failed to upload file: ${response.status}`)
      }

      success('File uploaded successfully')
      setShowUploadModal(false)
      setUploadForm(null)
      setUploadFile(null)
      await loadForms()
    } catch (err: any) {
      console.error('Error uploading file:', err)
      error(err.message || 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  // ============================================================================
  // Pricing Management
  // ============================================================================

  const handleManagePricing = async (form: USCISForm) => {
    setPricingForm(form)

    if (form.pricing) {
      setPricingData({
        selfFilePriceUSD: form.pricing.selfFilePriceUSD?.toString() || '',
        paralegalPriceUSD: form.pricing.paralegalPriceUSD?.toString() || '',
        lawyerPriceUSD: form.pricing.lawyerPriceUSD?.toString() || '',
        llcFeeUSD: form.pricing.llcFeeUSD.toString(),
        llcFeePercentage: form.pricing.llcFeePercentage?.toString() || '',
        description: form.pricing.description || ''
      })
    } else {
      setPricingData({
        selfFilePriceUSD: '',
        paralegalPriceUSD: '',
        lawyerPriceUSD: '',
        llcFeeUSD: '0',
        llcFeePercentage: '',
        description: ''
      })
    }

    // Load pricing history
    try {
      const response = await fetch(`/api/v1/admin/uscis-forms/${form.id}/pricing/history`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const history = await response.json()
        setPricingHistory(history)
      }
    } catch (err) {
      console.error('Error loading pricing history:', err)
    }

    setShowPricingModal(true)
  }

  const handleSavePricing = async () => {
    if (!pricingForm) return

    try {
      const requestData = {
        selfFilePriceUSD: pricingData.selfFilePriceUSD ? parseFloat(pricingData.selfFilePriceUSD) : null,
        paralegalPriceUSD: pricingData.paralegalPriceUSD ? parseFloat(pricingData.paralegalPriceUSD) : null,
        lawyerPriceUSD: pricingData.lawyerPriceUSD ? parseFloat(pricingData.lawyerPriceUSD) : null,
        llcFeeUSD: parseFloat(pricingData.llcFeeUSD) || 0,
        llcFeePercentage: pricingData.llcFeePercentage ? parseFloat(pricingData.llcFeePercentage) : null,
        description: pricingData.description || null
      }

      const response = await fetch(`/api/v1/admin/uscis-forms/${pricingForm.id}/pricing`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`Failed to update pricing: ${response.status}`)
      }

      success('Pricing updated successfully')
      setShowPricingModal(false)
      await loadForms()
    } catch (err) {
      console.error('Error saving pricing:', err)
      error('Failed to update pricing')
    }
  }

  // ============================================================================
  // Visa Type Mappings
  // ============================================================================

  const handleManageMappings = async (form: USCISForm) => {
    setMappingsForm(form)
    setSelectedVisaType(null)
    setMappingNotes('')
    setMappingRequired(true)

    // Load existing mappings
    try {
      const response = await fetch(`/api/v1/admin/uscis-forms/${form.id}/visa-mappings`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setMappings(data)
      }
    } catch (err) {
      console.error('Error loading mappings:', err)
      error('Failed to load visa type mappings')
    }

    setShowMappingsModal(true)
  }

  const handleAddMapping = async () => {
    if (!mappingsForm || !selectedVisaType) {
      error('Please select a visa type')
      return
    }

    try {
      const requestData = {
        visaTypeId: selectedVisaType,
        isRequired: mappingRequired,
        displayOrder: mappings.length + 1,
        notes: mappingNotes || null
      }

      const response = await fetch(`/api/v1/admin/uscis-forms/${mappingsForm.id}/visa-mappings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to add mapping: ${response.status}`)
      }

      success('Visa type mapping added successfully')
      setSelectedVisaType(null)
      setMappingNotes('')

      // Reload mappings
      const reloadResponse = await fetch(`/api/v1/admin/uscis-forms/${mappingsForm.id}/visa-mappings`, {
        headers: getAuthHeaders()
      })
      if (reloadResponse.ok) {
        const data = await reloadResponse.json()
        setMappings(data)
      }
    } catch (err: any) {
      console.error('Error adding mapping:', err)
      error(err.message || 'Failed to add visa type mapping')
    }
  }

  const handleDeleteMapping = async (mappingId: string) => {
    if (!mappingsForm) return

    try {
      const response = await fetch(`/api/v1/admin/uscis-forms/${mappingsForm.id}/visa-mappings/${mappingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to delete mapping: ${response.status}`)
      }

      success('Visa type mapping deleted successfully')

      // Reload mappings
      const reloadResponse = await fetch(`/api/v1/admin/uscis-forms/${mappingsForm.id}/visa-mappings`, {
        headers: getAuthHeaders()
      })
      if (reloadResponse.ok) {
        const data = await reloadResponse.json()
        setMappings(data)
      }
    } catch (err) {
      console.error('Error deleting mapping:', err)
      error('Failed to delete visa type mapping')
    }
  }

  // ============================================================================
  // Form Dependencies
  // ============================================================================

  const handleManageDependencies = async (form: USCISForm) => {
    setDependenciesForm(form)
    setSelectedDependentForm(null)
    setSelectedDependencyVisaType(null)
    setDependencyReason('')
    setDependencyRequired(false)

    // Load existing dependencies
    try {
      const response = await fetch(`/api/v1/admin/uscis-forms/${form.id}/dependencies`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setDependencies(data)
      }
    } catch (err) {
      console.error('Error loading dependencies:', err)
      error('Failed to load form dependencies')
    }

    setShowDependenciesModal(true)
  }

  const handleAddDependency = async () => {
    if (!dependenciesForm || !selectedDependentForm || !selectedDependencyVisaType) {
      error('Please select a dependent form and visa type')
      return
    }

    try {
      const requestData = {
        dependentFormId: selectedDependentForm,
        visaTypeId: selectedDependencyVisaType,
        isRequired: dependencyRequired,
        dependencyReason: dependencyReason || null,
        displayOrder: dependencies.length + 1
      }

      const response = await fetch(`/api/v1/admin/uscis-forms/${dependenciesForm.id}/dependencies`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to add dependency: ${response.status}`)
      }

      success('Form dependency added successfully')
      setSelectedDependentForm(null)
      setSelectedDependencyVisaType(null)
      setDependencyReason('')

      // Reload dependencies
      const reloadResponse = await fetch(`/api/v1/admin/uscis-forms/${dependenciesForm.id}/dependencies`, {
        headers: getAuthHeaders()
      })
      if (reloadResponse.ok) {
        const data = await reloadResponse.json()
        setDependencies(data)
      }
    } catch (err: any) {
      console.error('Error adding dependency:', err)
      error(err.message || 'Failed to add form dependency')
    }
  }

  const handleDeleteDependency = async (dependencyId: string) => {
    if (!dependenciesForm) return

    try {
      const response = await fetch(`/api/v1/admin/uscis-forms/${dependenciesForm.id}/dependencies/${dependencyId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to delete dependency: ${response.status}`)
      }

      success('Form dependency deleted successfully')

      // Reload dependencies
      const reloadResponse = await fetch(`/api/v1/admin/uscis-forms/${dependenciesForm.id}/dependencies`, {
        headers: getAuthHeaders()
      })
      if (reloadResponse.ok) {
        const data = await reloadResponse.json()
        setDependencies(data)
      }
    } catch (err) {
      console.error('Error deleting dependency:', err)
      error('Failed to delete form dependency')
    }
  }

  // ============================================================================
  // Filtering
  // ============================================================================

  const filteredForms = forms.filter(form => {
    const matchesSearch =
      form.formNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.formName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.description || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && form.isActive) ||
      (statusFilter === 'inactive' && !form.isActive)

    return matchesSearch && matchesStatus
  })

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading USCIS forms...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            USCIS Forms Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage USCIS immigration forms, pricing tiers, visa type mappings, and form dependencies.
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <Button onClick={handleCreateForm}>
            + Add Form
          </Button>
        </div>
      </Card>

      {/* Forms Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Form
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time (min)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mappings
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredForms.map(form => (
                <tr key={form.id} className={!form.isActive ? 'bg-gray-50 dark:bg-gray-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {form.formNumber}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {form.formName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                      {form.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                    {form.estimatedTimeMinutes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {form.pricing ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <div>Price: ${form.pricing.selfFilePriceUSD || 'N/A'}</div>
                        <div>LLC Fee: ${form.pricing.llcFeeUSD || 'N/A'}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">No pricing</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                    {form.visaTypeMappingCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/v1/admin/uscis-forms/${form.id}`, {
                            method: 'PUT',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({ ...form, isActive: !form.isActive })
                          })
                          if (response.ok) {
                            success(`Form ${form.isActive ? 'deactivated' : 'activated'} successfully`)
                            loadForms()
                          } else {
                            throw new Error('Failed to update status')
                          }
                        } catch (err) {
                          error('Failed to update form status')
                        }
                      }}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                        form.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {form.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditForm(form)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleUploadClick(form)}
                      className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => handleManagePricing(form)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Pricing
                    </button>
                    <button
                      onClick={() => handleManageMappings(form)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Mappings
                    </button>
                    <button
                      onClick={() => handleManageDependencies(form)}
                      className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Dependencies
                    </button>
                    <button
                      onClick={() => {
                        setFormToDelete(form)
                        setShowDeleteConfirm(true)
                      }}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredForms.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No forms found. {searchTerm && "Try adjusting your search."}
            </div>
          )}
        </div>
      </Card>

      {/* Form Create/Edit Modal */}
      {showFormModal && (
        <Modal
          open={showFormModal}
          onClose={() => setShowFormModal(false)}
          title={editingForm ? 'Edit USCIS Form' : 'Create USCIS Form'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Form Number *
              </label>
              <Input
                value={formData.formNumber}
                onChange={(e) => setFormData({ ...formData, formNumber: e.target.value })}
                placeholder="e.g., I-129"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Form Name *
              </label>
              <Input
                value={formData.formName}
                onChange={(e) => setFormData({ ...formData, formName: e.target.value })}
                placeholder="e.g., Petition for a Nonimmigrant Worker"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Brief description of the form and its purpose"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Form URL
              </label>
              <Input
                value={formData.formUrl}
                onChange={(e) => setFormData({ ...formData, formUrl: e.target.value })}
                placeholder="https://www.uscis.gov/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estimated Time (minutes)
              </label>
              <Input
                type="number"
                value={formData.estimatedTimeMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedTimeMinutes: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 180"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setShowFormModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveForm}>
                {editingForm ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Pricing Modal */}
      {showPricingModal && pricingForm && (
        <Modal
          open={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          title={`Pricing: ${pricingForm.formNumber}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Configure 3-tier pricing model: Self-File, Paralegal-assisted, and Lawyer-assisted.
                LLC fee represents the platform commission.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Self-File Price (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricingData.selfFilePriceUSD}
                  onChange={(e) => setPricingData({ ...pricingData, selfFilePriceUSD: e.target.value })}
                  placeholder="Leave empty if not available"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Paralegal Price (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricingData.paralegalPriceUSD}
                  onChange={(e) => setPricingData({ ...pricingData, paralegalPriceUSD: e.target.value })}
                  placeholder="Leave empty if not available"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lawyer Price (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricingData.lawyerPriceUSD}
                  onChange={(e) => setPricingData({ ...pricingData, lawyerPriceUSD: e.target.value })}
                  placeholder="Leave empty if not available"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  LLC Fee (USD) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricingData.llcFeeUSD}
                  onChange={(e) => setPricingData({ ...pricingData, llcFeeUSD: e.target.value })}
                  placeholder="Platform commission"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  LLC Fee Percentage (optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricingData.llcFeePercentage}
                  onChange={(e) => setPricingData({ ...pricingData, llcFeePercentage: e.target.value })}
                  placeholder="Alternative to fixed fee"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Input
                  value={pricingData.description}
                  onChange={(e) => setPricingData({ ...pricingData, description: e.target.value })}
                  placeholder="e.g., Updated pricing for 2025"
                />
              </div>
            </div>

            {pricingHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pricing History</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 max-h-40 overflow-y-auto">
                  {pricingHistory.map((pricing, idx) => (
                    <div key={pricing.id} className="text-xs text-gray-600 dark:text-gray-300 py-1 border-b border-gray-200 dark:border-gray-600 last:border-0">
                      <div className="font-medium">
                        Effective: {new Date(pricing.effectiveDate).toLocaleDateString()}
                      </div>
                      <div>
                        Self: ${pricing.selfFilePriceUSD || 'N/A'} |
                        Paralegal: ${pricing.paralegalPriceUSD || 'N/A'} |
                        Lawyer: ${pricing.lawyerPriceUSD || 'N/A'} |
                        LLC: ${pricing.llcFeeUSD}
                      </div>
                      {pricing.description && (
                        <div className="italic">{pricing.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setShowPricingModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePricing}>
                Update Pricing
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Visa Mappings Modal */}
      {showMappingsModal && mappingsForm && (
        <Modal
          open={showMappingsModal}
          onClose={() => setShowMappingsModal(false)}
          title={`Visa Type Mappings: ${mappingsForm.formNumber}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Assign this form to specific visa types. This determines which forms are recommended or required for each visa category.
              </p>
            </div>

            {/* Add Mapping */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add Visa Type Mapping</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Visa Type *
                  </label>
                  <select
                    value={selectedVisaType || ''}
                    onChange={(e) => setSelectedVisaType(parseInt(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a visa type...</option>
                    {visaTypes
                      .filter(vt => !mappings.some(m => m.visaTypeId === vt.id))
                      .map(vt => (
                        <option key={vt.id} value={vt.id}>
                          {vt.code} - {vt.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <Input
                    value={mappingNotes}
                    onChange={(e) => setMappingNotes(e.target.value)}
                    placeholder="Additional context for this mapping"
                  />
                </div>
                <div className="col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={mappingRequired}
                    onChange={(e) => setMappingRequired(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Required (vs. recommended)
                  </label>
                </div>
                <div className="col-span-2">
                  <Button onClick={handleAddMapping} size="sm">
                    Add Mapping
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Mappings */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing Mappings</h3>
              {mappings.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  No visa type mappings yet. Add one above.
                </div>
              ) : (
                <div className="space-y-2">
                  {mappings.map(mapping => (
                    <div key={mapping.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {mapping.visaTypeCode} - {mapping.visaTypeName}
                        </div>
                        {mapping.notes && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{mapping.notes}</div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {mapping.isRequired ? (
                            <span className="text-red-600 dark:text-red-400 font-medium">Required</span>
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400">Recommended</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={() => setShowMappingsModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dependencies Modal */}
      {showDependenciesModal && dependenciesForm && (
        <Modal
          open={showDependenciesModal}
          onClose={() => setShowDependenciesModal(false)}
          title={`Form Dependencies: ${dependenciesForm.formNumber}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Define which other forms are required or recommended alongside this form for specific visa types.
                Dependencies are visa-specific.
              </p>
            </div>

            {/* Add Dependency */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add Form Dependency</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dependent Form *
                  </label>
                  <select
                    value={selectedDependentForm || ''}
                    onChange={(e) => setSelectedDependentForm(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a form...</option>
                    {forms
                      .filter(f => f.id !== dependenciesForm.id)
                      .map(f => (
                        <option key={f.id} value={f.id}>
                          {f.formNumber} - {f.formName}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    For Visa Type *
                  </label>
                  <select
                    value={selectedDependencyVisaType || ''}
                    onChange={(e) => setSelectedDependencyVisaType(parseInt(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a visa type...</option>
                    {visaTypes.map(vt => (
                      <option key={vt.id} value={vt.id}>
                        {vt.code} - {vt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason for Dependency
                  </label>
                  <textarea
                    value={dependencyReason}
                    onChange={(e) => setDependencyReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder="Explain why this form is required/recommended"
                  />
                </div>
                <div className="col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={dependencyRequired}
                    onChange={(e) => setDependencyRequired(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Required (vs. recommended)
                  </label>
                </div>
                <div className="col-span-2">
                  <Button onClick={handleAddDependency} size="sm">
                    Add Dependency
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Dependencies */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing Dependencies</h3>
              {dependencies.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  No form dependencies yet. Add one above.
                </div>
              ) : (
                <div className="space-y-2">
                  {dependencies.map(dep => (
                    <div key={dep.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {dep.dependentFormNumber} - {dep.dependentFormName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            For visa type: {dep.visaTypeCode} - {dep.visaTypeName}
                          </div>
                          {dep.dependencyReason && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{dep.dependencyReason}</div>
                          )}
                          <div className="text-xs mt-1">
                            {dep.isRequired ? (
                              <span className="text-red-600 dark:text-red-400 font-medium">Required</span>
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400">Recommended</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDependency(dep.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={() => setShowDependenciesModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Modal */}
      {showUploadModal && uploadForm && (
        <Modal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title={`Upload PDF: ${uploadForm.formNumber}`}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Upload the latest PDF version of this USCIS form. Only .pdf files are accepted.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900 dark:file:text-blue-300
                "
              />
            </div>
            {uploadForm.formUrl && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Current file: <a href={uploadForm.formUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Current PDF</a>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setShowUploadModal(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUploadFile} disabled={!uploadFile || isUploading}>
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && formToDelete && (
        <Modal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirm Delete"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to delete form <strong>{formToDelete.formNumber} - {formToDelete.formName}</strong>?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              This will also delete all associated pricing history, visa type mappings, and form dependencies.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteForm}>
                Delete Form
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminUSCISFormsPage