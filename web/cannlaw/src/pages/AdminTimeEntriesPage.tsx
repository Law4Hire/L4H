// import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container, Card, Button, useToast } from '@l4h/shared-ui'
import { admin } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react'

interface TimeEntry {
  id: string
  userId: string
  userName: string
  caseId: string
  caseTitle: string
  description: string
  hours: number
  date: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

export default function AdminTimeEntriesPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const queryClient = useQueryClient()

  // Fetch time entries
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['admin-time-entries'],
    queryFn: admin.timeEntries
  })

  // Approve time entry mutation
  const approveTimeEntryMutation = useMutation({
    mutationFn: admin.approveTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-time-entries'] })
      success(t('common.success'), 'Time entry approved')
    },
    onError: (err) => {
      showError(t('common.error'), err instanceof Error ? err.message : '')
    }
  })

  // Reject time entry mutation
  const rejectTimeEntryMutation = useMutation({
    mutationFn: ({ entryId, reason }: { entryId: string; reason: string }) =>
      admin.rejectTimeEntry(entryId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-time-entries'] })
      success(t('common.success'), 'Time entry rejected')
    },
    onError: (err) => {
      showError(t('common.error'), err instanceof Error ? err.message : '')
    }
  })

  const handleApprove = (entryId: string) => {
    approveTimeEntryMutation.mutate(entryId)
  }

  const handleReject = (entryId: string) => {
    rejectTimeEntryMutation.mutate({ entryId, reason: 'Rejected by admin' })
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusClasses[status as keyof typeof statusClasses] || statusClasses.pending
      }`}>
        {t(`status.${status}`)}
      </span>
    )
  }

  const pendingEntries = timeEntries.filter((entry: TimeEntry) => entry.status === 'pending')
  const totalHours = timeEntries.reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0)

  if (isLoading) {
    return (
      <Container>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">{t('common.loading')}</div>
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('admin.timeEntries')}</h1>
        <div className="flex items-center space-x-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{pendingEntries.length}</span> {t('admin.pendingApprovals')}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{totalHours.toFixed(1)}</span> {t('admin.totalHours')}
          </div>
        </div>
      </div>

      {timeEntries.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('admin.noTimeEntries')}
            </h3>
            <p className="text-gray-600">
              {t('admin.noTimeEntriesDescription')}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {timeEntries.map((entry: TimeEntry) => (
            <Card key={entry.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {entry.caseTitle}
                    </h3>
                    {getStatusBadge(entry.status)}
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {entry.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{entry.userName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{entry.hours} {t('admin.hours')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">
                        {t('admin.submitted')}: {new Date(entry.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {entry.status === 'pending' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApprove(entry.id)}
                      loading={approveTimeEntryMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReject(entry.id)}
                      loading={rejectTimeEntryMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {timeEntries.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('admin.totalEntries')}</p>
                <p className="text-2xl font-semibold text-gray-900">{timeEntries.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('admin.approvedEntries')}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {timeEntries.filter((e: TimeEntry) => e.status === 'approved').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('admin.pendingEntries')}</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingEntries.length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Container>
  )
}


