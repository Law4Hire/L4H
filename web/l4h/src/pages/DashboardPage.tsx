import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Modal, cases, interview, useToast, useQuery } from '@l4h/shared-ui'

import NextSteps from '../components/NextSteps';
import { useAuth } from '../hooks/useAuth';

interface Case {
  id: string
  status: string
  createdAt: string
  visaTypeName?: string
  visaTypeCode?: string
  interviewSessionId?: string
  isVisaLockedByAttorney: boolean
}

interface VisaRecommendation {
  visaType: string
  rationale: string
  createdAt: string
  isLocked: boolean
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { error: showError } = useToast()
  const { user } = useAuth();
  const [showRecommendationModal, setShowRecommendationModal] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState<VisaRecommendation | null>(null)
  const [showResetWarning, setShowResetWarning] = useState(false)
  const [showLockWarning, setShowLockWarning] = useState(false)
  const [existingVisaType, setExistingVisaType] = useState<string | null>(null)

  // Fetch cases using React Query
  const { data: casesList = [], isLoading, error } = useQuery({
    queryKey: ['cases'],
    queryFn: cases.mine
  })

  const activeCase = casesList.length > 0 ? casesList[0] : undefined
  const hasQualifiedVisa = !!(activeCase?.visaTypeCode || (activeCase?.visaTypes && activeCase.visaTypes.length > 0))

  const handleStartInterview = async () => {
    try {
      if (casesList.length === 0) {
        showError('You need to create a case first. Please contact us to get started.')
        return
      }

      // Use the first available case for the interview
      const activeCase = casesList[0]

      // Check for attorney lock first
      if (activeCase.isVisaLockedByAttorney) {
          setShowLockWarning(true);
          return;
      }

      // Start the interview
      try {
        const response = await interview.start(activeCase.id)
        // Navigate to interview page with session ID and token
        navigate(`/interview?sessionId=${response.sessionId}&token=${response.sessionToken}`)
      } catch (authError) {
        console.warn('Authenticated interview start failed, falling back to anonymous:', authError)
        const response = await interview.startAnonymous()
        navigate(`/interview?sessionId=${response.sessionId}&token=${response.sessionToken}`)
      }

    } catch (error: any) {
      console.error('Failed to start interview:', error)
      showError(error.message || 'Failed to start interview. Please try again.')
    }
  }

  const handleProceedWithRetake = () => {
    setShowLockWarning(false);
    setShowResetWarning(true); // Show the original reset warning
  }
  
  const handleConfirmReset = async () => {
    try {
      const activeCase = casesList[0]

      // Reset visa type on the case
      await cases.resetVisaType(activeCase.id)

      // Close modal
      setShowResetWarning(false)
      setExistingVisaType(null)

      // Start the interview
      const response = await interview.start(activeCase.id)

      // Navigate to interview page with session ID
      navigate(`/interview?sessionId=${response.sessionId}`)

    } catch (error: any) {
      console.error('Failed to reset and start interview:', error)
      showError(error.message || 'Failed to start interview. Please try again.')
    }
  }

  const handleCancelReset = () => {
    setShowResetWarning(false)
    setExistingVisaType(null)
  }

  const handleViewCase = (caseId: string) => {
    // Navigate to the case detail page
    navigate(`/cases/${caseId}`)
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400',
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400',
      completed: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
      closed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || statusClasses.pending}`}>
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
      {/* Welcome Section */}
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

      {/* Quick Links */}
      <Card title={'Quick Links'}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
            onClick={handleStartInterview}
          >
            <div className="text-lg mb-1">🎤</div>
            <div className="text-sm">{'Start Interview'}</div>
          </Button>
          
          <Button
            variant="outline"
            className={`h-20 flex flex-col items-center justify-center ${!hasQualifiedVisa ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => hasQualifiedVisa ? navigate('/pricing') : showError('Please complete the interview to see qualified visa pricing.')}
            title={!hasQualifiedVisa ? 'Complete interview first' : 'View Pricing'}
          >
            <div className="text-lg mb-1">💰</div>
            <div className="text-sm">{'View Pricing'}</div>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center opacity-50 cursor-not-allowed"
            onClick={() => {}}
            disabled={true}
            title="Coming Soon"
          >
            <div className="text-lg mb-1">📅</div>
            <div className="text-sm">{'My Appointments'}</div>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
            onClick={() => navigate('/messages')}
          >
            <div className="text-lg mb-1">💬</div>
            <div className="text-sm">{'Messages'}</div>
          </Button>
        </div>
      </Card>

