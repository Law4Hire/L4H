import React, { useState, useEffect } from 'react'
import { Card, Button, useToast } from '@l4h/shared-ui'

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
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading packages...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Package Management
          </h1>
          <p className="text-gray-600">
            Configure package settings including lawyer-only requirements for scheduling.
          </p>
        </div>
      </div>

      <Card title="Service Packages">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requires Lawyer
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {packages.map(pkg => (
                <tr key={pkg.id} className={!pkg.isActive ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {pkg.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pkg.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{pkg.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => toggleRequiresLawyer(pkg)}
                      disabled={saving === pkg.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        pkg.requiresLawyer ? 'bg-blue-600' : 'bg-gray-200'
                      } ${saving === pkg.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          pkg.requiresLawyer ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div className="text-xs text-gray-500 mt-1">
                      {pkg.requiresLawyer ? 'Lawyers only' : 'Lawyers & Paralegals'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => toggleIsActive(pkg)}
                      disabled={saving === pkg.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        pkg.isActive ? 'bg-green-600' : 'bg-gray-200'
                      } ${saving === pkg.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          pkg.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div className="text-xs text-gray-500 mt-1">
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">About Lawyer Requirements:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
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
