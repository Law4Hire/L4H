import React, { useState, useEffect } from 'react'
import { Card, Button, Input, useToast, Modal } from '@l4h/shared-ui'

interface AdminPricingRuleResponse {
  id: number
  packageId: number
  packageCode: string
  packageDisplayName: string
  basePrice: number
  currency: string
  taxRate: number
  fxSurchargeMode?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AdminPackageResponse {
  id: number
  code: string
  displayName: string
  description: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface VisaTypePricing {
  id: number
  code: string
  name: string
  isActive: boolean
  packages: {
    [packageCode: string]: AdminPricingRuleResponse | null
  }
}

const AdminPricingPage: React.FC = () => {
  const [visaTypes, setVisaTypes] = useState<VisaTypePricing[]>([])
  const [packages, setPackages] = useState<AdminPackageResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showDisabled, setShowDisabled] = useState(false)
  const [selectedVisaType, setSelectedVisaType] = useState<VisaTypePricing | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<{
    packageCode: string
    basePrice: string
    taxRate: string
    isActive: boolean
  } | null>(null)
  const { success, error } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('jwt_token')

      if (!token) {
        error('Authentication required', 'Please log in to access admin features')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Load visa types with pricing
      const visaTypesResponse = await fetch('/api/v1/admin/pricing/visa-types', { headers })
      if (!visaTypesResponse.ok) {
        throw new Error(`Failed to load visa types: ${visaTypesResponse.status}`)
      }
      const visaTypesData = await visaTypesResponse.json()

      // Load packages
      const packagesResponse = await fetch('/api/v1/admin/pricing/packages', { headers })
      if (!packagesResponse.ok) {
        throw new Error(`Failed to load packages: ${packagesResponse.status}`)
      }
      const packagesData = await packagesResponse.json()
      setPackages(packagesData)

      // Transform data: Group by visa type, consolidate pricing across countries
      const transformedVisaTypes: VisaTypePricing[] = visaTypesData.map((visaType: any) => {
        const packageMap: { [packageCode: string]: AdminPricingRuleResponse | null } = {}

        // Initialize all packages as null
        packagesData.forEach((pkg: AdminPackageResponse) => {
          packageMap[pkg.code] = null
        })

        // Use pricing from first country as representative (since prices should be consistent)
        if (visaType.pricingRules && visaType.pricingRules.length > 0) {
          const firstCountryRules = visaType.pricingRules[0].rules
          firstCountryRules.forEach((rule: AdminPricingRuleResponse) => {
            packageMap[rule.packageCode] = rule
          })
        }

        return {
          id: visaType.id,
          code: visaType.code,
          name: visaType.name,
          isActive: visaType.isActive,
          packages: packageMap
        }
      })

      setVisaTypes(transformedVisaTypes)

    } catch (err) {
      console.error('Error loading pricing data:', err)
      error('Failed to load pricing data', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const openVisaTypeModal = (visaType: VisaTypePricing) => {
    setSelectedVisaType(visaType)
    setModalOpen(true)
    setEditingPackage(null)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedVisaType(null)
    setEditingPackage(null)
  }

  const startEditPackage = (packageCode: string, rule: AdminPricingRuleResponse | null) => {
    setEditingPackage({
      packageCode,
      basePrice: rule?.basePrice?.toString() || '0',
      taxRate: rule?.taxRate ? (rule.taxRate * 100).toString() : '0',
      isActive: rule?.isActive || false
    })
  }

  const cancelEditPackage = () => {
    setEditingPackage(null)
  }

  const savePackage = async () => {
    if (!editingPackage || !selectedVisaType) return

    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        error('Authentication required')
        return
      }

      const rule = selectedVisaType.packages[editingPackage.packageCode]

      if (rule) {
        // Update existing rule
        const updateData = {
          pricingRuleUpdates: [{
            id: rule.id,
            basePrice: parseFloat(editingPackage.basePrice),
            taxRate: parseFloat(editingPackage.taxRate) / 100,
            isActive: editingPackage.isActive
          }]
        }

        const response = await fetch(`/api/v1/admin/pricing/visa-types/${selectedVisaType.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })

        if (!response.ok) {
          throw new Error(`Failed to update pricing: ${response.status}`)
        }

        success('Pricing updated successfully')
      } else {
        error('Cannot create new pricing rules yet', 'This functionality will be added soon')
      }

      setEditingPackage(null)
      loadData() // Refresh data
    } catch (err) {
      console.error('Error updating pricing:', err)
      error('Failed to update pricing', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const toggleVisaTypeStatus = async (visaTypeId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        error('Authentication required')
        return
      }

      const response = await fetch(`/api/v1/admin/pricing/visa-types/${visaTypeId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      })

      if (!response.ok) {
        throw new Error(`Failed to update visa type status: ${response.status}`)
      }

      success(`Visa type ${isActive ? 'enabled' : 'disabled'} successfully`)
      loadData() // Refresh data
    } catch (err) {
      console.error('Error updating visa type status:', err)
      error('Failed to update visa type status', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const filteredVisaTypes = visaTypes.filter(vt => showDisabled || vt.isActive)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading pricing data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pricing Management
          </h1>
          <p className="text-gray-600">
            Manage visa types and pricing packages. Click on any visa type card to edit its pricing.
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card title="Display Options">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showDisabled}
            onChange={(e) => setShowDisabled(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
          />
          <span className="text-sm text-gray-700">Show disabled visa types</span>
        </label>
      </Card>

      {/* Visa Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVisaTypes.map(visaType => (
          <div
            key={visaType.id}
            onClick={() => openVisaTypeModal(visaType)}
            className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border ${
              !visaType.isActive ? 'bg-gray-50 border-gray-300' : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${!visaType.isActive ? 'text-gray-500' : 'text-gray-900'}`}>
                  {visaType.code}
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  visaType.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {visaType.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <p className={`text-sm mb-4 ${!visaType.isActive ? 'text-gray-400' : 'text-gray-600'}`}>
                {visaType.name}
              </p>

              <div className="space-y-2">
                {packages.map(pkg => {
                  const rule = visaType.packages[pkg.code]
                  return (
                    <div key={pkg.code} className="flex justify-between items-center">
                      <span className={`text-sm ${!visaType.isActive ? 'text-gray-400' : 'text-gray-700'}`}>
                        {pkg.displayName}:
                      </span>
                      <span className={`text-sm font-medium ${
                        !rule || !rule.isActive
                          ? 'text-gray-400'
                          : !visaType.isActive ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {rule ? `$${rule.basePrice.toFixed(2)}` : 'Not set'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Count Summary */}
      <Card title="Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{visaTypes.length}</div>
            <div className="text-sm text-gray-600">Total Visa Types</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{visaTypes.filter(vt => vt.isActive).length}</div>
            <div className="text-sm text-gray-600">Active Visa Types</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{visaTypes.filter(vt => !vt.isActive).length}</div>
            <div className="text-sm text-gray-600">Disabled Visa Types</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{packages.length}</div>
            <div className="text-sm text-gray-600">Service Packages</div>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={selectedVisaType ? `Edit ${selectedVisaType.code} Pricing` : ''}>
        {selectedVisaType && (
          <div className="space-y-6">
            {/* Visa Type Status */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedVisaType.name}</h3>
                  <p className="text-sm text-gray-600">Visa Type: {selectedVisaType.code}</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedVisaType.isActive}
                    onChange={(e) => {
                      if (showDisabled || e.target.checked) {
                        toggleVisaTypeStatus(selectedVisaType.id, e.target.checked)
                      } else {
                        error('Enable "Show disabled visa types" to disable this visa type')
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                  />
                  <span className="text-sm text-gray-700">Enable visa type</span>
                </label>
              </div>
            </div>

            {/* Package Pricing */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Package Pricing</h4>
              {packages.map(pkg => {
                const rule = selectedVisaType.packages[pkg.code]
                const isEditing = editingPackage?.packageCode === pkg.code

                return (
                  <div key={pkg.code} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-gray-900">{pkg.displayName}</h5>
                        <p className="text-sm text-gray-600">{pkg.description}</p>
                      </div>
                      {!isEditing && (
                        <Button
                          onClick={() => startEditPackage(pkg.code, rule)}
                          size="sm"
                          variant="outline"
                          className="!bg-blue-600 !text-white hover:!bg-blue-700"
                          style={{ backgroundColor: '#2563eb !important', color: '#ffffff !important' }}
                        >
                          Edit
                        </Button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingPackage.basePrice}
                              onChange={(e) => setEditingPackage({
                                ...editingPackage,
                                basePrice: e.target.value
                              })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingPackage.taxRate}
                              onChange={(e) => setEditingPackage({
                                ...editingPackage,
                                taxRate: e.target.value
                              })}
                            />
                          </div>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingPackage.isActive}
                            onChange={(e) => setEditingPackage({
                              ...editingPackage,
                              isActive: e.target.checked
                            })}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                          />
                          <span className="text-sm text-gray-700">Enable package</span>
                        </label>
                        <div className="flex space-x-2">
                          <Button
                            onClick={savePackage}
                            size="sm"
                            className="!bg-green-600 !text-white hover:!bg-green-700"
                            style={{ backgroundColor: '#059669 !important', color: '#ffffff !important' }}
                          >
                            Save
                          </Button>
                          <Button
                            onClick={cancelEditPackage}
                            size="sm"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Price: </span>
                          <span className="font-medium">{rule ? `$${rule.basePrice.toFixed(2)}` : 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tax: </span>
                          <span className="font-medium">{rule ? `${(rule.taxRate * 100).toFixed(2)}%` : 'Not set'}</span>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            rule?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rule?.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminPricingPage