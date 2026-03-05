import React, { useState, useEffect } from 'react'
import { Card } from './Card'
import { Button } from './Button'
import { Spinner } from './Spinner'
import { fetchJson } from '../api-client'
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'

interface QuizQuestion {
  key: string
  text: string
  type: 'radio' | 'select'
  options: { value: string; label: string }[]
}

interface VisaMatch {
  visaCode: string
  visaName: string
  status: string
  score: number
}

interface FastPathResult {
  matchConfidence: number
  summary: string
  topMatches: VisaMatch[]
  recommendation: string
}

interface FastPathQuizProps {
  onComplete: (answers: Record<string, string>) => void
}

interface QuizSession {
  sessionId: string
  sessionToken: string
}

export const FastPathQuiz: React.FC<FastPathQuizProps> = ({ onComplete }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<FastPathResult | null>(null)
  const [session, setSession] = useState<QuizSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEvaluating, setIsEvaluating] = useState(false)

  useEffect(() => {
    const initQuiz = async () => {
      try {
        const [qs, sess] = await Promise.all([
          fetchJson<QuizQuestion[]>('/v1/fastpath/questions'),
          fetchJson<QuizSession>('/v1/fastpath/start', { method: 'POST' })
        ])
        setQuestions(qs)
        setSession(sess)
      } catch (err) {
        console.error('Failed to initialize quiz', err)
      } finally {
        setIsLoading(false)
      }
    }
    initQuiz()
  }, [])

  const handleAnswer = async (value: string) => {
    const currentQuestion = questions[currentStep]
    setAnswers(prev => ({ ...prev, [currentQuestion.key]: value }))

    // Persist answer to DB in background
    if (session) {
      try {
        await fetchJson('/v1/fastpath/save-answer', {
          method: 'POST',
          body: JSON.stringify({ 
            sessionId: session.sessionId, 
            key: currentQuestion.key, 
            value 
          })
        })
      } catch (err) {
        console.error('Failed to persist quiz answer', err)
      }
    }
  }

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      evaluateQuiz()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const evaluateQuiz = async () => {
    setIsEvaluating(true)
    try {
      const data = await fetchJson<FastPathResult>('/v1/fastpath/evaluate', {
        method: 'POST',
        body: JSON.stringify({ answers })
      })
      setResult(data)
    } catch (err) {
      console.error('Failed to evaluate quiz', err)
    } finally {
      setIsEvaluating(false)
    }
  }

  if (isLoading) return <div className="flex justify-center p-12"><Spinner /></div>

  if (result) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center animate-in fade-in duration-500">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2 dark:text-white">Your Preliminary Results</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{result.summary}</p>
        
        <div className="space-y-4 mb-8 text-left">
          {result.topMatches.map(match => (
            <div key={match.visaCode} className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-blue-900 dark:text-blue-100">{match.visaName}</span>
                <span className="text-xs font-semibold px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded text-blue-800 dark:text-blue-200">
                  {Math.round(match.score)}% Match
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Status: {match.status}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 italic mb-6">{result.recommendation}</p>
        
        <Button 
          size="lg" 
          className="w-full" 
          onClick={() => onComplete(answers, session?.sessionId)}
        >
          Continue to Full Application <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </Card>
    )
  }

  const currentQuestion = questions[currentStep]
  const currentAnswer = answers[currentQuestion.key] || ''
  const progress = ((currentStep + 1) / questions.length) * 100

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden shadow-2xl border-none">
      <div className="h-2 bg-gray-100 dark:bg-gray-800 w-full">
        <div 
          className="h-full bg-blue-600 transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="p-8 md:p-12">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">
          Question {currentStep + 1} of {questions.length}
        </span>
        <h3 className="text-2xl font-bold mb-8 dark:text-white leading-tight">
          {currentQuestion.text}
        </h3>

        <div className="space-y-3 mb-12">
          {currentQuestion.options.map(option => (
            <label 
              key={option.value}
              className={`
                flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                ${currentAnswer === option.value 
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-600/10' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800'}
              `}
            >
              <input 
                type="radio" 
                name={currentQuestion.key}
                value={option.value}
                checked={currentAnswer === option.value}
                onChange={(e) => handleAnswer(e.target.value)}
                className="sr-only"
              />
              <div className={`
                w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center
                ${currentAnswer === option.value ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-600'}
              `}>
                {currentAnswer === option.value && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className={`font-medium ${currentAnswer === option.value ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                {option.label}
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={prevStep} 
            disabled={currentStep === 0}
            className="text-gray-500"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          
          <Button 
            size="lg"
            onClick={nextStep} 
            disabled={!currentAnswer || isEvaluating}
            className="px-8"
          >
            {isEvaluating ? <Spinner size="sm" /> : (currentStep === questions.length - 1 ? 'See Results' : 'Next')} 
            {!isEvaluating && <ArrowRight className="ml-2 w-4 h-4" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}
