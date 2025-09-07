import React from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { authClient } from '../AuthClient'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  showUserMenu?: boolean
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  showUserMenu = true 
}) => {
  const { t } = useTranslation()

  const handleLogout = () => {
    authClient.logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {title && (
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
              {showUserMenu && (
                <div className="relative">
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-700 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100"
                  >
                    {t('nav.logout')}
                  </button>
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
