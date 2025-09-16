import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Button, cases, interview, useToast, useTranslation } from '@l4h/shared-ui'

interface Case {
  id: string
  status: string
  createdAt: string
}

const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { error: showError } = useToast()

  // Fetch cases using React Query
  const { data: casesList = [], isLoading, error } = useQuery({
    queryKey: ['cases'],
    queryFn: cases.mine
  })

  const handleStartInterview = async () => {
    try {
      if (casesList.length === 0) {
        showError('You need to create a case first. Please contact us to get started.')
        return
      }
      
      // Use the first available case for the interview
      const activeCase = casesList[0]
      
      // Start the interview
      const response = await interview.start(activeCase.id)
      
      // Navigate to interview page with session ID
      navigate(`/interview?sessionId=${response.sessionId}`)
      
    } catch (error: any) {
      console.error('Failed to start interview:', error)
      showError(error.message || 'Failed to start interview. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400',
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400',
      completed: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
      closed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || statusClasses.pending}`}>
        {t(`case.status.${status}`)}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('dashboard:welcome')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('app:tagline')}
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <Card title={t('dashboard.quickLinks')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
            onClick={handleStartInterview}
          >
            <div className="text-lg mb-1">🎤</div>
            <div className="text-sm">{t('dashboard.interview')}</div>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
            onClick={() => navigate('/pricing')}
          >
            <div className="text-lg mb-1">💰</div>
            <div className="text-sm">{t('dashboard.pricing')}</div>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
            onClick={() => navigate('/appointments')}
          >
            <div className="text-lg mb-1">📅</div>
            <div className="text-sm">{t('dashboard.appointments')}</div>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
            onClick={() => navigate('/messages')}
          >
            <div className="text-lg mb-1">💬</div>
            <div className="text-sm">{t('dashboard.messages')}</div>
          </Button>
        </div>
      </Card>

      {/* Case Status */}
      <Card title={t('dashboard.caseStatus')}>
        {error ? (
          <div className="text-red-600 text-center py-4">
            {t('common.error')}
          </div>
        ) : casesList.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
            No cases found
          </div>
        ) : (
          <div className="space-y-4">
            {casesList.map((caseItem: Case) => (
              <div key={caseItem.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Case #{caseItem.id.slice(-8)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Created: {new Date(caseItem.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {getStatusBadge(caseItem.status)}
                  <Button size="sm" variant="outline">
                    {t('common.view')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export { DashboardPage }
export default DashboardPage
