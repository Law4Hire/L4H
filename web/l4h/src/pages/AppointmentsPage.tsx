import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container, Card, Button, EmptyState, Modal, Input, useToast } from '@l4h/shared-ui'
import { appointments } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import { Calendar, Plus, Clock, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'

interface Appointment {
  id: string
  caseId: string
  scheduledAt: string
  duration: number
  notes?: string
  status: 'scheduled' | 'confirmed' | 'cancelled'
}

export default function AppointmentsPage() {
  const { t } = useTranslation()
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

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: appointments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setShowCreateModal(false)
      setNewAppointment({ caseId: '', scheduledAt: '', duration: 60, notes: '' })
      success(t('appointments.appointmentCreated'))
    },
    onError: (err) => {
      error(t('common.error'), err instanceof Error ? err.message : '')
    }
  })

  const handleCreateAppointment = () => {
    if (!newAppointment.caseId || !newAppointment.scheduledAt) {
      error(t('common.error'), 'Please fill in all required fields')
      return
    }

    createAppointmentMutation.mutate(newAppointment)
  }

  if (isLoading) {
    return (
      <Container>
        <Card>
          <EmptyState
            icon={Calendar}
            title={t('common.loading')}
          />
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('appointments.title')}</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('appointments.createAppointment')}
        </Button>
      </div>

      {appointmentsList.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title={t('appointments.noAppointments')}
            description="Schedule your first appointment to get started"
            action={
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('appointments.createAppointment')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointmentsList.map((appointment: Appointment) => (
            <Card key={appointment.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="font-medium">
                      {format(new Date(appointment.scheduledAt), 'PPP p')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {appointment.duration} {t('appointments.duration')}
                    </span>
                  </div>

                  {appointment.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      {appointment.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800'
                      : appointment.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {t(`status.${appointment.status}`)}
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
        title={t('appointments.createAppointment')}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t('appointments.caseId')}
            value={newAppointment.caseId}
            onChange={(e) => setNewAppointment(prev => ({ ...prev, caseId: e.target.value }))}
            required
          />

          <Input
            label={t('appointments.date')}
            type="datetime-local"
            value={newAppointment.scheduledAt}
            onChange={(e) => setNewAppointment(prev => ({ ...prev, scheduledAt: e.target.value }))}
            required
          />

          <Input
            label={t('appointments.duration')}
            type="number"
            value={newAppointment.duration}
            onChange={(e) => setNewAppointment(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            helperText="Duration in minutes"
          />

          <Input
            label={t('appointments.notes')}
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
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateAppointment}
              loading={createAppointmentMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}

