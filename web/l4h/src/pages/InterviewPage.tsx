import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, Button, Input, Modal, interview, useToast, useTranslation } from '@l4h/shared-ui'

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
  const { t } = useTranslation()
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

  useEffect(() => {
    if (!sessionId) {
      showError('Invalid session. Please start a new interview.')
      navigate('/dashboard')
      return
    }

    // Ensure we have auth token before loading question
    const token = localStorage.getItem('jwt_token')
    if (!token) {
      showError('Please log in to continue.')
      navigate('/login')
      return
    }

    // Start the adaptive interview by getting the first question
    loadNextQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const loadNextQuestion = async () => {
    if (!sessionId) return

    try {
      const data = await interview.nextQuestion(sessionId)

      if (data.isComplete) {
        setCurrentQuestion(null)
        setIsComplete(true)
        setRecommendation({
          visaType: data.recommendation?.visaType || 'Unknown',
          rationale: data.recommendation?.rationale || 'Please consult with an immigration attorney.'
        })
        showSuccess('Interview completed! See your visa recommendation below.')
      } else {
        setCurrentQuestion(data.question)
      }
    } catch (error: any) {
      console.error('Failed to get next question:', error)
      showError(error.message || 'Failed to load question. Please try again.')
      throw error // Re-throw so handleNext can catch it
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
      showError('Please answer this question before continuing.')
      return
    }

    setIsLoading(true)
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
      showError(error.message || 'Failed to submit answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartOver = () => {
    navigate('/dashboard')
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

      showSuccess(`Visa type ${selectedVisaCode} selected! Interview complete.`)
      setShowVisaSelectModal(false)

      // Mark interview as complete and show recommendation
      setIsComplete(true)
      setRecommendation({
        visaType: selectedVisaCode,
        rationale: `You selected ${selectedVisaCode} as your preferred visa type. This is a suggested starting point for working with our legal professionals.`
      })
    } catch (error: any) {
      showError(error.message || 'Failed to select visa type. Please try again.')
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

  if (!sessionId) {
    return null
  }

  if (isComplete && recommendation) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card title={t('interview.complete.title', 'Interview Complete')}>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 mb-2">
                {t('interview.complete.congratulations', 'Congratulations!')}
              </div>
              <p className="text-gray-600">
                {t('interview.complete.description', 'Based on your answers, we have a visa recommendation for you.')}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Questions asked: {questionCount} | Adaptive system narrowed down from 88+ visa types
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                {t('interview.recommended.visa', 'Recommended Visa Type')}
              </h3>
              <div className="text-2xl font-bold text-blue-600 mb-4">
                {recommendation.visaType}
              </div>
              <p className="text-blue-800">
                {recommendation.rationale}
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={handleStartOver}
              >
                {t('interview.backToDashboard', 'Back to Dashboard')}
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/pricing')}
              >
                {t('interview.viewPackages', 'View Service Packages')}
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
        <Card title={t('interview.title', 'Visa Eligibility Interview')}>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your personalized interview...</p>
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
      <Card title={t('interview.title', 'Visa Eligibility Interview')}>
        <div className="space-y-6">
          {/* Adaptive progress indicator with hoverable visa chips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg group relative">
            <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Adaptive Interview Progress
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 cursor-help">
              Question {questionCount + 1} |{' '}
              <span className="underline decoration-dotted">
                {currentQuestion.remainingVisaTypes} visa types remaining
              </span>
            </div>

            {/* Remaining Visa Types - Show on hover */}
            {currentQuestion.remainingVisaCodes && currentQuestion.remainingVisaCodes.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible hover:opacity-100 hover:visible transition-all duration-200 z-10">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Click a visa type to select it directly:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.remainingVisaCodes.map((code) => (
                      <button
                        key={code}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('Visa clicked:', code)
                          handleVisaClick(code)
                        }}
                        className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title={`Select ${code} visa type`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">
              {currentQuestion.question}
            </h3>

            {currentQuestion.type === 'text' && (
              <Input
                value={answers[currentQuestion.key] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={t('interview.enterAnswer', 'Enter your answer')}
              />
            )}

            {currentQuestion.type === 'select' && (
              <select
                value={answers[currentQuestion.key] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('interview.selectOption', 'Select an option')}</option>
                {currentQuestion.options?.map((option) => (
                  <option key={option.value} value={option.value} title={option.description}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {currentQuestion.type === 'radio' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <label key={option.value} className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name={currentQuestion.key}
                      value={option.value}
                      checked={answers[currentQuestion.key] === option.value}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="w-4 h-4 text-blue-600 mt-1"
                    />
                    <div>
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

          <div className="flex justify-end pt-6">
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={isButtonDisabled}
              loading={isLoading}
            >
              {t('interview.next', 'Next Question')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Visa Selection Confirmation Modal */}
      {console.log('Modal isOpen:', showVisaSelectModal, 'selectedVisa:', selectedVisaCode)}
      <Modal
        isOpen={showVisaSelectModal}
        onClose={handleCancelVisaSelection}
        title="Confirm Visa Type Selection"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            You are selecting <strong className="text-blue-600 dark:text-blue-400">{selectedVisaCode}</strong> as your visa type suggestion.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            This will complete the interview and set this visa type as your suggested starting point for working with our legal professionals.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              ℹ️ <strong>Note:</strong> This is a suggestion only and is not a legal recommendation.
              Our legal professionals will review your case and provide official guidance.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelVisaSelection}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmVisaSelection}
              loading={isLoading}
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default InterviewPage