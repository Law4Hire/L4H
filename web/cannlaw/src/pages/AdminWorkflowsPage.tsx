import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container, Card, Button, Modal, useToast } from '@l4h/shared-ui'
import { admin } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Eye, Clock, User } from 'lucide-react'

interface Workflow {
  id: string
  title: string
  description: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdBy: string
  createdAt: string
  changes: {
    added: string[]
    removed: string[]
    modified: string[]
  }
}

export default function AdminWorkflowsPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const queryClient = useQueryClient()
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [showDiffModal, setShowDiffModal] = useState(false)

  // Fetch workflows
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['admin-workflows'],
    queryFn: admin.workflows
  })

  // Approve workflow mutation
  const approveWorkflowMutation = useMutation({
    mutationFn: admin.approveWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workflows'] })
      success(t('common.success'), 'Workflow approved successfully')
    },
    onError: (err) => {
      showError(t('common.error'), err instanceof Error ? err.message : '')
    }
  })

  // Reject workflow mutation
  const rejectWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, reason }: { workflowId: string; reason: string }) =>
      admin.rejectWorkflow(workflowId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workflows'] })
      success(t('common.success'), 'Workflow rejected')
    },
    onError: (err) => {
      showError(t('common.error'), err instanceof Error ? err.message : '')
    }
  })

  const handleApprove = (workflowId: string) => {
    approveWorkflowMutation.mutate(workflowId)
  }

  const handleReject = (workflowId: string, reason: string) => {
    rejectWorkflowMutation.mutate({ workflowId, reason })
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800',
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

  const pendingWorkflows = workflows.filter((w: Workflow) => w.status === 'pending')

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
        <h1 className="text-2xl font-bold">{t('admin.workflows')}</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {pendingWorkflows.length} {t('admin.pendingApprovals')}
          </div>
        </div>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('admin.noWorkflows')}
            </h3>
            <p className="text-gray-600">
              {t('admin.noWorkflowsDescription')}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow: Workflow) => (
            <Card key={workflow.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {workflow.title}
                    </h3>
                    {getStatusBadge(workflow.status)}
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {workflow.description}
                  </p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{workflow.createdBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Changes Summary */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {workflow.changes.added.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        +{workflow.changes.added.length} {t('admin.added')}
                      </span>
                    )}
                    {workflow.changes.removed.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        -{workflow.changes.removed.length} {t('admin.removed')}
                      </span>
                    )}
                    {workflow.changes.modified.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ~{workflow.changes.modified.length} {t('admin.modified')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedWorkflow(workflow)
                      setShowDiffModal(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {workflow.status === 'pending' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(workflow.id)}
                        loading={approveWorkflowMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(workflow.id, 'Rejected by admin')}
                        loading={rejectWorkflowMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Diff Modal */}
      <Modal
        open={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        title={selectedWorkflow?.title}
        size="lg"
      >
        {selectedWorkflow && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{t('admin.changes')}</h4>
              
              {selectedWorkflow.changes.added.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-green-800 mb-2">
                    {t('admin.added')} ({selectedWorkflow.changes.added.length})
                  </h5>
                  <ul className="space-y-1">
                    {selectedWorkflow.changes.added.map((item, index) => (
                      <li key={index} className="text-sm text-green-700 bg-green-50 p-2 rounded">
                        + {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedWorkflow.changes.removed.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-red-800 mb-2">
                    {t('admin.removed')} ({selectedWorkflow.changes.removed.length})
                  </h5>
                  <ul className="space-y-1">
                    {selectedWorkflow.changes.removed.map((item, index) => (
                      <li key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                        - {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedWorkflow.changes.modified.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">
                    {t('admin.modified')} ({selectedWorkflow.changes.modified.length})
                  </h5>
                  <ul className="space-y-1">
                    {selectedWorkflow.changes.modified.map((item, index) => (
                      <li key={index} className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                        ~ {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDiffModal(false)}
              >
                {t('common.close')}
              </Button>
              {selectedWorkflow.status === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      handleApprove(selectedWorkflow.id)
                      setShowDiffModal(false)
                    }}
                    loading={approveWorkflowMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('admin.approve')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleReject(selectedWorkflow.id, 'Rejected after review')
                      setShowDiffModal(false)
                    }}
                    loading={rejectWorkflowMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('admin.reject')}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Container>
  )
}


