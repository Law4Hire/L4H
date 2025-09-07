import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Button, apiClient, Case, formatDateTime } from '@l4h/shared-ui'

const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCases = async () => {
      try {
        const myCases = await apiClient.getMyCases()
        setCases(myCases)
      } catch (err) {
        setError(t('common.error'))
        console.error('Failed to load cases:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCases()
  }, [t])

  const handleStartInterview = async () => {
    try {
      const result = await apiClient.startInterview()
      window.open(result.interviewUrl, '_blank')
    } catch (err) {
      console.error('Failed to start interview:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || statusClasses.pending}`}>
        {t(`case.status.${status}`)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-gray-600">
            {t('app.tagline')}
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
            {error}
          </div>
        ) : cases.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No cases found
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">
                    Case #{caseItem.id.slice(-8)}
                  </div>
                  <div className="text-sm text-gray-500">
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
