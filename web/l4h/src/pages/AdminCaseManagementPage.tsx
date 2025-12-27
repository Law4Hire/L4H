import React, { useState, useEffect } from 'react'
import { Card, Button, useToast, Modal } from '@l4h/shared-ui'
import { interview, professional } from '@l4h/shared-ui'
import { Lock } from 'lucide-react'

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
  interviewSessionId?: string
  isVisaLockedByAttorney: boolean
}

interface VisaEvaluation {
    visaTypeId: number
    visaName: string;
    status: string;
    matchScore: number;
    explanation: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  denied: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
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

  // State for the review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<AdminCaseResponse | null>(null);
  const [evaluations, setEvaluations] = useState<VisaEvaluation[]>([]);
  const [isEvaluationsLoading, setIsEvaluationsLoading] = useState(false);

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

  const handleOpenReviewModal = async (caseItem: AdminCaseResponse) => {
    if (!caseItem.interviewSessionId) {
        error("No interview session found for this case.");
        return;
    }
    setSelectedCase(caseItem);
    setIsReviewModalOpen(true);
    try {
        setIsEvaluationsLoading(true);
        console.log('Fetching evaluations for session:', caseItem.interviewSessionId);
        const evals = await professional.getSessionEvaluations(caseItem.interviewSessionId);
        console.log('Evaluations received:', evals);
        setEvaluations(evals);
    } catch (err) {
        console.error('Error loading interview evaluations:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        error("Failed to load interview evaluations", errorMessage);
    } finally {
        setIsEvaluationsLoading(false);
    }
  }

  const handleLockVisa = async (visaTypeId: number, reason: string) => {
    if (!selectedCase || !selectedCase.interviewSessionId) return;

    try {
        console.log('Locking visa:', { sessionId: selectedCase.interviewSessionId, visaTypeId, reason });
        await professional.lockVisa({
            sessionId: selectedCase.interviewSessionId,
            visaTypeId,
            reason,
        });
        success("Visa has been locked for this case.");
        setIsReviewModalOpen(false);
        loadCases(); // Refresh cases to show lock status
    } catch (err) {
        console.error('Error locking visa:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        error("Failed to lock visa", errorMessage);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading cases...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Case Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
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
                <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Cases List */}
      <Card title={`All Cases (${cases.length})`}>
        {cases.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No cases found in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Case ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Visa Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 dark:text-white">
                        {caseItem.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{caseItem.userName || 'Unknown'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{caseItem.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {caseItem.isVisaLockedByAttorney && <Lock className="w-4 h-4 inline-block mr-1 text-blue-600 dark:text-blue-400" />}
                        {caseItem.visaTypeCode || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {caseItem.visaTypeName || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {caseItem.packageDisplayName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {caseItem.packageCode || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[caseItem.status.toLowerCase() as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {caseItem.latestPriceSnapshot ? (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {caseItem.latestPriceSnapshot.currency} {caseItem.latestPriceSnapshot.total.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">No pricing</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(caseItem.lastActivityAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <select
                        value={caseItem.status}
                        onChange={(e) => {
                          if (e.target.value !== caseItem.status) {
                            updateCaseStatus(caseItem.id, e.target.value)
                          }
                        }}
                        disabled={updatingCaseId === caseItem.id}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {caseItem.interviewSessionId && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReviewModal(caseItem)}
                        >
                            Review
                        </Button>
                      )}
                      {updatingCaseId === caseItem.id && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Updating...</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      <Modal open={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title={`Review Interview: ${selectedCase?.userName}`}>
        {isEvaluationsLoading ? (
            <p className="dark:text-gray-300">Loading evaluations...</p>
        ) : (
            <div className="space-y-4">
                {evaluations.map(e => (
                    <div key={e.visaTypeId} className="p-4 border dark:border-gray-700 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold dark:text-white">{e.visaName} ({e.status})</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{e.explanation}</p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleLockVisa(e.visaTypeId, "Attorney recommendation after review.")}
                                disabled={selectedCase?.isVisaLockedByAttorney}
                            >
                                Lock
                            </Button>
                        </div>
                        <div className="text-right mt-2 font-bold dark:text-white">
                            Score: <span className="text-green-500 dark:text-green-400">{Math.round(e.matchScore)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminCaseManagementPage