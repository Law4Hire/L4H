import React, { useState, useEffect } from 'react'
import { Card, Button, Modal, useToast } from '@l4h/shared-ui'
import { Calendar, Clock, User, Edit2, History } from 'lucide-react'
import { format } from 'date-fns'

interface AdminAppointment {
  id: string
  caseId: string
  clientName: string
  clientEmail: string
  staffUserId: string | null
  staffEmail: string | null
  startTime: string
  durationMinutes: number
  timeZone: string
  status: string
  type: string | null
  notes: string | null
  createdAt: string
  confirmedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  hasMeeting: boolean
  meetingJoinUrl: string | null
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

interface AssignmentHistoryEntry {
  timestamp: string
  action: string
  previousStaffEmail: string | null
  staffEmail: string
  performedByUserId: string
  reason: string | null
}

const AdminAppointmentsPage: React.FC = () => {
  const { success, error } = useToast()
  const [appointments, setAppointments] = useState<AdminAppointment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<AdminAppointment | null>(null)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [reassignReason, setReassignReason] = useState('')
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryEntry[]>([])
  const [filterStatus, setFilterStatus] = useState('')

  const loadAppointments = React.useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/admin/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to load appointments')
      }
      const data = await response.json()
      setAppointments(data)
    } catch (err) {
      console.error('Error loading appointments:', err)
      error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [error])

  const loadUsers = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to load users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error('Error loading users:', err)
      error('Failed to load users')
    }
  }, [error])

  useEffect(() => {
    loadAppointments()
    loadUsers()
  }, [loadAppointments, loadUsers])

  const handleOpenReassignModal = (appointment: AdminAppointment) => {
    setSelectedAppointment(appointment)
    setSelectedStaffId(appointment.staffUserId || '')
    setReassignReason('')
    setShowReassignModal(true)
  }

  const handleReassign = async () => {
    if (!selectedAppointment || !selectedStaffId) {
      error('Please select a staff member')
      return
    }

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/appointments/${selectedAppointment.id}/reassign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newStaffUserId: selectedStaffId,
          reason: reassignReason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to reassign appointment')
      }

      success('Appointment reassigned successfully')
      setShowReassignModal(false)
      loadAppointments()
    } catch (err: any) {
      console.error('Error reassigning appointment:', err)
      error(err.message || 'Failed to reassign appointment')
    }
  }

  const handleViewHistory = async (appointment: AdminAppointment) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/appointments/${appointment.id}/assignment-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to load assignment history')

      const data = await response.json()
      setAssignmentHistory(data)
      setSelectedAppointment(appointment)
      setShowHistoryModal(true)
    } catch (err) {
      console.error('Error loading assignment history:', err)
      error('Failed to load assignment history')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      scheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      rescheduling: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || statusClasses.scheduled}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            View and manage all client appointments
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduling">Rescheduling</option>
          </select>
          <Button onClick={loadAppointments}>Refresh</Button>
        </div>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card className="p-12 text-center dark:bg-gray-800 dark:border-gray-700">
          <Calendar className="mx-auto mb-4 text-gray-400 dark:text-gray-500" size={48} />
          <p className="text-gray-500 dark:text-gray-400">No appointments found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Client Info */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {appointment.clientName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.clientEmail}</p>
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{format(new Date(appointment.startTime), 'PPP p')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{appointment.durationMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>
                        {appointment.staffEmail ? (
                          <span className="font-medium">{appointment.staffEmail}</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">Unassigned</span>
                        )}
                      </span>
                    </div>
                    <div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>

                  {/* Notes */}
                  {appointment.notes && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    </div>
                  )}

                  {/* Meeting Link */}
                  {appointment.hasMeeting && appointment.meetingJoinUrl && (
                    <div className="mb-3">
                      <a
                        href={appointment.meetingJoinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Join Meeting →
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReassignModal(appointment)}
                    className="flex items-center gap-2 dark:border-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                    Reassign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory(appointment)}
                    className="flex items-center gap-2 dark:border-gray-600"
                  >
                    <History className="w-4 h-4" />
                    History
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reassign Modal */}
      <Modal
        open={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign Appointment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Assignment
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedAppointment?.staffEmail || 'Unassigned'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reassign To *
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select staff member...</option>
              {users.filter(u => u.id !== selectedAppointment?.staffUserId).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Explain why this appointment is being reassigned..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowReassignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassign}>
              Reassign
            </Button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Assignment History"
      >
        <div className="space-y-4">
          {assignmentHistory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No assignment history found
            </p>
          ) : (
            <div className="space-y-3">
              {assignmentHistory.map((entry, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{entry.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(entry.timestamp), 'PPP p')}
                      </p>
                    </div>
                  </div>

                  {entry.previousStaffEmail && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">From:</span> {entry.previousStaffEmail}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">To:</span> {entry.staffEmail}
                  </p>

                  {entry.reason && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <span className="font-medium">Reason:</span> {entry.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowHistoryModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminAppointmentsPage
