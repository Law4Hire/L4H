import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, fetchJson, useToast } from '../../index'
import { useAuth } from '../../hooks/useAuth'
import { formatDistanceToNow, format } from 'date-fns'
import { MessageSquare, Search, Shield, Users, Activity, FileText, Settings } from 'lucide-react'

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

const AdminWorkspace: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [recentCases, setRecentCases] = useState<CaseItem[]>([])
  const [generalMessages, setGeneralMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, cases, msgData] = await Promise.all([
          fetchJson('/v1/dashboard/stats'),
          fetchJson<CaseItem[]>('/v1/admin/cases'),
          fetchJson<any[]>('/v1/messaging/general'),
        ])
        setStats(statsData)
        setRecentCases(cases.slice(0, 5))
        setGeneralMessages(msgData || [])
      } catch (err) {
        console.error('Error loading admin workspace:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) return <div className="flex justify-center py-20 animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-slate-900 rounded-xl p-8 text-white shadow-2xl flex justify-between items-center relative overflow-hidden border-b-4 border-red-600">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Admin Command Center</h1>
          <p className="text-slate-300 text-xl font-medium">System Administrator: {user?.name}</p>
        </div>
        <Shield className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-red-600 opacity-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white dark:bg-gray-800" onClick={() => navigate('/admin/users')}>
          <Users className="w-6 h-6 text-blue-600" />
          <span>User Management</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white dark:bg-gray-800" onClick={() => navigate('/admin/cases')}>
          <FileText className="w-6 h-6 text-green-600" />
          <span>Case Oversight</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white dark:bg-gray-800" onClick={() => navigate('/admin/system-settings')}>
          <Settings className="w-6 h-6 text-gray-600" />
          <span>System Settings</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white dark:bg-gray-800" onClick={() => navigate('/admin/reports')}>
          <Activity className="w-6 h-6 text-purple-600" />
          <span>Global Analytics</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="General Support Queue" className="shadow-lg border-none overflow-hidden">
          <div className="p-0">
            {generalMessages.slice(0, 5).map(thread => (
              <div 
                key={thread.threadId} 
                onClick={() => navigate(`/messages?threadId=${thread.threadId}`)}
                className="p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer flex justify-between items-center group"
              >
                <div>
                  <div className="font-bold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">{thread.participantName}</div>
                  <div className="text-sm text-gray-500 truncate max-w-[250px]">{thread.lastMessageSnippet}</div>
                </div>
                <div className="flex items-center gap-2">
                  {thread.unreadCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                      {thread.unreadCount} NEW
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 uppercase font-bold">{thread.threadType}</span>
                </div>
              </div>
            ))}
            {generalMessages.length === 0 && (
              <div className="p-12 text-center text-gray-400 italic">Support queue is empty</div>
            )}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center">
              <Button variant="outline" size="sm" onClick={() => navigate('/messages')} className="w-full">Open Support Center</Button>
            </div>
          </div>
        </Card>

        <Card title="Recent System Activity" className="shadow-lg border-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentCases.map(c => (
                  <tr key={c.id} className="hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">New Case Created</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{c.userName || c.userEmail}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDistanceToNow(new Date(c.createdAt))} ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminWorkspace
