import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, fetchJson, useToast, cases } from '../../index'
import { useAuth } from '../../hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Briefcase, Users, Clock, Shield, Settings, Activity, FileText } from 'lucide-react'

interface CaseItem {
  id: string
  status: string
  lastActivityAt: string
  createdAt: string
  userName?: string
  userEmail?: string
  visaTypeCode?: string
  visaTypeName?: string
  assignedStaffId?: number
  assignedStaffName?: string
}

const ProfessionalWorkspace: React.FC = () => {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [assignedCases, setAssignedCases] = useState<CaseItem[]>([])
  const [availableCases, setAvailableCases] = useState<CaseItem[]>([])
  const [attorneys, setAttorneys] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [statsData, assigned, available, msgData, attorneysData] = await Promise.all([
        fetchJson('/v1/dashboard/stats'),
        fetchJson<CaseItem[]>('/v1/cases/dashboard'),
        fetchJson<CaseItem[]>('/api/v1/cases/available'),
        fetchJson<any[]>('/api/v1/messaging/assigned'),
        fetchJson<any[]>('/v1/attorneys')
      ])
      setStats(statsData)
      setAssignedCases(assigned)
      setAvailableCases(available || [])
      setMessages(msgData || [])
      setAttorneys(attorneysData || [])
    } catch (err) {
      console.error('Error loading professional workspace:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAssign = async (caseId: string, staffId: number | null) => {
    try {
      setIsAssigning(caseId)
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/cases/${caseId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ staffId })
      })

      if (!response.ok) throw new Error('Failed to assign case')
      
      success(staffId === null ? 'Case unassigned' : 'Case assigned successfully')
      loadData()
    } catch (err) {
      error('Assignment failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsAssigning(null)
    }
  }

  if (isLoading) return <div className="flex justify-center py-20 animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className={`rounded-xl p-8 text-white shadow-2xl flex justify-between items-center relative overflow-hidden border-b-4 ${isAdmin ? 'bg-slate-900 border-red-600' : 'bg-blue-900 border-blue-500'}`}>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
            {isAdmin ? 'Admin Command Center' : 'Professional Workspace'}
          </h1>
          <p className={`${isAdmin ? 'text-slate-300' : 'text-blue-100'} text-xl font-medium`}>
            {isAdmin ? `System Administrator: ${user?.name}` : `Welcome back, ${user?.name}. Managing your legal queue.`}
          </p>
        </div>
        {isAdmin ? (
          <Shield className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-red-600 opacity-20" />
        ) : (
          <Briefcase className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-blue-800 opacity-20" />
        )}
      </div>

      {/* Admin Quick Links */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" onClick={() => navigate('/admin/users')}>
            <Users className="w-6 h-6 text-blue-600" />
            <span>User Management</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" onClick={() => navigate('/admin/cases')}>
            <FileText className="w-6 h-6 text-green-600" />
            <span>Case Oversight</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" onClick={() => navigate('/admin/system-settings')}>
            <Settings className="w-6 h-6 text-gray-600" />
            <span>System Settings</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" onClick={() => navigate('/admin/reports')}>
            <Activity className="w-6 h-6 text-purple-600" />
            <span>Global Analytics</span>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-green-500 shadow-sm" title="My Active Cases">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{assignedCases.length}</span>
            <Users className="text-green-500 w-8 h-8" />
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-amber-500 shadow-sm" title="Unread Messages">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {messages.reduce((acc, m) => acc + (m.unreadCount || 0), 0)}
            </span>
            <MessageSquare className="text-amber-500 w-8 h-8" />
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-blue-500 shadow-sm" title="Billable Hours (MTD)">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">124.5</span>
            <Clock className="text-blue-500 w-8 h-8" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workbasket */}
        <Card title="My Assigned Workbasket" className="shadow-lg border-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Visa</th>
                  <th className="px-6 py-4">Assignment</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {assignedCases.map(c => (
                  <tr key={c.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">{c.userName || c.userEmail}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{c.visaTypeCode || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      {isAdmin ? (
                        <select
                          disabled={isAssigning === c.id}
                          value={c.assignedStaffId || ''}
                          onChange={(e) => handleAssign(c.id, e.target.value ? parseInt(e.target.value) : null)}
                          className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:text-gray-300"
                        >
                          <option value="">Unassign</option>
                          {attorneys.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-[10px]"
                          onClick={() => handleAssign(c.id, null)}
                          disabled={isAssigning === c.id}
                        >
                          Unassign Me
                        </Button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/cases/${c.id}`)}>Manage</Button>
                    </td>
                  </tr>
                ))}
                {assignedCases.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No assigned cases</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Available Cases / Direct Messages */}
        <div className="space-y-8">
          {availableCases.length > 0 && (
            <Card title="Available Unassigned Cases" className="shadow-lg border-none overflow-hidden border-t-4 border-amber-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase text-gray-500 tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Visa</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {availableCases.map(c => (
                      <tr key={c.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">{c.userName || c.userEmail}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{c.visaTypeCode || '—'}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            size="sm" 
                            variant="primary" 
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={() => handleAssign(c.id, user?.attorneyId || null)}
                            disabled={isAssigning === c.id || !user?.attorneyId}
                          >
                            Claim Case
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card title="Direct Messages" className="shadow-lg border-none overflow-hidden">
            <div className="p-0">
              {messages.slice(0, 5).map(thread => (
                <div 
                  key={thread.threadId} 
                  onClick={() => navigate(`/messages?threadId=${thread.threadId}`)}
                  className="p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer flex justify-between items-center group"
                >
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{thread.participantName}</div>
                    <div className="text-sm text-gray-500 truncate max-w-[250px]">{thread.lastMessageSnippet}</div>
                  </div>
                  {thread.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                      {thread.unreadCount} NEW
                    </span>
                  )}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="p-12 text-center text-gray-400 italic">No active conversations</div>
              )}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center">
                <Button variant="outline" size="sm" onClick={() => navigate('/messages')} className="w-full">View All Messages</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfessionalWorkspace
