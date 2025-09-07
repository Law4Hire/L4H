import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authClient } from './AuthClient'

interface RouteGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      // First check if we have a token in memory
      if (authClient.isAuthenticated()) {
        setIsAuthenticated(true)
        return
      }

      // Try to remember (exchange cookie for JWT)
      const remembered = await authClient.remember()
      setIsAuthenticated(remembered)
      
      if (!remembered) {
        navigate(redirectTo, { replace: true })
      }
    }

    checkAuth()
  }, [navigate, redirectTo])

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Show children if authenticated
  if (isAuthenticated) {
    return <>{children}</>
  }

  // This shouldn't render as we navigate away, but just in case
  return null
}
