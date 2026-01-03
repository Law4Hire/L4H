import React, { useState, useEffect } from 'react'
import { Container, Card, Button, EmptyState, Modal, Input, useToast, useQuery, useMutation, useQueryClient, cases } from '@l4h/shared-ui'
import { appointments } from '@l4h/shared-ui'
import { Calendar, Plus, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Appointment {
  id: string
  caseId: string
  scheduledStart: string
  scheduledEnd: string
  durationMinutes: number
  notes?: string
  status: 'scheduled' | 'confirmed' | 'cancelled'
}

// Simple t function to replace i18n
const t = (key: string, options?: any) => options?.defaultValue || key;

export default function AppointmentsPage() {
  const { success, error } = useToast()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    caseId: '',
    scheduledAt: '',
    duration: 60,
    notes: ''
  })

  // Fetch appointments
  const { data: appointmentsList = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointments.list
  })

  // Fetch user's cases
  const { data: casesList = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: cases.mine
  })

  // Pre-select case ID when modal opens
  useEffect(() => {
    if (showCreateModal && casesList.length > 0 && !newAppointment.caseId) {
      setNewAppointment(prev => ({ ...prev, caseId: casesList[0].id }))
    }
  }, [showCreateModal, casesList])

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: appointments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setShowCreateModal(false)
      setNewAppointment({ caseId: '', scheduledAt: '', duration: 60, notes: '' })
      success('Appointment created successfully')
    },
    onError: (err) => {
      error('Error', err instanceof Error ? err.message : '')
    }
  })

  const handleCreateAppointment = () => {
    if (!newAppointment.caseId || !newAppointment.scheduledAt) {
      error('Error', t('validation.requiredFields', { defaultValue: 'Please fill in all required fields' }))
      return
    }

    // Validate that the scheduled date is in the future
    const scheduledDate = new Date(newAppointment.scheduledAt)
    const now = new Date()
    if (scheduledDate <= now) {
      error('Invalid Date', 'Appointment date must be in the future')
      return
    }

    createAppointmentMutation.mutate({
      ...newAppointment,
      scheduledAt: scheduledDate.toISOString()
    })
  }

  if (isLoading) {
    return (
      <Container>
        <Card>
          <EmptyState
            icon={Calendar}
            title={'Loading...'}
          />
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">{'My Appointments'}</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {'Create Appointment'}
        </Button>
      </div>

      {appointmentsList.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <EmptyState
            icon={Calendar}
            title={'No appointments found'}
            description={t('appointments.scheduleFirst', { defaultValue: 'Schedule your first appointment to get started' })}
            action={
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {'Create Appointment'}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointmentsList.map((appointment: Appointment) => (
            <Card key={appointment.id} className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="font-medium dark:text-white">
                      {format(new Date(appointment.scheduledStart), 'PPP p')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {appointment.durationMinutes} {'minutes'}
                    </span>
                  </div>

                  {appointment.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {appointment.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {appointment.meeting?.joinUrl && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => window.open(appointment.meeting.joinUrl, '_blank')}
                    >
                      Join Meeting
                    </Button>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : appointment.status === 'cancelled'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {t(`status.${appointment.status}`, { defaultValue: appointment.status })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Appointment Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={'Create Appointment'}
        size="md"
      >
        <div className="space-y-4">
          {/* Case ID hidden input (auto-populated) or selection if multiple */}
          {casesList.length > 1 ? (
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Case</label>
               <select
                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                 value={newAppointment.caseId}
                 onChange={(e) => setNewAppointment(prev => ({ ...prev, caseId: e.target.value }))}
               >
                 {casesList.map((c: any) => (
                   <option key={c.id} value={c.id}>
                     {c.visaTypeName || 'General Case'} ({c.status})
                   </option>
                 ))}
               </select>
             </div>
          ) : (
             <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm text-gray-600 dark:text-gray-400">
               Scheduling for your active case
             </div>
          )}

          <Input
            label={'Date & Time'}
            type="datetime-local"
            value={newAppointment.scheduledAt}
            onChange={(e) => setNewAppointment(prev => ({ ...prev, scheduledAt: e.target.value }))}
            min={new Date().toISOString().slice(0, 16)}
            required
          />

          <Input
            label={'minutes'}
            type="number"
            value={newAppointment.duration}
            onChange={(e) => setNewAppointment(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            helperText={t('appointments.durationHelper', { defaultValue: `Duration in ${'minutes'}` })}
          />

          <Input
            label={'Notes'}
            value={newAppointment.notes}
            onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
            multiline
            rows={3}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              {'Cancel'}
            </Button>
            <Button
              onClick={handleCreateAppointment}
              loading={createAppointmentMutation.isPending}
            >
              {'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}