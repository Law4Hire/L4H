import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, Button, Input, interview, useToast, useTranslation } from '@l4h/shared-ui'

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

  useEffect(() => {
    if (!sessionId) {
      showError('Invalid session. Please start a new interview.')
      navigate('/dashboard')
      return
    }

    // Start the adaptive interview by getting the first question
    loadNextQuestion()
  }, [sessionId, navigate, showError])

  const loadNextQuestion = async () => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/interview/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId: sessionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get next question')
      }

      const data = await response.json()

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
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion?.key || '']: value
    }))
  }

  const handleNext = async () => {
    if (!sessionId || !currentQuestion) return

    const answer = answers[currentQuestion.key]
    if (currentQuestion.required && !answer) {
      showError('Please answer this question before continuing.')
      return
    }

    setIsLoading(true)
    try {
      // Submit answer to API
      await interview.answer({
        sessionId,
        stepNumber: questionCount + 1,
        questionKey: currentQuestion.key,
        answerValue: answer || ''
      })

      setQuestionCount(prev => prev + 1)

      // Load the next question
      await loadNextQuestion()

    } catch (error: any) {
      console.error('Failed to submit answer:', error)
      showError(error.message || 'Failed to submit answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartOver = () => {
    navigate('/dashboard')
  }

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
          {/* Adaptive progress indicator */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-800 mb-2">
              Adaptive Interview Progress
            </div>
            <div className="text-xs text-blue-600">
              Question {questionCount + 1} | {currentQuestion.remainingVisaTypes} visa types remaining
            </div>
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
              disabled={isLoading}
              loading={isLoading}
            >
              {t('interview.next', 'Next Question')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default InterviewPage