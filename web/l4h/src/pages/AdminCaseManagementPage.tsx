import React, { useState, useEffect } from 'react'
import { Card, Button, useToast } from '@l4h/shared-ui'

interface AdminPriceSnapshotResponse {
  id: number
  visaTypeCode: string
  packageCode: string
  countryCode: string
  total: number
  currency: string
  createdAt: string
}

interface AdminCaseResponse {
  id: string
  status: string
  lastActivityAt: string
  createdAt: string
  userEmail: string
  userName: string
  visaTypeCode?: string
  visaTypeName?: string
  packageCode?: string
  packageDisplayName?: string
  latestPriceSnapshot?: AdminPriceSnapshotResponse
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  closed: 'bg-gray-100 text-gray-800',
  denied: 'bg-red-100 text-red-800'
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'closed', label: 'Closed' },
  { value: 'denied', label: 'Denied' }
]

const AdminCaseManagementPage: React.FC = () => {
  const [cases, setCases] = useState<AdminCaseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingCaseId, setUpdatingCaseId] = useState<string | null>(null)
  const { success, error } = useToast()

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('jwt_token')
      
      if (!token) {
        error('Authentication required', 'Please log in to access admin features')
        return
      }

      const response = await fetch('/api/v1/admin/cases', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load cases: ${response.status}`)
      }

      const data = await response.json()
      setCases(data)

    } catch (err) {
      console.error('Error loading cases:', err)
      error('Failed to load cases', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const updateCaseStatus = async (caseId: string, newStatus: string, reason?: string) => {
    try {
      setUpdatingCaseId(caseId)
      const token = localStorage.getItem('jwt_token')
      
      if (!token) {
        error('Authentication required')
        return
      }

      const response = await fetch(`/api/v1/admin/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          reason: reason || `Status updated to ${newStatus} by admin`
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update case status: ${response.status}`)
      }

      success('Case status updated successfully')
      loadCases() // Refresh the cases list

    } catch (err) {
      console.error('Error updating case status:', err)
      error('Failed to update case status', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdatingCaseId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading cases...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Case Management
          </h1>
          <p className="text-gray-600">
            Manage all immigration cases and their statuses
          </p>
        </div>
      </div>

      {/* Cases Overview */}
      <Card title="Cases Summary">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statusOptions.map(status => {
            const count = cases.filter(c => c.status.toLowerCase() === status.value).length
            return (
              <div key={status.value} className="text-center">
                <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[status.value as keyof typeof statusColors]}`}>
                  {status.label}
                </div>
                <div className="mt-1 text-2xl font-bold text-gray-900">{count}</div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Cases List */}
      <Card title={`All Cases (${cases.length})`}>
        {cases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No cases found in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visa Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {caseItem.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{caseItem.userName || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{caseItem.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {caseItem.visaTypeCode || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {caseItem.visaTypeName || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {caseItem.packageDisplayName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {caseItem.packageCode || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[caseItem.status.toLowerCase() as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {caseItem.latestPriceSnapshot ? (
                        <div className="text-sm text-gray-900">
                          {caseItem.latestPriceSnapshot.currency} {caseItem.latestPriceSnapshot.total.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No pricing</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(caseItem.lastActivityAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={caseItem.status}
                        onChange={(e) => {
                          if (e.target.value !== caseItem.status) {
                            updateCaseStatus(caseItem.id, e.target.value)
                          }
                        }}
                        disabled={updatingCaseId === caseItem.id}
                        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {updatingCaseId === caseItem.id && (
                        <div className="mt-1 text-xs text-gray-500">Updating...</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminCaseManagementPage