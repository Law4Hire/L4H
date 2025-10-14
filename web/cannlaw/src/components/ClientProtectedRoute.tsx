import React, { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ClientProtectedRouteProps {
  children: React.ReactNode
}

export function ClientProtectedRoute({ children }: ClientProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const { id: clientId } = useParams<{ id: string }>()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkClientAccess = async () => {
      if (!isAuthenticated || !user || !clientId) {
        setIsAuthorized(false)
        setIsLoading(false)
        return
      }

      // Admin can access all clients
      if (user.isAdmin) {
        setIsAuthorized(true)
        setIsLoading(false)
        return
      }

      // Legal professionals need to check if client is assigned to their attorney
      if (user.isLegalProfessional && user.attorneyId) {
        try {
          const response = await fetch(`/api/v1/clients/${clientId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            }
          })

          if (response.ok) {
            setIsAuthorized(true)
          } else if (response.status === 403) {
            setIsAuthorized(false)
          } else {
            setIsAuthorized(false)
          }
        } catch (error) {
          console.error('Error checking client access:', error)
          setIsAuthorized(false)
        }
      } else {
        setIsAuthorized(false)
      }

      setIsLoading(false)
    }

    checkClientAccess()
  }, [isAuthenticated, user, clientId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isAuthorized === false) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}