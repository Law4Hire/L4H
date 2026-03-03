import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, fetchJson, useTheme } from '../../index'
import { useAuth } from '../../hooks/useAuth'
import { formatDistanceToNow, format } from 'date-fns'
import { MessageSquare, Calendar, User, Clock, Video, Settings, Search, ArrowUpDown, X, Edit, Save, Bell, Shield } from 'lucide-react'

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
  assignedAttorneyId?: string | null
  assignedAttorneyName?: string | null
}

const LegalProWorkbasket: React.FC = () => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [selectedCase, setSelectedCase] = useState<string | null>(null)

  const isAdmin = user?.isAdmin || false

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Admins see ALL cases (assigned + unassigned); staff see only their own
        const casesPath = isAdmin ? '/v1/admin/cases' : '/v1/cases'

        const [statsData, casesData, appointData] = await Promise.all([
          fetchJson('/v1/dashboard/stats'),
          fetchJson<CaseItem[]>(casesPath),
          fetchJson('/v1/meetings/my-appointments')
        ])
        setStats(statsData)
        setCases(casesData)
        setAppointments(appointData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [isAdmin])

  const getClientName = (c: CaseItem) => {
    if (c.clientFirstName || c.clientLastName)
      return `${c.clientFirstName ?? ''} ${c.clientLastName ?? ''}`.trim()
    return c.userName || c.userEmail || 'Unknown'
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
                  {isAdmin && <th className="px-6 py-3">Assigned To</th>}
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
                    {isAdmin && (
                      <td className="px-6 py-4 text-sm">
                        {c.assignedAttorneyName
                          ? <span className="text-green-700 dark:text-green-400">{c.assignedAttorneyName}</span>
                          : <span className="text-amber-600 dark:text-amber-400 italic">Unassigned</span>}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {c.lastActivityAt ? formatDistanceToNow(new Date(c.lastActivityAt)) + ' ago' : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/cases/${c.id}`)}>Manage</Button>
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
