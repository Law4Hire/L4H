import React, { useState, useEffect } from 'react'
import { Card } from '@l4h/shared-ui'
import TimeTrackingWidget from '../../components/TimeTrackingWidget'
import { useClients } from '../../hooks/useClients'

interface Client {
  id: number
  firstName: string
  lastName: string
}

interface TimeStats {
  hoursToday: number
  hoursThisWeek: number
  unbilledAmount: number
}

const TimeTrackingPage: React.FC = () => {
  const { clients, isLoading: clientsLoading } = useClients()
  const [clientList, setClientList] = useState<Client[]>([])
  const [stats, setStats] = useState<TimeStats>({ hoursToday: 0, hoursThisWeek: 0, unbilledAmount: 0 })

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/time-tracking/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching time stats:', error)
    }
  }

  useEffect(() => {
    if (clients) {
      // Transform clients to the format expected by TimeTrackingWidget
      const transformedClients = clients.map(client => ({
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName
      }))
      setClientList(transformedClients)
    }
  }, [clients])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleTimeEntryCreated = (entry: any) => {
    console.log('New time entry created:', entry)
    // Refresh stats when a new entry is created
    fetchStats()
  }

  if (clientsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Time Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400">Track billable time in 6-minute increments</p>
      </div>

      {/* Time Tracking Widget */}
      <TimeTrackingWidget 
        clients={clientList}
        onTimeEntryCreated={handleTimeEntryCreated}
      />

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.hoursToday.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Hours Today</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.hoursThisWeek.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Hours This Week</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">${stats.unbilledAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Unbilled Amount</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TimeTrackingPage