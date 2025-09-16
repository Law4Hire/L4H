import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@l4h/shared-ui'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['landing', 'common'])

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      {/* Hero Section */}
      <main className="py-16 px-8 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            {t('hero.title', { ns: 'landing' })}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {t('hero.description', { ns: 'landing' })}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/register')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white border-none rounded-lg px-8 py-4 text-lg cursor-pointer transition-colors duration-200"
            >
              {t('hero.startCase', { ns: 'landing' })}
            </button>
            <button
              onClick={() => navigate('/visa-library')}
              className="bg-transparent hover:bg-blue-50 dark:hover:bg-gray-700 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-lg px-8 py-4 text-lg cursor-pointer transition-colors duration-200"
            >
              {t('hero.exploreVisas', { ns: 'landing' })}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LandingPage