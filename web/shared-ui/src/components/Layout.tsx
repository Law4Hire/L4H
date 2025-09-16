import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from '../i18n-provider'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { useTheme } from '../ThemeProvider'
import { Sun, Moon } from '../Icon'
import { Button } from './Button'
import { useNavigate, useLocation } from 'react-router-dom'

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
  isAuthenticated = false
}) => {
  const { t: _t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    // Clear tokens and redirect
    localStorage.removeItem('jwt-token')
    window.dispatchEvent(new Event('jwt-token-changed'))
    window.location.href = '/login'
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
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🇺🇸</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{_t('brand:title', 'US Immigration Help')}</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{_t('brand:subtitle', 'Powered by Law4Hire')}</p>
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
                className={location.pathname === '/visa-library' ? 'bg-blue-50 text-blue-600' : ''}
              >
                {_t('nav.visaLibrary')}
              </Button>

              <LanguageSwitcher variant="compact" />
              
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
                    {_t('nav.hello')} {getUserDisplayName(user)}
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
                        {_t('nav.dashboard')}
                      </button>
                      {user?.isAdmin && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false)
                            navigate('/admin')
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {_t('nav.admin')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowUserDropdown(false)
                          handleLogout()
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {_t('logout', { ns: 'auth' })}
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
                    {_t('auth.login')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    {_t('common.getStarted')}
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
    </div>
  )
}
