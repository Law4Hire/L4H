import React, { Suspense, lazy } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/Spinner'

// We will keep the actual dashboard implementations somewhat separate but hosted here
const AdminWorkspace = lazy(() => import('./dashboards/AdminWorkspace'))
const ProfessionalWorkspace = lazy(() => import('./dashboards/ProfessionalWorkspace'))
const ClientDashboard = lazy(() => import('./dashboards/ClientDashboard'))

export const UnifiedDashboard: React.FC = () => {
  const { user, role, isAdmin, isLegalProfessional, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const renderDashboard = () => {
    if (isAdmin) return <AdminWorkspace />
    if (isLegalProfessional) return <ProfessionalWorkspace />
    return <ClientDashboard />
  }

  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    }>
      {renderDashboard()}
    </Suspense>
  )
}
