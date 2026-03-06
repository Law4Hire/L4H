import React, { useEffect, useState } from 'react'
import { auth, getJwtToken, setJwtToken } from './api-client'
import { useAuth } from './hooks/useAuth'

interface RouteGuardProps {
  children: React.ReactNode
  redirectTo?: string
  roles?: ('Admin' | 'LegalProfessional' | 'Client')[]
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  redirectTo = '/login',
  roles
}) => {
  const { role, isAuthenticated: contextAuthenticated, isLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (getJwtToken()) {
        setIsChecking(false)
        return
      }

      try {
        const response = await auth.remember()
        if (response && response.token) {
          setJwtToken(response.token)
        }
      } catch (error) {
        console.warn('Remember me failed:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [])

  if (isChecking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const authenticated = contextAuthenticated || !!getJwtToken()

  if (!authenticated) {
    window.location.href = redirectTo
    return null
  }

  if (roles && roles.length > 0 && role) {
    if (!roles.includes(role)) {
      // Not authorized for this role
      window.location.href = '/dashboard'
      return null
    }
  }

  return <>{children}</>
}
