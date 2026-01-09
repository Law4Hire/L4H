import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '../ThemeProvider'
import { Sun, Moon } from '../Icon'
import { Button } from './Button'

interface User {
  email: string
  name?: string
  firstName?: string
  lastName?: string
  roles?: string[]
  isAdmin?: boolean
}

interface LayoutProps {
  children: React.ReactNode
  title?: string
  showUserMenu?: boolean
  user?: User | null
  isAuthenticated?: boolean
  brandName?: string
  brandLogo?: React.ReactNode
  brandSubtitle?: string
}

function getUserDisplayName(user: User): string {
  if (user.firstName) return user.firstName
  if (user.name) return user.name
  if (user.email) {
    const emailName = user.email.split('@')[0]
    const parts = emailName.split(/[._-]/)
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  }
  return 'User'
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title: _title,
  showUserMenu = true,
  user,
  isAuthenticated = false,
  brandName = "US Immigration Help",
  brandSubtitle = "Powered by Law4Hire",
  brandLogo = (
    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-lg">🇺🇸</span>
    </div>
  )
}) => {
  const { theme, toggleTheme } = useTheme()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Use window.location for navigation instead of useNavigate to avoid Router context issues
  const navigate = (path: string) => {
    window.location.href = path
  }

  const getCurrentPath = () => {
    return window.location.pathname
  }

  const handleLogout = async () => {
    // Clear all auth state properly
    localStorage.removeItem('jwt-token')
    localStorage.removeItem('jwt_token')
    sessionStorage.clear()

    // Clear tokens from shared-ui module (if available)
    try {
      const { setJwtToken, clearTokens } = await import('../api-client')
      setJwtToken(null)
      clearTokens()
    } catch (e) {
      console.warn('Could not import clearTokens:', e)
    }

    // Dispatch event to notify auth state change
    window.dispatchEvent(new Event('jwt-token-changed'))

    // Try to call backend logout API to clear HttpOnly cookies
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (e) {
      console.warn('Backend logout failed:', e)
    }

    // Redirect to home page with cache bust
    window.location.href = '/?t=' + Date.now()
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header with Full Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => navigate('/')}
              >
                {brandLogo}
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{brandName}</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{brandSubtitle}</p>
                </div>
              </div>
            </div>
            
            {/* Right side - Navigation */}
            <div className="flex items-center space-x-4">
              {/* Visa Library Link */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/visa-library')}
                className={getCurrentPath() === '/visa-library' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-navy-900 dark:hover:text-white'}
              >
                Visa Library
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              
              {showUserMenu && isAuthenticated && user ? (
                <div ref={userMenuRef} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    Hello {getUserDisplayName(user)}
                  </Button>
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false)
                          navigate('/dashboard')
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Dashboard
                      </button>
                      {user?.isAdmin && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false)
                            navigate('/admin')
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Admin
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowUserDropdown(false)
                          handleLogout()
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : showUserMenu && !isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Version Tag for Deployment Verification */}
      <div className="fixed bottom-2 left-2 z-[100] bg-black/50 text-white text-[10px] px-2 py-1 rounded-md pointer-events-none backdrop-blur-sm border border-white/10 font-mono">
        v1.0.6-fixes
      </div>
    </div>
  )
}