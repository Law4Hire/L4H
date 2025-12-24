import React, { useState, useEffect } from 'react'
import { Card, Button } from '@l4h/shared-ui'
import { useAuth } from '../../hooks/useAuth'
import { formatDistanceToNow, format } from 'date-fns'
import { MessageSquare, Calendar, User, Clock, Video, ExternalLink } from 'lucide-react'

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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [messages, setMessages] = useState<MessagePreview[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
  }, [])

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="bg-navy-900 rounded-lg p-8 text-white shadow-xl flex justify-between items-center overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 font-serif">
            Welcome back, {user?.name || 'Legal Professional'}!
          </h1>
          <p className="text-blue-200 text-lg">
            Manage your cases, clients, and legal team from your central command.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-navy-800 rounded-full opacity-50"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Cases</p>
              <p className="text-4xl font-bold text-navy-900 dark:text-white mt-1">{stats?.activeCases || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center text-blue-600">
              <Calendar size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-gold-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Appointments</p>
              <p className="text-4xl font-bold text-navy-900 dark:text-white mt-1">{stats?.upcomingAppointments || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gold-100 dark:bg-gold-900 rounded flex items-center justify-center text-gold-600">
              <Clock size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Monthly Billing</p>
              <p className="text-4xl font-bold text-navy-900 dark:text-white mt-1">
                ${(stats?.monthlyRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center text-green-600">
              <span className="text-xl font-bold">$</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          <Card title="Upcoming Appointments">
            <div className="p-6 pt-0">
              {appointments.length === 0 ? (
                <p className="text-gray-500 py-4 italic">No upcoming appointments scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-navy-900 rounded-lg border border-gray-100 dark:border-navy-800">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded bg-navy-100 dark:bg-navy-800 flex items-center justify-center text-navy-600 dark:text-gold-500">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-navy-900 dark:text-white">{app.clientName}</h4>
                          <p className="text-xs text-gray-500">{format(new Date(app.startTime), 'PPP')} @ {format(new Date(app.startTime), 'p')}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {app.joinUrl && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                            onClick={() => window.open(app.joinUrl, '_blank')}
                          >
                            <Video size={14} className="mr-1" /> Join Meeting
                          </Button>
                        )}
                        <Button size="sm" variant="outline">Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Messages Preview */}
          <Card title="Recent Messages">
            <div className="p-4 pt-0 space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No recent messages.</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="group cursor-pointer" onClick={() => navigate('/messages')}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold text-navy-900 dark:text-white group-hover:text-blue-600">{msg.sender}</span>
                      <span className="text-[10px] text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{msg.subject}</p>
                    <p className="text-[11px] text-gray-500 truncate">{msg.snippet}</p>
                  </div>
                ))
              )}
              <Button variant="ghost" size="sm" className="w-full text-blue-600 text-xs mt-2" onClick={() => navigate('/messages')}>
                View Inbox →
              </Button>
            </div>
          </Card>

          {/* Activity Feed */}
          <Card title="Activity Log">
            <div className="p-4 pt-0 space-y-4">
              {activity.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-xs text-navy-900 dark:text-white leading-relaxed">{item.message}</p>
                    <p className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(item.time))} ago</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default LegalDashboard