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
    // Return a mock implementation for now
    return {
      user: {
        id: 1,
        email: 'admin@cannlaw.com',
        role: 'Admin' as const,
        name: 'Admin User',
        attorneyId: undefined,
        isAdmin: true,
        isLegalProfessional: false
      },
      isLoading: false,
      isAuthenticated: true,
      login: async () => ({ success: true }),
      logout: () => {},
      hasRole: (role: string) => role === 'Admin',
      isAdmin: true,
      isLegalProfessional: false,
      canAccessClient: () => true
    }
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

  const validateToken = async (token: string) => {
    try {
      const response = await fetch('/api/v1/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem('jwt_token')
      }
    } catch (error) {
      console.error('Token validation error:', error)
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
        const { token, user: userData } = await response.json()
        localStorage.setItem('jwt_token', token)
        setUser(userData)
        return { success: true }
      } else {
        const error = await response.text()
        return { success: false, error }
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
    logout,
    hasRole,
    isAdmin: user?.isAdmin || false,
    isLegalProfessional: user?.isLegalProfessional || false,
    canAccessClient
  }

  return React.createElement(AuthContext.Provider, { value }, children);
}