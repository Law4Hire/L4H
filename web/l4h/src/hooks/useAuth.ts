import { useState, useEffect } from 'react'
import { getJwtToken } from '@l4h/shared-ui'

interface User {
  email: string
  name?: string
  firstName?: string
  lastName?: string
  roles?: string[]
  isAdmin?: boolean
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
}

function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  })

  const checkAuthState = () => {
    const token = getJwtToken()
    
    if (token) {
      const payload = parseJwtPayload(token)
      
      if (payload) {
        // Extract user information from JWT payload
        const user: User = {
          email: payload.email || payload.sub || 'User',
          name: payload.name,
          firstName: payload.given_name || payload.firstName,
          lastName: payload.family_name || payload.lastName,
          roles: payload.roles || payload.role ? [payload.role] : [],
          isAdmin: payload.is_admin === 'true' || payload.is_admin === 'True' || payload.is_admin === true
        }

        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false
        })
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        })
      }
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false
      })
    }
  }

  useEffect(() => {
    // Check initial auth state
    checkAuthState()

    // Listen for storage changes (when token is set/removed in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jwt_token' || e.key === null) {
        checkAuthState()
      }
    }

    // Listen for custom events (when token is set/removed in same tab)
    const handleTokenChange = () => {
      checkAuthState()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('jwt-token-changed', handleTokenChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('jwt-token-changed', handleTokenChange)
    }
  }, [])

  return authState
}

export function getUserDisplayName(user: User): string {
  if (user.name) return user.name
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.email) {
    // Extract name from email (e.g., "john.doe@example.com" -> "John Doe")
    const emailName = user.email.split('@')[0]
    const parts = emailName.split(/[._-]/)
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  }
  return 'User'
}