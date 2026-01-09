import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@l4h/shared-ui'
import { useAuth } from '../../hooks/useAuth'
import { useCases } from '../../hooks/useCases'
import { useAttorneys } from '../../hooks/useAttorneys'
import { formatDistanceToNow, format } from 'date-fns'
import { MessageSquare, Calendar, User, Clock, Video, ExternalLink, Settings, Search, ArrowUpDown, ChevronDown, X, Edit, Save } from 'lucide-react'
import { TimeTracker } from '../../components/TimeTracker'

interface DashboardStats {
  activeCases: number
  pendingTasks: number
  upcomingAppointments: number
  monthlyRevenue: number
  lastMonthRevenue: number
  newClients: number
  completedCases: number
}

interface ActivityItem {
  id: number
  type: string
  message: string
  time: string
}

interface Appointment {
  id: string
  subject: string
  startTime: string
  endTime: string
  joinUrl?: string
  clientName: string
}

interface MessagePreview {
  id: string
  sender: string
  subject: string
  snippet: string
  time: string
}

const LegalDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [messages, setMessages] = useState<MessagePreview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cases management
  const { cases, isLoading: casesLoading, error: casesError, fetchCases, assignCase, updateVisaTypes, updateCase } = useCases()
  const { attorneys, fetchAttorneys } = useAttorneys()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAssigned, setShowAssigned] = useState(false)
  const [sortBy, setSortBy] = useState('lastActivityAt')
  const [sortDesc, setSortDesc] = useState(true)
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [isEditingCase, setIsEditingCase] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({}) // Generic object for case edits

  const isAdmin = user?.roles?.includes('Admin') || false
  const isLegalProfessional = user?.roles?.includes('LegalProfessional') || isAdmin

  const handleRequestReassignment = async (caseId: string) => {
    // In a real app, this would create a task or notification for admins
    // success('Reassignment request sent to administrators') // alert for now
    alert('Reassignment request sent to administrators')
  }

  const handleCaseAction = (caseId: string) => {
    setSelectedCase(caseId)
    const caseData = cases.find(c => c.id === caseId)
    if (caseData) {
      setEditFormData({
        status: caseData.status,
        assignedStaffId: caseData.assignedStaffId !== undefined && caseData.assignedStaffId !== null ? caseData.assignedStaffId.toString() : '',
        // Add other fields as needed
      })
    }
    setShowCaseModal(true)
    setIsEditingCase(false)
  }

  const handleSaveCase = async () => {
    if (!selectedCase) return
    
    try {
      // Save Assignments (Admin only)
      if (isAdmin && editFormData.assignedStaffId !== undefined) {
         const staffId = editFormData.assignedStaffId ? parseInt(editFormData.assignedStaffId) : null
         await assignCase(selectedCase, staffId)
      }

      // Save Status (Legal Professional or Admin)
      if (editFormData.status) {
        const token = localStorage.getItem('jwt_token')
        const response = await fetch(`/api/v1/cases/${selectedCase}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: editFormData.status })
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.detail || 'Failed to update status')
        }
      }

      await fetchCases({ showAssigned, search: searchTerm, sortBy, sortDesc })
      setIsEditingCase(false)
      // alert('Case updated successfully')
    } catch (err) {
      console.error('Error saving case:', err)
      alert(err instanceof Error ? err.message : 'Failed to save changes')
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('jwt_token')
        const headers = { 'Authorization': `Bearer ${token}` }

        const [statsRes, activityRes, appointRes, msgRes] = await Promise.all([
          fetch('/api/v1/dashboard/stats', { headers }),
          fetch('/api/v1/dashboard/activity', { headers }),
          fetch('/api/v1/meetings/my-appointments', { headers }),
          fetch('/api/v1/messaging/previews', { headers })
        ])

        if (statsRes.ok) setStats(await statsRes.json())
        if (activityRes.ok) setActivity(await activityRes.json())
        if (appointRes.ok) setAppointments(await appointRes.json())
        if (msgRes.ok) setMessages(await msgRes.json())

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    fetchCases({ showAssigned, search: searchTerm, sortBy, sortDesc })
    if (isAdmin) {
      fetchAttorneys()
    }
  }, [])

  // Refetch cases when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCases({ showAssigned, search: searchTerm, sortBy, sortDesc })
    }, 300) // Debounce search

    return () => clearTimeout(timer)
  }, [searchTerm, showAssigned, sortBy, sortDesc])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const revenueGrowth = stats
    ? ((stats.monthlyRevenue - stats.lastMonthRevenue) / (stats.lastMonthRevenue || 1)) * 100
    : 0

  const handleAssignCase = async (caseId: string, staffId: number | null) => {
    const result = await assignCase(caseId, staffId)
    if (result.success) {
      await fetchCases({ showAssigned, search: searchTerm, sortBy, sortDesc })
    } else {
      alert(result.error || 'Failed to assign case')
    }
  }

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(field)
      setSortDesc(true)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="bg-navy-900 rounded-lg p-8 text-white shadow-xl flex justify-between items-center overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 font-serif">
            Hello {user?.name || 'Legal Professional'}
          </h1>
          <p className="text-blue-200 text-lg">
            Manage your cases, clients, and legal team from your central command.
          </p>
        </div>
        <Button
          onClick={() => setShowSettingsModal(true)}
          className="relative z-10 bg-navy-800 hover:bg-navy-700 text-white border-navy-700"
          size="sm"
        >
          <Settings size={18} className="mr-2" />
          Settings
        </Button>
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-navy-800 rounded-full opacity-50"></div>
      </div>

      {/* Cases Grid Section */}
      <Card title="My Cases">
        <div className="p-6 pt-0">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-navy-700 rounded-lg bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAssigned}
                    onChange={(e) => setShowAssigned(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-navy-900 dark:text-white">Show Assigned Cases</span>
                </label>
              </div>
            )}
          </div>

          {/* Cases Table */}
          {casesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : casesError ? (
            <div className="text-red-600 py-4 text-center">{casesError}</div>
          ) : cases.length === 0 ? (
            <div className="text-gray-500 py-8 text-center italic">
              {isAdmin && !showAssigned ? 'No unassigned cases found.' : 'No cases found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-navy-800">
                  <tr>
                    <th
                      onClick={() => handleSortChange('clientFirstName')}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-700"
                    >
                      <div className="flex items-center gap-1">
                        Client Name
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th
                      onClick={() => handleSortChange('status')}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-700"
                    >
                      <div className="flex items-center gap-1">
                        Status
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Visa Types
                    </th>
                    <th
                      onClick={() => handleSortChange('lastActivityAt')}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-700"
                    >
                      <div className="flex items-center gap-1">
                        Last Activity
                        <ArrowUpDown size={14} />
                      </div>
                    </th>
                    {isAdmin && (
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Assign To
                      </th>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-800">
                  {cases.map((caseItem) => (
                    <tr
                      key={caseItem.id}
                      onClick={() => handleCaseAction(caseItem.id)}
                      className="hover:bg-gray-50 dark:hover:bg-navy-800 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-navy-900 dark:text-white">
                          {caseItem.clientFirstName} {caseItem.clientLastName}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {caseItem.clientEmail}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {caseItem.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {caseItem.visaTypes.map((vt) => (
                            <span
                              key={vt.visaTypeId}
                              className={`px-2 py-0.5 text-xs rounded ${
                                vt.isPrimary
                                  ? 'bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200 font-bold'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {vt.visaTypeCode}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(caseItem.lastActivityAt))} ago
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={caseItem.assignedStaffId || ''}
                            onChange={(e) => handleAssignCase(caseItem.id, parseInt(e.target.value))}
                            className="text-xs border border-gray-300 dark:border-navy-700 rounded px-2 py-1 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Unassigned</option>
                            {attorneys.map((atty) => (
                              <option key={atty.id} value={atty.id}>
                                {atty.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleCaseAction(caseItem.id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          {!isAdmin && isLegalProfessional && (
                            <button 
                              onClick={() => handleRequestReassignment(caseItem.id)}
                              className="text-gold-600 hover:text-gold-900 dark:text-gold-500 dark:hover:text-gold-400 ml-2"
                            >
                              Request change
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* 3 Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 - Placeholder */}
        <Card className="p-6">
          <div className="flex items-center justify-center h-32 text-gray-400 italic">
            No card assigned yet
          </div>
        </Card>

        {/* Card 2 - Stats */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Cases</span>
              <span className="text-xl font-bold text-navy-900 dark:text-white">{stats?.activeCases || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Appointments</span>
              <span className="text-xl font-bold text-navy-900 dark:text-white">{stats?.upcomingAppointments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Billing</span>
              <span className="text-xl font-bold text-navy-900 dark:text-white">${(stats?.monthlyRevenue || 0).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Card 3 - Appointments */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Next Appointment</h3>
          {appointments.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-gray-400 italic text-sm">
              No upcoming appointments
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-bold text-navy-900 dark:text-white text-sm">{appointments[0].clientName}</div>
              <div className="text-xs text-gray-500">{format(new Date(appointments[0].startTime), 'PPP')}</div>
              <div className="text-xs text-gray-500">{format(new Date(appointments[0].startTime), 'p')}</div>
              {appointments[0].joinUrl && (
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                  onClick={() => window.open(appointments[0].joinUrl, '_blank')}
                >
                  <Video size={14} className="mr-1" /> Join
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Button variant="outline" className="flex flex-col h-auto py-6 space-y-2 border-navy-200 dark:border-navy-800" onClick={() => navigate('/clients')}>
          <User size={24} className="text-blue-600" />
          <span className="text-sm font-bold text-navy-900 dark:text-white">Clients</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-auto py-6 space-y-2 border-navy-200 dark:border-navy-800" onClick={() => navigate('/time-tracking')}>
          <Clock size={24} className="text-green-600" />
          <span className="text-sm font-bold text-navy-900 dark:text-white">Billing</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-auto py-6 space-y-2 border-navy-200 dark:border-navy-800" onClick={() => navigate('/messages')}>
          <MessageSquare size={24} className="text-gold-600" />
          <span className="text-sm font-bold text-navy-900 dark:text-white">Messages</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-auto py-6 space-y-2 border-navy-200 dark:border-navy-800" onClick={() => navigate('/profile')}>
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {user?.name?.charAt(0)}
          </div>
          <span className="text-sm font-bold text-navy-900 dark:text-white">Profile</span>
        </Button>
      </div>

      {/* Case Detail Modal */}
      {showCaseModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-navy-800 flex justify-between items-center sticky top-0 bg-white dark:bg-navy-900 z-10">
              <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Case Details</h2>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => isEditingCase ? handleSaveCase() : setIsEditingCase(true)}
                >
                  {isEditingCase ? <Save size={18} className="mr-2" /> : <Edit size={18} className="mr-2" />}
                  {isEditingCase ? 'Save' : 'Edit'}
                </Button>
                <button
                  onClick={() => setShowCaseModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const caseData = cases.find(c => c.id === selectedCase)
                if (!caseData) return <p>Case not found</p>
                return (
                  <div className="space-y-6">
                    <TimeTracker 
                      caseId={caseData.id} 
                      clientName={`${caseData.clientFirstName} ${caseData.clientLastName}`} 
                    />

                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <label className="text-sm font-bold text-gray-500 uppercase">Client Name</label>
                          <p className="text-lg text-navy-900 dark:text-white">{caseData.clientFirstName} {caseData.clientLastName}</p>
                        </div>
                        {caseData.clientId && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => navigate(`/clients/${caseData.clientId}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Profile
                          </Button>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-500 uppercase">Email</label>
                        <p className="text-lg text-navy-900 dark:text-white">{caseData.clientEmail}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-bold text-gray-500 uppercase block mb-1">Status</label>
                        {isEditingCase ? (
                          <select 
                            className="w-full p-2 border rounded bg-white dark:bg-navy-800 dark:text-white dark:border-navy-700" 
                            value={editFormData.status}
                            onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                          >
                            {['Inquiry', 'Consultation', 'Retainer Agreement', 'Case In Progress', 'Review', 'Filing', 'Completed', 'Closed'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>
                            {caseData.status}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-bold text-gray-500 uppercase block mb-1">Assigned Staff</label>
                        {isEditingCase && isAdmin ? (
                          <select
                            className="w-full p-2 border rounded bg-white dark:bg-navy-800 dark:text-white dark:border-navy-700"
                            value={editFormData.assignedStaffId}
                            onChange={(e) => setEditFormData({...editFormData, assignedStaffId: e.target.value})}
                          >
                            <option value="">Unassigned</option>
                            {attorneys.map(atty => (
                              <option key={atty.id} value={atty.id}>{atty.name}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-lg text-navy-900 dark:text-white">{caseData.assignedStaffName || 'Unassigned'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-bold text-gray-500 uppercase">Visa Types</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {caseData.visaTypes.map((vt) => (
                            <span
                              key={vt.visaTypeId}
                              className={`px-3 py-1 text-sm rounded ${
                                vt.isPrimary
                                  ? 'bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200 font-bold'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {vt.visaTypeName} ({vt.visaTypeCode})
                              {vt.isPrimary && ' - Primary'}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-bold text-gray-500 uppercase">Created</label>
                        <p className="text-lg text-navy-900 dark:text-white">{format(new Date(caseData.createdAt), 'PPP')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-500 uppercase">Last Activity</label>
                        <p className="text-lg text-navy-900 dark:text-white">{formatDistanceToNow(new Date(caseData.lastActivityAt))} ago</p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-navy-800 bg-gray-50 dark:bg-navy-800 flex justify-between gap-4">
              {(() => {
                 const caseData = cases.find(c => c.id === selectedCase)
                 // Show unassign button if assigned and NOT in edit mode (edit mode has dropdown)
                 if (caseData && caseData.assignedStaffId && !isEditingCase) {
                   return (
                     <Button 
                       onClick={() => handleAssignCase(caseData.id, null)} 
                       variant="danger"
                       className="bg-red-600 hover:bg-red-700 text-white"
                     >
                       Unassign / Return to Queue
                     </Button>
                   )
                 }
                 return <div></div> // Spacer
              })()}
              <Button onClick={() => setShowCaseModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 dark:border-navy-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 italic">Settings functionality coming soon. You can update your profile from the Attorneys/Staff admin panel.</p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-navy-800 bg-gray-50 dark:bg-navy-800">
              <Button onClick={() => setShowSettingsModal(false)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LegalDashboard