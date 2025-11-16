import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, Modal, interview, useToast, useTranslation } from '@l4h/shared-ui'
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

interface VisaEvaluation {
  visaTypeId: number
  visaCode: string
  visaName: string
  status: string
  matchScore: number
  rank: number
  explanation: string
  missingInformation: string[]
  requiredDocuments: string[]
  keyBenefits: string[]
  isUserSelected: boolean
  isAttorneyLocked: boolean
  lockReason?: string
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
  const [remainingVisas, setRemainingVisas] = useState<number>(0)

  // Results state
  const [isComplete, setIsComplete] = useState(false)
  const [evaluations, setEvaluations] = useState<VisaEvaluation[]>([])
  const [selectedVisaId, setSelectedVisaId] = useState<number | null>(null)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)

  // Registration form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

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
      setRemainingVisas(response.remainingVisasCount)

      if (response.isComplete) {
        // Interview is complete, get evaluations
        await completeInterview()
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

  const completeInterview = async () => {
    if (!sessionToken) return

    try {
      setIsLoading(true)
      const response = await interview.complete(sessionToken)

      setEvaluations(response.evaluations)
      setIsComplete(true)
      setCurrentQuestion(null)

      showSuccess(t('interview:completed'))
    } catch (error: any) {
      console.error('Failed to complete interview:', error)
      showError(error.message || t('errors:interview.completeFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVisaSelection = async (visaId: number) => {
    if (!sessionToken) return

    try {
      setSelectedVisaId(visaId)
      await interview.selectVisa(sessionToken, visaId)
      showSuccess(t('interview:visaSelected'))
    } catch (error: any) {
      console.error('Failed to select visa:', error)
      showError(error.message || t('errors:interview.selectFailed'))
    }
  }

  const handleRegister = async () => {
    if (!sessionToken || !email || !password || !firstName || !lastName) {
      showError(t('errors:registration.allFieldsRequired'))
      return
    }

    try {
      setIsLoading(true)
      const response = await interview.registerWithInterview({
        anonymousToken: sessionToken,
        email,
        password,
        firstName,
        lastName
      })

      if (response.success) {
        showSuccess(t('registration:success'))
        navigate('/dashboard')
      } else {
        showError(response.errorMessage || t('errors:registration.failed'))
      }
    } catch (error: any) {
      console.error('Failed to register:', error)
      showError(error.message || t('errors:registration.failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null

    return (
      <Card className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              {t('interview:question')} {questionCount}
            </span>
            {remainingVisas > 0 && (
              <span className="text-sm text-blue-600">
                {remainingVisas} {t('interview:visasRemaining')}
              </span>
            )}
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
            {t('common:continue')}
          </Button>
        </div>
      </Card>
    )
  }

  const renderResults = () => {
    if (!isComplete || evaluations.length === 0) return null

    // Filter to show only Eligible and Potential visas
    const relevantEvaluations = evaluations.filter(
      (e) => e.status === 'Eligible' || e.status === 'Potential'
    )

    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('interview:resultsTitle')}</h1>
          <p className="text-gray-600 mb-4">
            {t('interview:resultsDescription', { count: relevantEvaluations.length })}
          </p>
        </Card>

        <div className="space-y-4">
          {relevantEvaluations.map((evaluation) => (
            <Card
              key={evaluation.visaTypeId}
              className={`p-6 cursor-pointer transition-all ${
                selectedVisaId === evaluation.visaTypeId
                  ? 'border-2 border-blue-500 shadow-lg'
                  : 'border border-gray-200 hover:shadow-md'
              } ${evaluation.isAttorneyLocked ? 'bg-yellow-50' : ''}`}
              onClick={() => handleVisaSelection(evaluation.visaTypeId)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{evaluation.visaName}</h3>
                  <span className="text-sm text-gray-500">{evaluation.visaCode}</span>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(evaluation.matchScore)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {evaluation.status === 'Eligible' ? '✓ Eligible' : '~ Potential'}
                  </div>
                  {evaluation.isAttorneyLocked && (
                    <div className="text-xs text-yellow-700 font-semibold mt-1">
                      🔒 Recommended by Attorney
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-3">{evaluation.explanation}</p>

              {evaluation.keyBenefits.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {t('interview:keyBenefits')}:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {evaluation.keyBenefits.slice(0, 3).map((benefit, i) => (
                      <li key={i}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.missingInformation.length > 0 && (
                <div className="text-sm text-orange-600">
                  <p className="font-semibold">{t('interview:missingInfo')}:</p>
                  <ul className="list-disc list-inside">
                    {evaluation.missingInformation.map((info, i) => (
                      <li key={i}>{info}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>

        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">{t('interview:nextSteps')}</h3>
          <p className="text-gray-600 mb-4">
            {selectedVisaId
              ? t('interview:createAccountSelected')
              : t('interview:selectVisaFirst')}
          </p>

          <Button
            onClick={() => setShowRegistrationModal(true)}
            disabled={!selectedVisaId}
            size="large"
            className="w-full"
          >
            {t('interview:createAccount')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {!isComplete && currentQuestion && renderQuestion()}
      {isComplete && renderResults()}

      {/* Registration Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        title={t('registration:createAccount')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('registration:firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label={t('registration:lastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label={t('registration:email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label={t('registration:password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowRegistrationModal(false)}
            >
              {t('common:cancel')}
            </Button>

            <Button
              onClick={handleRegister}
              disabled={isLoading || !email || !password || !firstName || !lastName}
              isLoading={isLoading}
            >
              {t('registration:register')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default InterviewPage
