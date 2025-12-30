import React, { useState, useEffect } from 'react'
import { Card, Button, useToast } from '@l4h/shared-ui'
import { RefreshCw, Shield, ShieldOff, CheckCircle, XCircle } from 'lucide-react'

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

  const updatePackage = async (packageId: number, updates: { requiresLawyer?: boolean; isActive?: boolean }) => {
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
    </div>
  )
}

export default AdminPackagesPage