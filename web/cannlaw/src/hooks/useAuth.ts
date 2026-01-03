import React, { useState, useEffect, createContext, useContext } from 'react'

interface User {
  id: number
  email: string
  role: 'Admin' | 'LegalProfessional' | 'Client'
  attorneyId?: number
  name: string
  isAdmin: boolean
  isLegalProfessional: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginAsProfessional: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  hasRole: (role: string) => boolean
  isAdmin: boolean
  isLegalProfessional: boolean
  canAccessClient: (clientId: number) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing token and validate
    const token = localStorage.getItem('jwt_token')
    if (token) {
      validateToken(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  // Helper function to decode JWT and extract user information
  const decodeJwt = (token: string): User | null => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const payload = JSON.parse(jsonPayload)

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null
      }

      // Extract user information from JWT claims
      const userId = payload.sub || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      const email = payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
      const isAdmin = payload.is_admin === 'True' || payload.is_admin === true
      const isLegalProfessional = payload.is_legal_professional === 'True' || payload.is_legal_professional === true
      const firstName = payload.given_name || payload.firstName || ''
      const lastName = payload.family_name || payload.lastName || ''
      const name = payload.name || `${firstName} ${lastName}`.trim() || email
      const attorneyId = payload.attorney_id ? parseInt(payload.attorney_id) : undefined

      // Determine role
      let role: 'Admin' | 'LegalProfessional' | 'Client' = 'Client'
      if (isAdmin) {
        role = 'Admin'
      } else if (isLegalProfessional) {
        role = 'LegalProfessional'
      }

      return {
        id: parseInt(userId),
        email,
        role,
        attorneyId,
        name,
        isAdmin,
        isLegalProfessional
      }
    } catch (error) {
      console.error('Failed to decode JWT:', error)
      return null
    }
  }

  const validateToken = async (token: string) => {
    try {
      const userData = decodeJwt(token)
      if (userData) {
        setUser(userData)
      } else {
        localStorage.removeItem('jwt_token')
      }
    } catch (error) {
      // Token validation error - remove invalid token
      localStorage.removeItem('jwt_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const authResponse = await response.json()
        const token = authResponse.token

        // Decode JWT to extract user information
        const userData = decodeJwt(token)

        if (userData) {
          localStorage.setItem('jwt_token', token)
          setUser(userData)
          return { success: true }
        } else {
          return { success: false, error: 'Failed to decode user information' }
        }
      } else {
        const error = await response.text()
        return { success: false, error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const loginAsProfessional = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/v1/auth/attorneylogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const authResponse = await response.json()
        const token = authResponse.token

        // Decode JWT to extract user information
        const userData = decodeJwt(token)

        if (userData) {
          localStorage.setItem('jwt_token', token)
          setUser(userData)
          return { success: true }
        } else {
          return { success: false, error: 'Failed to decode user information' }
        }
      } else {
        const error = await response.text()
        // Try to parse JSON error if possible
        try {
            const jsonError = JSON.parse(error)
            return { success: false, error: jsonError.detail || jsonError.title || 'Login failed' }
        } catch {
            return { success: false, error: error || 'Login failed' }
        }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = () => {
    localStorage.removeItem('jwt_token')
    setUser(null)
  }

  const hasRole = (role: string) => {
    return user?.role === role
  }

  const canAccessClient = (clientId: number) => {
    if (!user) return false
    if (user.isAdmin) return true
    // Legal professionals can only access clients assigned to their attorney
    // This would need to be validated against the actual client data
    return user.isLegalProfessional && user.attorneyId !== undefined
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginAsProfessional,
    logout,
    hasRole,
    isAdmin: user?.isAdmin || false,
    isLegalProfessional: user?.isLegalProfessional || false,
    canAccessClient
  }

  return React.createElement(AuthContext.Provider, { value }, children);
}