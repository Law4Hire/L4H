import React, { useEffect, useState } from 'react'
import { auth, getJwtToken, setJwtToken } from './api-client'

interface RouteGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  // const navigate = useNavigate() // Commented out router dependency
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      // First check if we have a token in memory
      if (getJwtToken()) {
        setIsAuthenticated(true)
        return
      }

      // Try to remember (exchange cookie for JWT)
      try {
        const response = await auth.remember()
        if (response && response.token) {
          setJwtToken(response.token)
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.warn('Remember me failed:', error)
        setIsAuthenticated(false)
      }
      
      if (!getJwtToken()) {
        // Redirect to login page
        window.location.href = redirectTo
      }
    }

    checkAuth()
  }, [redirectTo])

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
