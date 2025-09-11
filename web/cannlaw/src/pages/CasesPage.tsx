import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, apiClient, type Case } from '@l4h/shared-ui'

const CasesPage: React.FC = () => {
  const { t } = useTranslation()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCases = async () => {
      try {
        // For staff, we'll use the same API but filter by assigned cases
        // In a real implementation, there would be a separate endpoint for staff cases
        const allCases = await apiClient.getMyCases()
        setCases(allCases)
      } catch (err) {
        setError(t('common.error'))
        console.error('Failed to load cases:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCases()
  }, [t])

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || statusClasses.pending}`}>
        {status}
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
      <Card title={t('cases.assigned')}>
        {error ? (
          <div className="text-red-600 text-center py-4">
            {error}
          </div>
        ) : cases.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            {t('cases.noCases')}
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('cases.caseNumber')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('cases.client')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('cases.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('cases.lastActivity')}
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">{t('cases.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{caseItem.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      User #{caseItem.userId.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(caseItem.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(caseItem.lastActivityAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">
                        {t('common.view')}
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        {t('common.edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default CasesPage
