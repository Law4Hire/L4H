import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, Button, Input, interview, useToast, useTranslation } from '@l4h/shared-ui'

interface Question {
  key: string
  question: string
  type: 'text' | 'select' | 'radio'
  options?: string[]
  required?: boolean
}

const InterviewPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: showSuccess, error: showError } = useToast()
  
  const sessionId = searchParams.get('sessionId')
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [recommendation, setRecommendation] = useState<{
    visaType: string
    rationale: string
  } | null>(null)

  // Interview questions
  const questions: Question[] = [
    {
      key: 'purpose',
      question: t('interview.purpose', 'What is your primary purpose for visiting the United States?'),
      type: 'select',
      options: ['tourism', 'employment', 'study', 'business', 'family'],
      required: true
    },
    {
      key: 'hasEmployerSponsor',
      question: t('interview.hasEmployerSponsor', 'Do you have an employer sponsor in the United States?'),
      type: 'radio',
      options: ['yes', 'no'],
      required: true
    },
    {
      key: 'educationLevel',
      question: t('interview.educationLevel', 'What is your highest level of education?'),
      type: 'select',
      options: ['high_school', 'bachelor', 'master', 'phd', 'other'],
      required: true
    },
    {
      key: 'workExperience',
      question: t('interview.workExperience', 'How many years of work experience do you have?'),
      type: 'select',
      options: ['0-2', '3-5', '6-10', '10+'],
      required: true
    },
    {
      key: 'nationality',
      question: t('interview.nationality', 'What is your nationality?'),
      type: 'text',
      required: true
    }
  ]

  useEffect(() => {
    if (!sessionId) {
      showError('Invalid session. Please start a new interview.')
      navigate('/dashboard')
    }
  }, [sessionId, navigate, showError])

  const currentQuestion = questions[currentStep]
  const isLastStep = currentStep === questions.length - 1

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.key]: value
    }))
  }

  const handleNext = async () => {
    if (!sessionId) return

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
        stepNumber: currentStep + 1,
        questionKey: currentQuestion.key,
        answerValue: answer || ''
      })

      if (isLastStep) {
        // Complete the interview
        const completeResponse = await interview.complete(sessionId)
        setRecommendation({
          visaType: completeResponse.recommendationVisaType,
          rationale: completeResponse.rationale
        })
        setIsComplete(true)
        showSuccess('Interview completed! See your visa recommendation below.')
      } else {
        setCurrentStep(currentStep + 1)
      }
    } catch (error: any) {
      console.error('Failed to submit answer:', error)
      showError(error.message || 'Failed to submit answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
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

  return (
    <div className="max-w-2xl mx-auto">
      <Card title={t('interview.title', 'Visa Eligibility Interview')}>
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            {t('interview.progress', 'Question {{current}} of {{total}}', {
              current: currentStep + 1,
              total: questions.length
            })}
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
                  <option key={option} value={option}>
                    {t(`interview.options.${option}`, option)}
                  </option>
                ))}
              </select>
            )}

            {currentQuestion.type === 'radio' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <label key={option} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={currentQuestion.key}
                      value={option}
                      checked={answers[currentQuestion.key] === option}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>{t(`interview.options.${option}`, option)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              {t('interview.previous', 'Previous')}
            </Button>
            
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={isLoading}
              loading={isLoading}
            >
              {isLastStep 
                ? t('interview.complete', 'Complete Interview') 
                : t('interview.next', 'Next')
              }
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default InterviewPage