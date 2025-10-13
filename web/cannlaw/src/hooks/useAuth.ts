import { useState, useEffect } from 'react'
import { authClient } from '@l4h/shared-ui'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
  isLegalProfessional: boolean
  emailVerified: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const isRemembered = await authClient.remember()
      if (isRemembered) {
        // Get user info from JWT token
        const token = localStorage.getItem('jwt_token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const user: User = {
            id: payload.sub,
            email: payload.email,
            firstName: payload.given_name || payload.firstName || '',
            lastName: payload.family_name || payload.lastName || '',
            isAdmin: payload.is_admin === 'true' || payload.is_admin === true,
            isLegalProfessional: payload.is_legal_professional === 'true' || payload.is_legal_professional === true,
            emailVerified: payload.email_verified === 'true' || payload.email_verified === true
          }
          
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          })
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          })
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const result = await authClient.login(email, password, rememberMe)
      if (result.success && result.token) {
        localStorage.setItem('jwt_token', result.token)
        await checkAuthStatus()
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Login failed' }
    }
  }

  const logout = async () => {
    try {
      await authClient.logout()
      localStorage.removeItem('jwt_token')
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    ...authState,
    login,
    logout,
    checkAuthStatus
  }
}