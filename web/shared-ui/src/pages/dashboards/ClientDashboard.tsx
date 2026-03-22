import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Modal, useToast, useQuery, useQueryClient } from '../../index'
import { cases, interview } from '../../api-client'
import { useAuth } from '../../hooks/useAuth'
import { NextSteps } from '../../components/NextSteps'

interface Case {
  id: string
  status: string
  createdAt: string
  visaTypeName?: string
  visaTypeCode?: string
  assignedStaffId?: number | null
  visaTypes?: Array<{ visaTypeCode: string }>
  interviewSessionId?: string
  isVisaLockedByAttorney: boolean
}

interface VisaRecommendation {
  visaType: string
  rationale: string
  createdAt: string
  isLocked: boolean
}

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError } = useToast()
  const { user } = useAuth();
  const queryClient = useQueryClient()
  const [showRecommendationModal, setShowRecommendationModal] = useState(false)
  const [selectedRecommendation] = useState<VisaRecommendation | null>(null)
  const [showResetWarning, setShowResetWarning] = useState(false)
  const [showLockWarning, setShowLockWarning] = useState(false)
  const [existingVisaType] = useState<string | null>(null)

  // Fetch cases using React Query
  const { data: casesList = [], isLoading, error } = useQuery({
    queryKey: ['cases'],
    queryFn: cases.mine
  })

  const hasQualifiedVisa = casesList.length > 0 && !!(casesList[0].visaTypeCode || (casesList[0].visaTypes && casesList[0].visaTypes.length > 0))
  const hasAssignedAttorney = !!casesList[0]?.assignedStaffId

  const handleStartInterview = async () => {
    try {
      if (casesList.length === 0) {
        showError('You need to create a case first. Please contact us to get started.')
        return
      }

      const activeCase = casesList[0]

      if (activeCase.isVisaLockedByAttorney) {
          setShowLockWarning(true);
          return;
      }

      try {
        const response = await interview.start(activeCase.id)
        navigate(`/interview?sessionId=${response.sessionId}&token=${response.sessionToken}`)
      } catch (authError) {
        const response = await interview.startAnonymous()
        navigate(`/interview?sessionId=${response.sessionId}&token=${response.sessionToken}`)
      }

    } catch (error: any) {
      showError(error.message || 'Failed to start interview. Please try again.')
    }
  }

  const handleProceedWithRetake = () => {
    setShowLockWarning(false);
    setShowResetWarning(true);
  }
  
  const handleConfirmReset = async () => {
    try {
      const activeCase = casesList[0]
      await cases.resetVisaType(activeCase.id)
      setShowResetWarning(false)
      const response = await interview.start(activeCase.id)
      navigate(`/interview?sessionId=${response.sessionId}`)
    } catch (error: any) {
      showError(error.message || 'Failed to start interview. Please try again.')
    }
  }

  const handleCancelReset = () => {
    setShowResetWarning(false)
  }

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      active: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400',
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400',
      completed: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
      closed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || statusClasses.pending}`}>
        {status}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">{'Loading...'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {'Welcome to your Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {'Your journey to the United States starts here'}
          </p>
        </div>
      </div>

      <Card title={'Quick Links'}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
            onClick={handleStartInterview}
          >
            <div className="text-lg mb-1">🤖</div>
            <div className="text-sm">{hasQualifiedVisa ? 'Redo Interview' : 'Start Interview'}</div>
          </Button>
          
          <Button
            variant="outline"
            className={`h-20 flex flex-col items-center justify-center ${!hasQualifiedVisa ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => hasQualifiedVisa ? navigate('/pricing') : showError('Please complete the interview to see qualified visa pricing.')}
          >
            <div className="text-lg mb-1">💰</div>
            <div className="text-sm">{'View Pricing'}</div>
          </Button>
          
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center opacity-50 cursor-not-allowed" disabled>
            <div className="text-lg mb-1">📅</div>
            <div className="text-sm">{'My Appointments'}</div>
          </Button>
          
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => navigate('/messages')}>
            <div className="text-lg mb-1">💬</div>
            <div className="text-sm">{'General Messages'}</div>
          </Button>
          {casesList.length > 0 && (
            <Button
              variant="outline"
              className={`h-20 flex flex-col items-center justify-center ${!hasAssignedAttorney ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => hasAssignedAttorney ? navigate(`/messages?caseId=${casesList[0].id}`) : showError('You can message your attorney after one has been assigned to your case.')}
            >
              <div className="text-lg mb-1">📨</div>
              <div className="text-sm">{'Message My Attorney'}</div>
            </Button>
          )}
        </div>
      </Card>

      <Card title={'Case Status'}>
        {error ? (
          <div className="text-red-600 text-center py-4">Error loading cases</div>
        ) : casesList.length === 0 ? (
          <div className="text-gray-500 py-4 text-center">No Assigned Cases</div>
        ) : (
          <div className="space-y-4">
            {casesList.map((caseItem: Case) => (
              <div key={caseItem.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Case #{caseItem.id.slice(-8)}</div>
                    {caseItem.visaTypeName && <div className="text-sm text-gray-500">{caseItem.visaTypeName}</div>}
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(caseItem.status)}
                    <Button size="sm" variant="outline" onClick={() => navigate(`/cases/${caseItem.id}`)}>{'View'}</Button>
                  </div>
                </div>
                {caseItem.visaTypeCode && user?.country && (
                  <NextSteps visaTypeCode={caseItem.visaTypeCode} countryCode={user.country} />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showResetWarning} onClose={handleCancelReset} title="Existing Visa Type Suggestion">
        <div className="space-y-4">
          <p>Starting a new interview will reset your current visa type suggestion. Are you sure?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleCancelReset}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmReset} className="bg-red-600 text-white">Reset and Start</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showLockWarning} onClose={() => setShowLockWarning(false)} title="Interview Locked">
        <div className="space-y-4">
            <p>Your visa recommendation has been locked by an attorney.</p>
            <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowLockWarning(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleProceedWithRetake} className="bg-red-600 text-white">Proceed Anyway</Button>
            </div>
        </div>
      </Modal>
    </div>
  )
}

export default ClientDashboard
