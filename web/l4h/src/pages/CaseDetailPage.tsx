import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button, Modal, cases, interview, useToast, useTranslation } from '@l4h/shared-ui'

interface CaseDetailData {
  id: string
  status: string
  lastActivityAt: string
  visaTypeCode?: string
  visaTypeName?: string
  packageCode?: string
  packageDisplayName?: string
  createdAt: string
  latestPriceSnapshot?: {
    id: number
    visaTypeCode: string
    packageCode: string
    countryCode: string
    total: number
    currency: string
    createdAt: string
  }
}

interface VisaRecommendation {
  visaType: string
  rationale: string
  createdAt: string
  isLocked: boolean
}

const CaseDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id: caseId } = useParams<{ id: string }>()
  const { error: showError, success: showSuccess } = useToast()
  const [showRecommendationModal, setShowRecommendationModal] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState<VisaRecommendation | null>(null)

  // Fetch case details
  const { data: caseDetail, isLoading: isCaseLoading, error: caseError } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => {
      if (!caseId) throw new Error('Case ID is required')
      return cases.get(caseId)
    },
    enabled: !!caseId
  })

  // Fetch interview history
  const { data: interviewHistory, isLoading: isInterviewLoading } = useQuery({
    queryKey: ['interview-history'],
    queryFn: interview.history
  })

  const handleStartInterview = async () => {
    try {
      if (!caseId) {
        showError('Case ID is required')
        return
      }

      // Start the interview
      const response = await interview.start(caseId)

      // Navigate to interview page with session ID
      navigate(`/interview?sessionId=${response.sessionId}`)

    } catch (error: any) {
      console.error('Failed to start interview:', error)
      showError(error.message || 'Failed to start interview. Please try again.')
    }
  }

  const handleViewRecommendation = async () => {
    try {
      if (interviewHistory?.latestRecommendation) {
        setSelectedRecommendation(interviewHistory.latestRecommendation)
        setShowRecommendationModal(true)
      } else {
        showError('No visa recommendation found. Please complete the interview first.')
      }
    } catch (error: any) {
      console.error('Failed to get recommendation:', error)
      showError(error.message || 'Failed to load recommendation. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400',
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400',
      completed: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
      closed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      inactive: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || statusClasses.pending}`}>
        {t(`case.status.${status}`)}
      </span>
    )
  }

  if (isCaseLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    )
  }

  if (caseError || !caseDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('case.detail.title')}
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            {t('common.back')}
          </Button>
        </div>
        <Card>
          <div className="text-red-600 text-center py-8">
            {t('case.detail.error')}
          </div>
        </Card>
      </div>
    )
  }

  const hasVisaType = !!caseDetail.visaTypeCode
  const hasRecommendation = !!interviewHistory?.latestRecommendation

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('case.detail.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Case #{caseDetail.id.slice(-8)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
        >
          {t('common.back')}
        </Button>
      </div>

      {/* Case Overview */}
      <Card title={t('case.detail.overview')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('case.detail.status')}
            </h3>
            {getStatusBadge(caseDetail.status)}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('case.detail.created')}
            </h3>
            <p className="text-gray-900 dark:text-gray-100">
              {new Date(caseDetail.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('case.detail.lastActivity')}
            </h3>
            <p className="text-gray-900 dark:text-gray-100">
              {new Date(caseDetail.lastActivityAt).toLocaleDateString()}
            </p>
          </div>
          {hasVisaType && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('case.detail.visaType')}
              </h3>
              <p className="text-gray-900 dark:text-gray-100">
                {caseDetail.visaTypeName} ({caseDetail.visaTypeCode})
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Interview Status */}
      <Card title={t('case.detail.interviewStatus')}>
        {!hasRecommendation ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('case.detail.interviewIncomplete')}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('case.detail.interviewIncompleteDescription')}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleStartInterview}
              disabled={isInterviewLoading}
            >
              {isInterviewLoading ? t('common.loading') : t('case.detail.startInterview')}
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="text-lg font-medium text-green-600 dark:text-green-400 mb-2">
                {t('case.detail.interviewComplete')}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('case.detail.interviewCompleteDescription')}
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={handleViewRecommendation}
              >
                {t('case.detail.viewRecommendation')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleStartInterview}
              >
                {t('case.detail.retakeInterview')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Package Information */}
      {caseDetail.packageCode && (
        <Card title={t('case.detail.servicePackage')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('case.detail.package')}
              </h3>
              <p className="text-gray-900 dark:text-gray-100">
                {caseDetail.packageDisplayName} ({caseDetail.packageCode})
              </p>
            </div>
            {caseDetail.latestPriceSnapshot && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t('case.detail.price')}
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {caseDetail.latestPriceSnapshot.total.toFixed(2)} {caseDetail.latestPriceSnapshot.currency}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Next Steps */}
      {!hasVisaType && (
        <Card title={t('case.detail.nextSteps')}>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">1</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('case.detail.step1Title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('case.detail.step1Description')}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">2</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('case.detail.step2Title')}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t('case.detail.step2Description')}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">3</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('case.detail.step3Title')}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t('case.detail.step3Description')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Visa Recommendation Modal */}
      <Modal
        isOpen={showRecommendationModal}
        onClose={() => setShowRecommendationModal(false)}
        title={t('case.detail.visaRecommendation')}
      >
        {selectedRecommendation && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 mb-2">
                {t('interview.complete.congratulations')}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('interview.complete.description')}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                {t('interview.recommended.visa')}
              </h3>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                {selectedRecommendation.visaType}
              </div>
              <p className="text-blue-800 dark:text-blue-200">
                {selectedRecommendation.rationale}
              </p>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {t('case.detail.recommendationGenerated')} {new Date(selectedRecommendation.createdAt).toLocaleDateString()}
              {selectedRecommendation.isLocked && (
                <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
                  {t('case.detail.recommendationLocked')}
                </span>
              )}
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowRecommendationModal(false)}
              >
                {t('common.close')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowRecommendationModal(false)
                  navigate('/pricing')
                }}
              >
                {t('case.detail.viewPackages')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export { CaseDetailPage }
export default CaseDetailPage