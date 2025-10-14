import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireLegalProfessional?: boolean
  requireAttorneyAssignment?: boolean
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireLegalProfessional = false,
  requireAttorneyAssignment = false 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !user?.isAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requireLegalProfessional && !user?.isLegalProfessional && !user?.isAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requireAttorneyAssignment && !user?.isAdmin && (!user?.isLegalProfessional || !user?.attorneyId)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}