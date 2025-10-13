import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, Button, Input, Modal, interview, useToast, useTranslation } from '@l4h/shared-ui'
import { useRTL, RTLNumber } from '@l4h/shared-ui'

interface AdaptiveQuestion {
  key: string
  question: string
  type: 'text' | 'select' | 'radio'
  options: Array<{
    value: string
    label: string
    description?: string
  }>
  required: boolean
  remainingVisaTypes: number
  remainingVisaCodes: string[]
}

interface InterviewRecommendation {
  visaType: string
  rationale: string
}

const InterviewPage: React.FC = () => {
  const { t } = useTranslation(['interview', 'errors', 'common'])
  const { getClassName, textAlign } = useRTL()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: showSuccess, error: showError } = useToast()

  const sessionId = searchParams.get('sessionId')
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [recommendation, setRecommendation] = useState<InterviewRecommendation | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [showVisaSelectModal, setShowVisaSelectModal] = useState(false)
  const [selectedVisaCode, setSelectedVisaCode] = useState<string | null>(null)
  
  // Error handling state
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      showError(t('errors:interview.sessionInvalid'))
      navigate('/dashboard')
      return
    }

    // Ensure we have auth token before loading question
    const token = localStorage.getItem('jwt_token')
    if (!token) {
      showError(t('errors:auth.loginRequired'))
      navigate('/login')
      return
    }

    // Start the adaptive interview by getting the first question
    loadNextQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const loadNextQuestion = async (isRetry = false) => {
    if (!sessionId) return

    try {
      setError(null) // Clear any previous errors
      const data = await interview.nextQuestion(sessionId)

      if (data.isComplete) {
        setCurrentQuestion(null)
        setIsComplete(true)
        setRecommendation({
          visaType: data.recommendation?.visaType || 'Unknown',
          rationale: data.recommendation?.rationale || t('interview:completion.description')
        })
        showSuccess(t('interview:completion.congratulations'))
      } else {
        setCurrentQuestion(data.question)
        if (isRetry) {
          showSuccess(t('interview:messages.retrySuccess'))
          setRetryCount(0) // Reset retry count on success
        }
      }
    } catch (error: any) {
      console.error('Failed to get next question:', error)
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      
      if (!isRetry) {
        showError(errorMessage)
      }
      
      // Don't throw error, let component handle it gracefully
    }
  }

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion?.key || '']: value
    }))
  }

  const handleNext = async () => {
    if (!sessionId || !currentQuestion) {
      return
    }

    const answer = answers[currentQuestion.key]

    if (currentQuestion.required && !answer) {
      showError(t('interview:messages.selectOption'))
      return
    }

    setIsLoading(true)
    setError(null) // Clear any previous errors
    
    try {
      await interview.answer({
        sessionId,
        stepNumber: questionCount + 1,
        questionKey: currentQuestion.key,
        answerValue: answer || ''
      })

      setQuestionCount(prev => prev + 1)
      await loadNextQuestion()

    } catch (error: any) {
      console.error('Error in handleNext:', error)
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      showError(errorMessage)
      
      // If it's a session error, offer to restart
      if (error.status === 401 || error.status === 404) {
        setShowErrorModal(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (error: any): string => {
    if (error.status === 401) {
      return t('errors:auth.sessionExpired')
    } else if (error.status === 404) {
      return t('errors:interview.sessionInvalid')
    } else if (error.status === 500) {
      return t('errors:network.serverError')
    } else if (error.message?.includes('timeout')) {
      return t('errors:network.timeout')
    } else if (error.message?.includes('network')) {
      return t('errors:network.connectionFailed')
    } else {
      return error.message || t('errors:interview.loadingFailed')
    }
  }

  const handleRetry = async () => {
    if (retryCount >= 3) {
      setShowErrorModal(true)
      return
    }

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
      await loadNextQuestion(true)
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleStartOver = () => {
    // Clear all state
    setError(null)
    setRetryCount(0)
    setShowErrorModal(false)
    setCurrentQuestion(null)
    setAnswers({})
    setIsComplete(false)
    setRecommendation(null)
    setQuestionCount(0)
    
    navigate('/dashboard')
  }

  const handleRestartInterview = async () => {
    if (!sessionId) return
    
    setIsLoading(true)
    try {
      // Clear state first
      setError(null)
      setRetryCount(0)
      setShowErrorModal(false)
      setCurrentQuestion(null)
      setAnswers({})
      setQuestionCount(0)
      
      // Try to load first question (this will effectively restart)
      await loadNextQuestion()
      showSuccess(t('interview:messages.interviewRestarted'))
    } catch (error: any) {
      console.error('Failed to restart interview:', error)
      showError(t('errors:interview.restartFailed'))
      // If restart fails, redirect to dashboard
      setTimeout(() => navigate('/dashboard'), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVisaClick = (visaCode: string) => {
    console.log('handleVisaClick called with:', visaCode)
    setSelectedVisaCode(visaCode)
    setShowVisaSelectModal(true)
    console.log('Modal state should now be:', true)
  }

  const handleConfirmVisaSelection = async () => {
    if (!sessionId || !selectedVisaCode) return

    setIsLoading(true)
    try {
      await interview.selectVisaType(sessionId, selectedVisaCode)

      showSuccess(t('interview:completion.congratulations'))
      setShowVisaSelectModal(false)

      // Mark interview as complete and show recommendation
      setIsComplete(true)
      setRecommendation({
        visaType: selectedVisaCode,
        rationale: t('interview:completion.description')
      })
    } catch (error: any) {
      showError(error.message || t('errors:interview.submissionFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelVisaSelection = () => {
    setShowVisaSelectModal(false)
    setSelectedVisaCode(null)
  }

  // Memoize the button disabled state to prevent unnecessary recalculations
  const currentAnswer = currentQuestion ? answers[currentQuestion.key] : undefined
  const isButtonDisabled = useMemo(() => {
    if (!currentQuestion) return true
    return isLoading || (currentQuestion.required && !currentAnswer)
  }, [isLoading, currentQuestion, currentAnswer])

  // Error Recovery Component
  const ErrorRecoveryModal = () => (
    <Modal
      open={showErrorModal}
      onClose={() => setShowErrorModal(false)}
      title={t('interview:errorRecovery.title')}
    >
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          {t('interview:errorRecovery.description')}
        </p>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {retryCount < 3 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              {t('interview:errorRecovery.options.retry')}
            </h4>
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
              {t('interview:errorRecovery.retryDescription')}
            </p>
            {retryCount > 0 && (
              <p className="text-blue-600 dark:text-blue-400 text-xs">
                {t('interview:errorRecovery.retryAttempt', { count: retryCount })}
              </p>
            )}
            <Button
              variant="primary"
              onClick={handleRetry}
              loading={isRetrying}
              className="w-full mt-2"
            >
              {t('interview:errorRecovery.options.retry')}
            </Button>
          </div>
        )}

        {retryCount >= 3 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <p className="text-orange-800 dark:text-orange-200 text-sm">
              {t('interview:errorRecovery.maxRetriesReached')}
            </p>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('interview:errorRecovery.options.restart')}
          </h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
            {t('interview:errorRecovery.restartDescription')}
          </p>
          <Button
            variant="outline"
            onClick={handleRestartInterview}
            loading={isLoading}
            className="w-full"
          >
            {t('interview:errorRecovery.options.restart')}
          </Button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('interview:errorRecovery.options.dashboard')}
          </h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
            {t('interview:errorRecovery.dashboardDescription')}
          </p>
          <Button
            variant="outline"
            onClick={handleStartOver}
            className="w-full"
          >
            {t('interview:errorRecovery.options.dashboard')}
          </Button>
        </div>
      </div>
    </Modal>
  )

  if (!sessionId) {
    return null
  }

  if (isComplete && recommendation) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card title={t('interview:completion.title')}>
          <div className={getClassName("space-y-6", "interview-complete")}>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 mb-2">
                {t('interview:completion.congratulations')}
              </div>
              <p className="text-gray-600" style={{ textAlign: textAlign('center') as any }}>
                {t('interview:completion.description')}
              </p>
              <p className="text-sm text-gray-500 mt-2" style={{ textAlign: textAlign('center') as any }}>
                {t('interview:completion.stats', { count: questionCount })}
              </p>
            </div>

            <div className={getClassName("bg-blue-50 p-6 rounded-lg", "interview-recommendation")}>
              <h3 className="text-xl font-bold text-blue-900 mb-2" style={{ textAlign: textAlign() as any }}>
                {t('interview:completion.recommendedVisa')}
              </h3>
              <div className={getClassName(
                "text-2xl font-bold text-blue-600 mb-4",
                "interview-recommendation-title"
              )} style={{ textAlign: textAlign('center') as any }}>
                {recommendation.visaType}
              </div>
              <p className="text-blue-800" style={{ textAlign: textAlign() as any }}>
                {recommendation.rationale}
              </p>
            </div>

            <div className={getClassName(
              "flex justify-center space-x-4",
              "interview-actions rtl:space-x-reverse"
            )}>
              <Button
                variant="outline"
                onClick={handleStartOver}
              >
                {t('interview:completion.backToDashboard')}
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/pricing')}
              >
                {t('interview:completion.viewPackages')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading && !currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card title={t('interview:title')}>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('interview:loading')}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card title={t('interview:title')}>
        <div className="space-y-6">
          {/* Adaptive progress indicator with hoverable visa chips */}
          <div className={getClassName(
            "bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg group relative",
            "interview-progress-stats"
          )}>
            <div className={`text-sm text-blue-800 dark:text-blue-200 mb-2`} style={{ textAlign: textAlign() as any }}>
              {t('interview:progress.title')}
            </div>
            <div className={`text-xs text-blue-600 dark:text-blue-400 cursor-help interview-progress-text`} style={{ textAlign: textAlign() as any }}>
              {t('interview:progress.currentQuestion', { current: questionCount + 1 })} |{' '}
              <span className="underline decoration-dotted interview-remaining-visas">
                <RTLNumber value={currentQuestion.remainingVisaTypes} /> {t('interview:progress.remainingVisas', { count: currentQuestion.remainingVisaTypes })}
              </span>
            </div>

            {/* Remaining Visa Types - Show on hover */}
            {currentQuestion.remainingVisaCodes && currentQuestion.remainingVisaCodes.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible hover:opacity-100 hover:visible transition-all duration-200 z-10">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {t('interview:messages.selectVisaDirectly', 'Click a visa type to select it directly:')}
                  </div>
                  <div className={getClassName(
                    "flex flex-wrap gap-2",
                    "interview-visa-chips"
                  )}>
                    {currentQuestion.remainingVisaCodes.map((code) => (
                      <button
                        key={code}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('Visa clicked:', code)
                          handleVisaClick(code)
                        }}
                        className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors interview-visa-chip"
                        title={t('interview:messages.selectVisa', 'Select {{code}} visa type', { code })}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="interview-form">
            <h3 className={`text-lg font-semibold mb-4 interview-question`} style={{ textAlign: textAlign() as any }}>
              {currentQuestion.question}
            </h3>

            {currentQuestion.type === 'text' && (
              <Input
                value={answers[currentQuestion.key] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={t('interview:enterAnswer')}
              />
            )}

            {currentQuestion.type === 'select' && (
              <select
                value={answers[currentQuestion.key] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className={getClassName(
                  "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  "interview-select"
                )}
                style={{ textAlign: textAlign() as any }}
              >
                <option value="">{t('interview:selectOption')}</option>
                {currentQuestion.options?.map((option) => (
                  <option key={option.value} value={option.value} title={option.description}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {currentQuestion.type === 'radio' && (
              <div className={getClassName("space-y-3", "interview-radio-group")}>
                {currentQuestion.options?.map((option) => (
                  <label 
                    key={option.value} 
                    className={getClassName(
                      "flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50",
                      "interview-radio-option rtl:space-x-reverse rtl:flex-row-reverse"
                    )}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.key}
                      value={option.value}
                      checked={answers[currentQuestion.key] === option.value}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className={getClassName(
                        "w-4 h-4 text-blue-600 mt-1",
                        "rtl:ml-3 rtl:mr-0"
                      )}
                    />
                    <div style={{ textAlign: textAlign() as any }}>
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-600">{option.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Error display with retry option */}
          {error && !showErrorModal && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {t('interview:messages.error')}
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                  <div className="mt-3 flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      loading={isRetrying}
                      disabled={retryCount >= 3}
                    >
                      {t('common:retry')} {retryCount > 0 && `(${retryCount}/3)`}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowErrorModal(true)}
                    >
                      {t('interview:errorRecovery.options.restart')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6">
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={isButtonDisabled || !!error}
              loading={isLoading}
            >
              {t('interview:next')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Visa Selection Confirmation Modal */}
      <Modal
        open={showVisaSelectModal}
        onClose={handleCancelVisaSelection}
        title={t('interview:modal.confirmSelection')}
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {t('interview:modal.selectionDescription', { visaCode: selectedVisaCode })}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            {t('interview:modal.completionNote')}
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              ℹ️ <strong>{t('common:note')}:</strong> {t('interview:modal.legalDisclaimer')}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelVisaSelection}
            >
              {t('common:cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmVisaSelection}
              loading={isLoading}
            >
              {t('interview:modal.confirmSelection')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Error Recovery Modal */}
      <ErrorRecoveryModal />
    </div>
  )
}

export default InterviewPage