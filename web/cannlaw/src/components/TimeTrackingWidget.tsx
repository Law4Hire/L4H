import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Input, Modal } from '@l4h/shared-ui'
import { Clock, Edit, Save, Plus } from '@l4h/shared-ui'
import { useAuth } from '../hooks/useAuth'

interface TimeEntry {
  id: number
  clientId: number
  clientName: string
  startTime: string
  endTime: string
  duration: number // in hours (0.1 increments)
  description: string
  notes: string
  hourlyRate: number
  billableAmount: number
  isBilled: boolean
  billedDate?: string
  createdAt: string
}

interface Client {
  id: number
  firstName: string
  lastName: string
}

interface TimeTrackingWidgetProps {
  clients?: Client[]
  onTimeEntryCreated?: (entry: TimeEntry) => void
}

const TimeTrackingWidget: React.FC<TimeTrackingWidgetProps> = ({ 
  clients = [], 
  onTimeEntryCreated 
}) => {
  useAuth() // For future authentication checks
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0) // in seconds
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchTimeEntries()
    checkActiveTimer()
  }, [])

  useEffect(() => {
    if (isTracking && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isTracking, startTime])

  const checkActiveTimer = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/time-tracking/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const activeTimer = await response.json()
        if (activeTimer) {
          setIsTracking(true)
          setStartTime(new Date(activeTimer.startTime))
          setSelectedClientId(activeTimer.clientId)
          setDescription(activeTimer.description || '')
          setNotes(activeTimer.notes || '')
        }
      }
    } catch (error) {
      console.error('Error checking active timer:', error)
    }
  }

  const fetchTimeEntries = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/time-tracking/entries', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const entries = await response.json()
        setTimeEntries(entries)
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
    }
  }

  const startTimer = async () => {
    if (!selectedClientId || !description.trim()) {
      alert('Please select a client and enter a description')
      return
    }

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/time-tracking/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          description: description.trim(),
          notes: notes.trim()
        })
      })

      if (response.ok) {
        const now = new Date()
        setStartTime(now)
        setIsTracking(true)
        setElapsedTime(0)
      } else {
        alert('Failed to start timer')
      }
    } catch (error) {
      console.error('Error starting timer:', error)
      alert('Failed to start timer')
    }
  }

  const stopTimer = async () => {
    if (!startTime) return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/time-tracking/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const entry = await response.json()
        setIsTracking(false)
        setStartTime(null)
        setElapsedTime(0)
        setDescription('')
        setNotes('')
        setSelectedClientId(null)
        
        // Refresh time entries
        await fetchTimeEntries()
        
        if (onTimeEntryCreated) {
          onTimeEntryCreated(entry)
        }
      } else {
        alert('Failed to stop timer')
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
      alert('Failed to stop timer')
    }
  }

  const pauseTimer = () => {
    setIsTracking(false)
  }

  const resumeTimer = () => {
    if (startTime) {
      setIsTracking(true)
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (hours: number): string => {
    return `${hours.toFixed(1)}h`
  }

  const roundToSixMinutes = (seconds: number): number => {
    const hours = seconds / 3600
    const sixMinuteIncrements = Math.ceil(hours / 0.1) // 0.1 hour = 6 minutes
    return sixMinuteIncrements * 0.1
  }

  const getCurrentBillableHours = (): number => {
    return roundToSixMinutes(elapsedTime)
  }

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setShowEntryModal(true)
  }

  const handleSaveEntry = async () => {
    if (!editingEntry) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/time-tracking/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: editingEntry.description,
          notes: editingEntry.notes,
          duration: editingEntry.duration
        })
      })

      if (response.ok) {
        await fetchTimeEntries()
        setShowEntryModal(false)
        setEditingEntry(null)
      } else {
        alert('Failed to update time entry')
      }
    } catch (error) {
      console.error('Error updating time entry:', error)
      alert('Failed to update time entry')
    } finally {
      setIsLoading(false)
    }
  }

  const getClientName = (clientId: number): string => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.firstName} ${client.lastName}`.trim() : 'Unknown Client'
  }

  return (
    <div className="space-y-6">
      {/* Active Timer */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Time Tracking</h2>
          {isTracking && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 font-medium">Recording</span>
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
            {formatTime(elapsedTime)}
          </div>
          {isTracking && (
            <div className="text-sm text-gray-600">
              Billable: {formatDuration(getCurrentBillableHours())} 
              <span className="text-xs text-gray-500 ml-1">(6-min increments)</span>
            </div>
          )}
        </div>

        {/* Client Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={selectedClientId || ''}
              onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : null)}
              disabled={isTracking}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              disabled={isTracking}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about this work..."
            rows={2}
            disabled={isTracking}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center space-x-3">
          {!isTracking ? (
            <Button
              variant="primary"
              onClick={startTime ? resumeTimer : startTimer}
              disabled={!selectedClientId || !description.trim()}
              className="flex items-center"
            >
              ▶️
              <span className="ml-2">{startTime ? 'Resume' : 'Start Timer'}</span>
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={pauseTimer} className="flex items-center">
                ⏸️
                <span className="ml-2">Pause</span>
              </Button>
              <Button variant="primary" onClick={stopTimer} className="flex items-center">
                ⏹️
                <span className="ml-2">Stop & Save</span>
              </Button>
            </>
          )}
        </div>
      </Card>  
    {/* Recent Time Entries */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Time Entries</h3>
            <Button variant="outline" size="sm" onClick={() => setShowEntryModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Manual Entry
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeEntries.slice(0, 10).map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.startTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.clientName || getClientName(entry.clientId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{entry.description}</p>
                      {entry.notes && (
                        <p className="text-gray-500 text-xs mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(entry.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${entry.billableAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.isBilled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.isBilled ? 'Billed' : 'Unbilled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEntry(entry)}
                      disabled={entry.isBilled}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {timeEntries.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No time entries yet</h3>
            <p className="text-gray-600">Start tracking time to see your entries here.</p>
          </div>
        )}
      </Card>

      {/* Edit Entry Modal */}
      <Modal
        open={showEntryModal}
        onClose={() => {
          setShowEntryModal(false)
          setEditingEntry(null)
        }}
        title={editingEntry ? 'Edit Time Entry' : 'Add Manual Time Entry'}
        size="md"
      >
        <div className="space-y-4">
          {editingEntry ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input
                  value={editingEntry.description}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    description: e.target.value
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editingEntry.notes}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    notes: e.target.value
                  })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (hours, in 0.1 increments)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editingEntry.duration}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    duration: parseFloat(e.target.value) || 0.1
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum billable increment is 0.1 hours (6 minutes)
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEntryModal(false)
                    setEditingEntry(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveEntry}
                  loading={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Manual time entry form will be implemented here.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default TimeTrackingWidget