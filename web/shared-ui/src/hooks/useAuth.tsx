import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { auth as apiAuth, getJwtToken, setJwtToken, clearTokens } from '../api-client'

export interface User {
  id: string
  email: string
  role: 'Admin' | 'LegalProfessional' | 'Client'
  attorneyId?: number
  name: string
  firstName?: string
  lastName?: string
  isAdmin: boolean
  isLegalProfessional: boolean
  isStaff: boolean
  country?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  loginAsProfessional: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  hasRole: (role: string) => boolean
  isAdmin: boolean
  isLegalProfessional: boolean
  isStaff: boolean
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

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null
    }

    const userId = payload.sub || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
    const email = payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
    
    // Robust boolean claim detection
    const isTrue = (val: any) => val === 'True' || val === 'true' || val === true || val === 1 || val === '1'
    
    const isAdmin = isTrue(payload.is_admin) || isTrue(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'Admin')
    const isLegalProfessional = isTrue(payload.is_legal_professional) || 
                               isTrue(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'LegalProfessional') ||
                               isTrue(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'Attorney')
    
    const firstName = payload.given_name || payload.firstName || ''
    const lastName = payload.family_name || payload.lastName || ''
    const name = payload.name || `${firstName} ${lastName}`.trim() || email?.split('@')[0] || 'User'
    const attorneyId = payload.attorney_id || payload.AttorneyId ? parseInt(payload.attorney_id || payload.AttorneyId) : undefined
    const country = payload.country || payload.location

    let role: 'Admin' | 'LegalProfessional' | 'Client' = 'Client'
    if (isAdmin) {
      role = 'Admin'
    } else if (isLegalProfessional) {
      role = 'LegalProfessional'
    }

    return {
      id: userId,
      email,
      role,
      attorneyId,
      name,
      firstName,
      lastName,
      isAdmin,
      isLegalProfessional,
      isStaff: isAdmin || isLegalProfessional,
      country
    }
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuthState = useCallback(() => {
    const token = getJwtToken()
    if (token) {
      const userData = decodeJwt(token)
      if (userData) {
        setUser(userData)
      } else {
        setUser(null)
      }
    } else {
      setUser(null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    checkAuthState()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jwt_token' || e.key === null) {
        checkAuthState()
      }
    }

    const handleTokenChange = () => {
      checkAuthState()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('jwt-token-changed', handleTokenChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('jwt-token-changed', handleTokenChange)
    }
  }, [checkAuthState])

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const result = await apiAuth.login({ email, password, rememberMe })
      if (result && result.token) {
        setJwtToken(result.token)
        window.dispatchEvent(new Event('jwt-token-changed'))
        return { success: true }
      }
      return { success: false, error: 'Login failed' }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    }
  }

  const loginAsProfessional = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const result = await apiAuth.loginAsProfessional({ email, password, rememberMe })
      if (result && result.token) {
        setJwtToken(result.token)
        window.dispatchEvent(new Event('jwt-token-changed'))
        return { success: true }
      }
      return { success: false, error: 'Login failed' }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    }
  }

  const logout = async () => {
    try {
      await apiAuth.logout()
    } catch (e) {
      console.warn('Logout API failed', e)
    } finally {
      clearTokens()
      setUser(null)
      window.dispatchEvent(new Event('jwt-token-changed'))
    }
  }

  const hasRole = (role: string) => {
    if (role === 'Admin') return user?.isAdmin || false
    if (role === 'LegalProfessional') return user?.isLegalProfessional || false
    if (role === 'Staff') return user?.isAdmin || user?.isLegalProfessional || false
    return user?.role === role
  }

  const canAccessClient = (clientId: number) => {
    if (!user) return false
    if (user.isAdmin) return true
    return user.isLegalProfessional && user.attorneyId !== undefined
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginAsProfessional,
    logout,
    hasRole,
    isAdmin: user?.isAdmin || false,
    isLegalProfessional: user?.isLegalProfessional || false,
    isStaff: user?.isAdmin || user?.isLegalProfessional || false,
    canAccessClient
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
