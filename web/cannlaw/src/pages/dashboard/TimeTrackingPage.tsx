import React, { useState, useEffect } from 'react'
import { Card, fetchJson } from '@l4h/shared-ui'
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
      const data = await fetchJson<TimeStats>('/v1/time-tracking/stats')
      setStats(data)
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
      <div className="flex justify-center items-center min-h-screen dark:bg-navy-950">
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
        <Card className="p-6 bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.hoursToday.toFixed(1)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hours Today</p>
          </div>
        </Card>
        <Card className="p-6 bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.hoursThisWeek.toFixed(1)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hours This Week</p>
          </div>
        </Card>
        <Card className="p-6 bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">${stats.unbilledAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Unbilled Amount</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TimeTrackingPage