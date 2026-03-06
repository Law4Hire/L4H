import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, fetchJson, useToast } from '../../index'
import { useAuth } from '../../hooks/useAuth'
import { formatDistanceToNow, format } from 'date-fns'
import { MessageSquare, Search, Briefcase, Users, Clock } from 'lucide-react'

interface CaseItem {
  id: string
  status: string
  lastActivityAt: string
  createdAt: string
  userName?: string
  userEmail?: string
  visaTypeCode?: string
  visaTypeName?: string
}

const ProfessionalWorkspace: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [assignedCases, setAssignedCases] = useState<CaseItem[]>([])
  const [availableCases, setAvailableCases] = useState<CaseItem[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, assigned, available, msgData] = await Promise.all([
          fetchJson('/v1/dashboard/stats'),
          fetchJson<CaseItem[]>('/v1/cases/dashboard'), // This returns assigned for non-admins
          fetchJson<CaseItem[]>('/api/v1/cases/available'), // Hypothetical or needs restoration
          fetchJson<any[]>('/api/v1/messaging/assigned'),
        ])
        setStats(statsData)
        setAssignedCases(assigned)
        setAvailableCases(available || [])
        setMessages(msgData || [])
      } catch (err) {
        console.error('Error loading professional workspace:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) return <div className="flex justify-center py-20 animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-blue-900 rounded-xl p-8 text-white shadow-2xl flex justify-between items-center relative overflow-hidden border-b-4 border-blue-500">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Professional Workspace</h1>
          <p className="text-blue-100 text-xl font-medium">Welcome back, {user?.name}. Managing your legal queue.</p>
        </div>
        <Briefcase className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-blue-800 opacity-20" />
      </div>

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
        <Card title="My Assigned Workbasket" className="shadow-lg border-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Visa</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {assignedCases.map(c => (
                  <tr key={c.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">{c.userName || c.userEmail}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{c.visaTypeCode || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDistanceToNow(new Date(c.lastActivityAt))} ago</td>
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
  )
}

export default ProfessionalWorkspace
