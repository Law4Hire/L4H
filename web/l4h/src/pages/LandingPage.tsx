import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FastPathQuiz, Button } from '@l4h/shared-ui'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [showQuiz, setShowQuiz] = useState(false)

  const handleQuizComplete = (answers: Record<string, string>, sessionId?: string) => {
    // Store answers and sessionId in session storage to be picked up by the interview page
    sessionStorage.setItem('fastpath_answers', JSON.stringify(answers))
    if (sessionId) {
      sessionStorage.setItem('fastpath_session_id', sessionId)
    }
    navigate('/interview')
  }

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold dark:text-white mb-2">Check Your Eligibility</h2>
            <p className="text-gray-600 dark:text-gray-400">Answer a few questions to see which visa options might be right for you.</p>
          </div>
          <FastPathQuiz onComplete={handleQuizComplete} />
          <div className="mt-8 text-center">
            <button 
              onClick={() => setShowQuiz(false)}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      {/* Hero Section */}
      <main className="py-16 px-8 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Welcome to Your Immigration Partner
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Navigating US immigration is complex. We simplify it. Check your eligibility, manage your case, and get expert help, all in one place.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => setShowQuiz(true)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white border-none rounded-lg px-8 py-4 text-lg cursor-pointer transition-colors duration-200 shadow-lg shadow-blue-600/20"
            >
              Check My Eligibility
            </button>
            <button
              onClick={() => navigate('/visa-library')}
              className="bg-transparent hover:bg-blue-50 dark:hover:bg-gray-700 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-lg px-8 py-4 text-lg cursor-pointer transition-colors duration-200"
            >
              Explore Visa Options
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LandingPage