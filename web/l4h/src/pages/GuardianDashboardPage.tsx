import React, { useState, useEffect } from 'react'
import { Card, Button, useToast, useTranslation } from '@l4h/shared-ui'
import { useQuery } from '@tanstack/react-query'

interface ChildCaseDetails {
  id: string
  status: string
  createdAt: string
  visaType: string
}

interface ChildCaseInfo {
  childName: string
  childUserId: string
  cases: ChildCaseDetails[]
}

const GuardianDashboardPage: React.FC = () => {
  const { t } = useTranslation(['common', 'dashboard'])
  const { success, error: showError } = useToast()

  // Fetch children's cases for the guardian
  const { data: childrenCases = [], isLoading, error, refetch } = useQuery({
    queryKey: ['guardian-children-cases'],
    queryFn: async () => {
      const response = await fetch('/api/v1/guardian/children', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch children cases')
      }
      return response.json() as Promise<ChildCaseInfo[]>
    }
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return 'text-blue-600 bg-blue-100'
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'cancelled':
      case 'rejected':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('guardianDashboard', { defaultValue: 'Guardian Dashboard' })}
            </h1>
            <div className="text-red-600 dark:text-red-400 mb-4">
              {t('errorLoadingCases', { defaultValue: 'Error loading children cases' })}
            </div>
            <Button onClick={() => refetch()}>
              {t('retryLoad', { defaultValue: 'Try Again' })}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('guardianDashboard', { defaultValue: 'Guardian Dashboard' })}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('guardianDashboardDescription', {
              defaultValue: 'Monitor and track the immigration cases of children under your guardianship.'
            })}
          </p>
        </div>

        {childrenCases.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <svg
                className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('noChildrenCases', { defaultValue: 'No Children Cases' })}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t('noChildrenCasesDescription', {
                  defaultValue: 'You are not currently a guardian for any children with active immigration cases.'
                })}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {childrenCases.map((child, index) => (
              <Card key={`${child.childUserId}-${index}`} className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {child.childName}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {child.cases.length} {child.cases.length === 1 ? 'case' : 'cases'}
                    </div>
                  </div>
                </div>

                {child.cases.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('noActiveCases', { defaultValue: 'No active cases for this child' })}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {child.cases.map((caseInfo) => (
                      <div key={caseInfo.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">
                                {caseInfo.visaType || t('visaType', { defaultValue: 'Immigration Case' })}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  caseInfo.status
                                )}`}
                              >
                                {caseInfo.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3a4 4 0 118 0v4m-4 6v6m-8-6h16"
                                  />
                                </svg>
                                Case ID: {caseInfo.id.substring(0, 8)}...
                              </div>
                              <div className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                  />
                                </svg>
                                Started: {formatDate(caseInfo.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Navigate to case details
                                showError('Case details view coming soon')
                              }}
                            >
                              {t('viewDetails', { defaultValue: 'View Details' })}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Navigate to documents
                                showError('Document view coming soon')
                              }}
                            >
                              {t('documents', { defaultValue: 'Documents' })}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {childrenCases.length > 0 && (
          <Card className="mt-8">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {t('guardianshipSummary', { defaultValue: 'Guardianship Summary' })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {childrenCases.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('childrenUnderCare', { defaultValue: 'Children Under Care' })}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {childrenCases.reduce((total, child) => total + child.cases.length, 0)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('totalCases', { defaultValue: 'Total Cases' })}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {childrenCases.reduce(
                      (total, child) =>
                        total + child.cases.filter(c =>
                          c.status.toLowerCase().includes('progress') ||
                          c.status.toLowerCase() === 'active'
                        ).length,
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('activeCases', { defaultValue: 'Active Cases' })}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default GuardianDashboardPage