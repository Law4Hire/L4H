import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, fetchJson, useToast } from '../../index'
import { useAuth } from '../../hooks/useAuth'
import { formatDistanceToNow, format } from 'date-fns'
import { MessageSquare, Search } from 'lucide-react'

interface CaseItem {
  id: string
  status: string
  lastActivityAt: string
  createdAt: string
  clientFirstName?: string
  clientLastName?: string
  userEmail?: string
  userName?: string
  visaTypeCode?: string
  visaTypeName?: string
  assignedStaffId?: number | null
  assignedStaffName?: string | null
}

interface AttorneyOption {
  id: number
  name: string
}

const LegalProWorkbasket: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [attorneys, setAttorneys] = useState<AttorneyOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [assigningCaseId, setAssigningCaseId] = useState<string | null>(null)
  const [requestingCaseId, setRequestingCaseId] = useState<string | null>(null)

  const isAdmin = user?.isAdmin || false

  const loadData = async () => {
    try {
      const casesPath = isAdmin ? '/v1/admin/cases' : '/v1/cases/dashboard'
      const fetches: Promise<any>[] = [
        fetchJson('/v1/dashboard/stats'),
        fetchJson<CaseItem[]>(casesPath),
        fetchJson('/v1/meetings/my-appointments'),
      ]
      if (isAdmin) fetches.push(fetchJson<AttorneyOption[]>('/v1/attorneys'))

      const results = await Promise.all(fetches)
      setStats(results[0])
      setCases(results[1])
      setAppointments(results[2])
      if (isAdmin && results[3]) setAttorneys(results[3])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [isAdmin])

  const getClientName = (c: CaseItem) => {
    if (c.clientFirstName || c.clientLastName)
      return `${c.clientFirstName ?? ''} ${c.clientLastName ?? ''}`.trim()
    return c.userName || c.userEmail || 'Unknown'
  }

  const handleAssignCase = async (caseId: string, staffId: string) => {
    setAssigningCaseId(caseId)
    try {
      const token = localStorage.getItem('jwt_token')
      const res = await fetch(`/api/v1/cases/${caseId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staffId: staffId ? parseInt(staffId) : null }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      success('Case assigned successfully')
      await loadData()
    } catch {
      error('Failed to assign case')
    } finally {
      setAssigningCaseId(null)
    }
  }

  const handleRequestReassignment = async (caseId: string) => {
    if (!window.confirm('Send a reassignment request to admin?')) return
    setRequestingCaseId(caseId)
    try {
      const token = localStorage.getItem('jwt_token')
      const res = await fetch(`/api/v1/cases/${caseId}/request-reassignment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Reassignment requested by assigned legal professional' }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      success('Reassignment request sent to admin')
    } catch {
      error('Failed to send reassignment request')
    } finally {
      setRequestingCaseId(null)
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  const filteredCases = cases.filter(c =>
    getClientName(c).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.userEmail ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Hello {user?.name || 'Legal Professional'}</h1>
          <p className="text-blue-200 text-lg">Legal Professional Workbasket - Centralized Case Control</p>
        </div>
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-gray-800 rounded-full opacity-50"></div>
      </div>

      {/* Quick links */}
      <Card title="Quick Links">
        <div className="flex flex-wrap gap-3 p-2">
          <Button variant="outline" onClick={() => navigate('/messages')} className="flex items-center gap-2">
            <MessageSquare size={16} /> Messages
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6" title="Stats">
          <div className="space-y-2">
            <div className="flex justify-between"><span>Active Cases</span><span className="font-bold">{stats?.activeCases || 0}</span></div>
            <div className="flex justify-between"><span>Monthly Revenue</span><span className="font-bold">${(stats?.monthlyRevenue || 0).toLocaleString()}</span></div>
          </div>
        </Card>
        <Card className="p-6" title="Next Appointment">
          {appointments.length > 0 ? (
            <div>
              <div className="font-bold">{appointments[0].clientName}</div>
              <div className="text-sm text-gray-500">{format(new Date(appointments[0].startTime), 'PPP p')}</div>
            </div>
          ) : <p className="text-gray-400 italic">No appointments</p>}
        </Card>
      </div>

      <Card title={isAdmin ? 'All Cases — Assigned & Unassigned' : 'My Assigned Cases'}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by client name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredCases.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              {isAdmin ? 'No cases found' : 'No Assigned Cases'}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase text-gray-500">
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Visa</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">{isAdmin ? 'Assign To' : 'Assigned Attorney'}</th>
                  <th className="px-6 py-3">Last Activity</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredCases.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium">{getClientName(c)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.visaTypeCode || c.visaTypeName || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {isAdmin ? (
                        <select
                          defaultValue={c.assignedStaffId ?? ''}
                          disabled={assigningCaseId === c.id}
                          onChange={e => handleAssignCase(c.id, e.target.value)}
                          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">— Unassigned —</option>
                          {attorneys.map(a => (
                            <option key={a.id} value={String(a.id)}>{a.name}</option>
                          ))}
                        </select>
                      ) : (
                        c.assignedStaffName
                          ? <span className="text-green-700 dark:text-green-400">{c.assignedStaffName}</span>
                          : <span className="text-amber-600 dark:text-amber-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {c.lastActivityAt ? formatDistanceToNow(new Date(c.lastActivityAt)) + ' ago' : '—'}
                    </td>
                    <td className="px-6 py-4 flex gap-2 flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/cases/${c.id}`)}>Manage</Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/messages?caseId=${c.id}`)}>
                        <MessageSquare size={14} />
                      </Button>
                      {!isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={requestingCaseId === c.id}
                          onClick={() => handleRequestReassignment(c.id)}
                        >
                          Request Reassignment
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}

export default LegalProWorkbasket
