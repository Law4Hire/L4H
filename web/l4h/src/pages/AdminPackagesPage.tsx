import React, { useState, useEffect } from 'react'
import { Card, Button, useToast } from '@l4h/shared-ui'
import { RefreshCw, Shield, ShieldOff, CheckCircle, XCircle, Pencil, Plus } from 'lucide-react'

interface Package {
  id: number
  code: string
  displayName: string
  description: string
  sortOrder: number
  isActive: boolean
  requiresLawyer: boolean
  createdAt: string
  updatedAt: string
}

const AdminPackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [editForm, setEditForm] = useState({ displayName: '', description: '', sortOrder: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ code: '', displayName: '', description: '', sortOrder: 0, requiresLawyer: false, isActive: true })
  const { success, error } = useToast()

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('jwt_token')

      if (!token) {
        error('Authentication required')
        return
      }

      const response = await fetch('/api/v1/admin/pricing/packages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load packages: ${response.status}`)
      }

      const data = await response.json()
      setPackages(data)
    } catch (err) {
      console.error('Error loading packages:', err)
      error('Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  const createPackage = async () => {
    try {
      setSaving(0) // Use 0 to indicate saving new package
      const token = localStorage.getItem('jwt_token')

      if (!token) {
        error('Authentication required')
        return
      }

      const response = await fetch('/api/v1/admin/pricing/packages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `Failed to create package: ${response.status}`)
      }

      success('Package created successfully')
      setShowCreateModal(false)
      setCreateForm({ code: '', displayName: '', description: '', sortOrder: 0, requiresLawyer: false, isActive: true })
      await loadPackages()
    } catch (err) {
      console.error('Error creating package:', err)
      error(err instanceof Error ? err.message : 'Failed to create package')
    } finally {
      setSaving(null)
    }
  }

  const updatePackage = async (packageId: number, updates: { displayName?: string; description?: string; sortOrder?: number; requiresLawyer?: boolean; isActive?: boolean }) => {
    try {
      setSaving(packageId)
      const token = localStorage.getItem('jwt_token')

      if (!token) {
        error('Authentication required')
        return
      }

      const response = await fetch(`/api/v1/admin/pricing/packages/${packageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error(`Failed to update package: ${response.status}`)
      }

      success('Package updated successfully')
      await loadPackages()
    } catch (err) {
      console.error('Error updating package:', err)
      error('Failed to update package')
    } finally {
      setSaving(null)
    }
  }

  const toggleRequiresLawyer = (pkg: Package) => {
    updatePackage(pkg.id, { requiresLawyer: !pkg.requiresLawyer })
  }

  const toggleIsActive = (pkg: Package) => {
    updatePackage(pkg.id, { isActive: !pkg.isActive })
  }

  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg)
    setEditForm({
      displayName: pkg.displayName,
      description: pkg.description,
      sortOrder: pkg.sortOrder
    })
  }

  const closeEditModal = () => {
    setEditingPackage(null)
    setEditForm({ displayName: '', description: '', sortOrder: 0 })
  }

  const saveEdit = async () => {
    if (!editingPackage) return

    try {
      setSaving(editingPackage.id)
      await updatePackage(editingPackage.id, editForm)
      closeEditModal()
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading packages...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors">
        <div className="px-4 py-5 sm:p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Package Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure package settings including lawyer-only requirements for scheduling.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create Package
            </Button>
            <Button
              onClick={loadPackages}
              variant="outline"
              className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Card title="Service Packages" className="dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
          {packages.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 italic">No packages found. Check database seeding.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Requires Lawyer
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {packages.map(pkg => (
                  <tr key={pkg.id} className={!pkg.isActive ? 'bg-gray-50 dark:bg-gray-900/50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {pkg.displayName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {pkg.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-300">{pkg.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={() => toggleRequiresLawyer(pkg)}
                          disabled={saving === pkg.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            pkg.requiresLawyer ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          } ${saving === pkg.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              pkg.requiresLawyer ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          {pkg.requiresLawyer ? (
                            <><Shield size={12} className="mr-1 text-blue-500" /> Lawyers only</>
                          ) : (
                            <><ShieldOff size={12} className="mr-1" /> All Staff</>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={() => toggleIsActive(pkg)}
                          disabled={saving === pkg.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            pkg.isActive ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                          } ${saving === pkg.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              pkg.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          {pkg.isActive ? (
                            <><CheckCircle size={12} className="mr-1 text-green-500" /> Active</>
                          ) : (
                            <><XCircle size={12} className="mr-1 text-red-500" /> Inactive</>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Button
                        onClick={() => openEditModal(pkg)}
                        disabled={saving === pkg.id}
                        variant="outline"
                        className="inline-flex items-center gap-2 text-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Pencil size={14} />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">About Lawyer Requirements:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• <strong>Requires Lawyer ON:</strong> Scheduling will only show time slots for lawyers</li>
            <li>• <strong>Requires Lawyer OFF:</strong> Scheduling will show time slots for both lawyers and paralegals</li>
            <li>• Changes take effect immediately for new scheduling requests</li>
          </ul>
        </div>
      </Card>

      {/* Edit Package Modal */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={closeEditModal}
            ></div>

            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4" id="modal-title">
                      Edit Package: {editingPackage.code}
                    </h3>
                    <div className="mt-4 space-y-4">
                      {/* Display Name */}
                      <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          id="displayName"
                          value={editForm.displayName}
                          onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter package display name"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          id="description"
                          rows={3}
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter package description"
                        />
                      </div>

                      {/* Sort Order */}
                      <div>
                        <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          id="sortOrder"
                          value={editForm.sortOrder}
                          onChange={(e) => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter sort order"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <Button
                  onClick={saveEdit}
                  disabled={saving === editingPackage.id}
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  {saving === editingPackage.id ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={closeEditModal}
                  disabled={saving === editingPackage.id}
                  variant="outline"
                  className="mt-3 w-full sm:mt-0 sm:w-auto dark:border-gray-600 dark:text-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Create New Package</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                        <input
                          type="text"
                          value={createForm.code}
                          onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="e.g. SILVER_INDIV"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                        <input
                          type="text"
                          value={createForm.displayName}
                          onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="e.g. Silver Package (Individual)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                          rows={3}
                          value={createForm.description}
                          onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter package description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                        <input
                          type="number"
                          value={createForm.sortOrder}
                          onChange={(e) => setCreateForm({ ...createForm, sortOrder: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="createRequiresLawyer"
                          checked={createForm.requiresLawyer}
                          onChange={(e) => setCreateForm({ ...createForm, requiresLawyer: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="createRequiresLawyer" className="block text-sm text-gray-900 dark:text-gray-300">Requires Lawyer</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <Button onClick={createPackage} disabled={saving === 0} variant="primary" className="w-full sm:w-auto">
                  {saving === 0 ? 'Creating...' : 'Create Package'}
                </Button>
                <Button onClick={() => setShowCreateModal(false)} disabled={saving === 0} variant="outline" className="mt-3 w-full sm:mt-0 sm:w-auto dark:border-gray-600 dark:text-gray-300">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPackagesPage