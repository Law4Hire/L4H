import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, interview, useToast, useTranslation } from '@l4h/shared-ui'
import { useRTL } from '@l4h/shared-ui'

interface Question {
  key: string
  text: string
  category: string
  inputType: string
  options: Array<{ value: string; label: string }>
  isRequired: boolean
  order: number
}

interface EvaluationSummary {
  visaType: string
  visaName: string
  status: string
  matchScore: number
  explanation: string
  strengths: string[]
  concerns: string[]
  nextSteps: string[]
  showContactForm: boolean
}

const InterviewPage: React.FC = () => {
  const { t } = useTranslation(['interview', 'errors', 'common'])
  const { getClassName, textAlign } = useRTL()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()

  // Session state
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Interview flow state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [questionCount, setQuestionCount] = useState(0)

  // Evaluation state (shown after checklist completion)
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationSummary | null>(null)

  // Checklist progress
  const [checklistProgress, setChecklistProgress] = useState<number | null>(null)
  const [checklistTotal, setChecklistTotal] = useState<number | null>(null)

  // Completion state
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    startInterview()
  }, [])

  const startInterview = async () => {
    try {
      setIsLoading(true)
      const response = await interview.startAnonymous()

      setSessionToken(response.sessionToken)
      setCurrentQuestion(response.firstQuestion)
      setQuestionCount(1)

      showSuccess(t('interview:started'))
    } catch (error: any) {
      console.error('Failed to start interview:', error)
      showError(error.message || t('errors:interview.startFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!sessionToken || !currentQuestion || !currentAnswer.trim()) {
      showError(t('errors:interview.answerRequired'))
      return
    }

    try {
      setIsLoading(true)
      const response = await interview.submitAnswer(
        sessionToken,
        currentQuestion.key,
        currentAnswer
      )

      setQuestionCount(response.totalAnswers)

      // Check if evaluation was returned (after checklist completion)
      if (response.evaluation && !currentEvaluation) {
        setCurrentEvaluation(response.evaluation)
        showSuccess(`Great! You may be eligible for ${response.evaluation.visaName}`)
      }

      // Update checklist progress if provided
      if (response.checklistProgress !== undefined) {
        setChecklistProgress(response.checklistProgress)
      }
      if (response.checklistTotal !== undefined) {
        setChecklistTotal(response.checklistTotal)
      }

      if (response.isComplete) {
        // Interview is complete
        setIsComplete(true)
        setCurrentQuestion(null)
        showSuccess(t('interview:completed'))
      } else if (response.nextQuestion) {
        setCurrentQuestion(response.nextQuestion)
        setCurrentAnswer('')
      }
    } catch (error: any) {
      console.error('Failed to submit answer:', error)
      showError(error.message || t('errors:interview.submitFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const renderEvaluationBanner = () => {
    if (!currentEvaluation) return null

    return (
      <Card className="max-w-2xl mx-auto mb-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {Math.round(currentEvaluation.matchScore)}%
            </div>
          </div>

          <div className="flex-grow">
            <h3 className="text-xl font-bold text-blue-900 mb-1">
              {currentEvaluation.visaName}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {currentEvaluation.visaType} - {currentEvaluation.status}
            </p>
            <p className="text-gray-700 mb-3">
              {currentEvaluation.explanation}
            </p>

            {currentEvaluation.strengths && currentEvaluation.strengths.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-semibold text-green-700 mb-1">Strengths:</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {currentEvaluation.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentEvaluation.concerns && currentEvaluation.concerns.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-semibold text-orange-700 mb-1">Important Notes:</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {currentEvaluation.concerns.map((concern, i) => (
                    <li key={i}>{concern}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm text-blue-800 font-medium mt-3">
              Please continue with your contact information below to receive your full evaluation.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null

    const isChecklistQuestion = currentQuestion.key.startsWith('checklist_')

    return (
      <Card className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              {isChecklistQuestion && checklistProgress && checklistTotal
                ? `Checklist Question ${checklistProgress} of ${checklistTotal}`
                : `Question ${questionCount}`}
            </span>
          </div>

          <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>

          {currentQuestion.inputType === 'select' || currentQuestion.inputType === 'radio' ? (
            <div className="space-y-2">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCurrentAnswer(option.value)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                    currentAnswer === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <Input
              type="text"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={t('interview:typeAnswer')}
              className="w-full"
            />
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            disabled={isLoading}
          >
            {t('common:cancel')}
          </Button>

          <Button
            onClick={submitAnswer}
            disabled={isLoading || !currentAnswer.trim()}
            isLoading={isLoading}
          >
            {t('common:submit')}
          </Button>
        </div>
      </Card>
    )
  }

  const renderCompletionMessage = () => {
    if (!isComplete) return null

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Interview Complete!
            </h1>
            <p className="text-gray-600 mb-4">
              Thank you for completing the interview. We will review your information and contact you shortly.
            </p>
          </div>

          {currentEvaluation && (
            <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="text-lg font-semibold mb-2">Your Recommended Visa:</h3>
              <p className="text-2xl font-bold text-blue-700 mb-2">{currentEvaluation.visaName}</p>
              <p className="text-gray-700 mb-3">{currentEvaluation.explanation}</p>
              <p className="text-sm text-gray-600">
                Match Score: <span className="font-bold text-blue-600">{Math.round(currentEvaluation.matchScore)}%</span>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/dashboard')}
              size="large"
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {!isComplete && renderEvaluationBanner()}
      {!isComplete && currentQuestion && renderQuestion()}
      {isComplete && renderCompletionMessage()}
    </div>
  )
}

export default InterviewPage
