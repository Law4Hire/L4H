import React, { Suspense, lazy } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/Spinner'

// We will keep the actual dashboard implementations somewhat separate but hosted here
const LegalProWorkbasket = lazy(() => import('./dashboards/LegalProWorkbasket'))
const ClientDashboard = lazy(() => import('./dashboards/ClientDashboard'))

export const UnifiedDashboard: React.FC = () => {
  const { user, isStaff, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    }>
      {isStaff || isAdmin ? <LegalProWorkbasket /> : <ClientDashboard />}
    </Suspense>
  )
}