      {/* Case Status */}
      <Card title={'Case Status'}>
        {error ? (
          <div className="text-red-600 text-center py-4 bg-red-50 rounded-lg">
            <p className="font-bold">Error loading cases</p>
            <p className="text-sm">{(error as any)?.detail || (error as any)?.message || 'Please check your connection and try again.'}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => (queryClient as any).invalidateQueries({ queryKey: ['cases'] })}>Retry</Button>
          </div>
        ) : casesList.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
            No cases found
          </div>
        ) : (
          <div className="space-y-4">
            {casesList.map((caseItem: Case) => (
              <div key={caseItem.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Case #{caseItem.id.slice(-8)}
                  </div>
                  {caseItem.visaTypeName && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {caseItem.visaTypeName}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Created: {new Date(caseItem.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {getStatusBadge(caseItem.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewCase(caseItem.id)}
                  >
                    {'View'}
                  </Button>
                </div>
                {caseItem.visaTypeCode && user?.country && (
                  <NextSteps visaTypeCode={caseItem.visaTypeCode} countryCode={user.country} />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Visa Recommendation Modal */}
      <Modal
        isOpen={showRecommendationModal}
        onClose={() => setShowRecommendationModal(false)}
        title={'Your Visa Recommendation'}
      >
        {selectedRecommendation && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 mb-2">
                Congratulations!
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Based on your interview answers, we have a visa recommendation for you.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                Recommended Visa Type
              </h3>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                {selectedRecommendation.visaType}
              </div>
              <p className="text-blue-800 dark:text-blue-200">
                {selectedRecommendation.rationale}
              </p>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Recommendation generated on {new Date(selectedRecommendation.createdAt).toLocaleDateString()}
              {selectedRecommendation.isLocked && (
                <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
                  This recommendation has been finalized by our legal team.
                </span>
              )}
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowRecommendationModal(false)}
              >
                {'Close'}
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/pricing')}
              >
                View Service Packages
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Interview Warning Modal */}
      <Modal
        isOpen={showResetWarning}
        onClose={handleCancelReset}
        title="Existing Visa Type Suggestion"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            You already have a visa type suggestion: <strong className="text-blue-600 dark:text-blue-400">{existingVisaType}</strong>
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            This is a suggested starting point for you to work with our legal professionals.
            It is <strong>not</strong> a legal recommendation.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              ⚠️ <strong>Warning:</strong> Starting a new interview will reset your current visa type suggestion
              and any associated progress. Are you sure you want to continue?
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelReset}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReset}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reset and Start New Interview
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lock Warning Modal */}
      <Modal
        isOpen={showLockWarning}
        onClose={() => setShowLockWarning(false)}
        title="Interview Locked"
      >
        <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
                Your visa recommendation has been locked by an attorney.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
                Retaking the interview may have consequences for your case.
            </p>
            <div className="flex justify-end space-x-3 pt-4">
                <Button
                variant="outline"
                onClick={() => setShowLockWarning(false)}
                >
                Cancel
                </Button>
                <Button
                variant="primary"
                onClick={handleProceedWithRetake}
                className="bg-red-600 hover:bg-red-700 text-white"
                >
                Proceed Anyway
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  )
}

export { DashboardPage }
export default DashboardPage
