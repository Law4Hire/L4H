import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@l4h/shared-ui'
import { useSiteConfig } from '../hooks/useSiteConfig'
import { useAuth } from '../hooks/useAuth'

interface PublicLayoutProps {
  children: React.ReactNode
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { siteConfig } = useSiteConfig()
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Attorneys/Staff', href: '/attorneys' },
    { name: 'Fees', href: '/fees' },
    { name: 'Contact/Consultation', href: '/contact' }
  ]

  const socialMediaPlatforms = siteConfig?.socialMediaPlatforms 
    ? JSON.parse(siteConfig.socialMediaPlatforms) 
    : []

  const locations = siteConfig?.locations 
    ? JSON.parse(siteConfig.locations) 
    : []

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Firm Name */}
            <Link to="/" className="flex items-center space-x-3">
              {siteConfig?.logoUrl ? (
                <img 
                  src={siteConfig.logoUrl} 
                  alt={siteConfig.firmName}
                  className="h-12 w-auto"
                />
              ) : (
                <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">CL</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {siteConfig?.firmName || 'Cann Legal Group'}
                </h1>
                <p className="text-sm text-gray-600">Immigration Law Specialists</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Auth/Dashboard Links */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {user?.isLegalProfessional && (
                    <Link to="/dashboard">
                      <Button variant="outline" size="sm">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  {user?.isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.firstName || user?.email}
                  </span>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    Client Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t">
          <div className="px-4 py-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === item.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Firm Info */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">
                {siteConfig?.firmName || 'Cann Legal Group'}
              </h3>
              <p className="text-gray-300 mb-4">
                {siteConfig?.primaryFocusStatement || 'Fast, efficient, and convenient. Comprehensive representation from state side through consular processing.'}
              </p>
              <div className="space-y-2">
                <p className="text-gray-300">
                  <strong>Managing Attorney:</strong> {siteConfig?.managingAttorney || 'Denise S. Cann'}
                </p>
                <p className="text-gray-300">
                  <strong>Phone:</strong> {siteConfig?.primaryPhone || '(410) 783-1888'}
                </p>
                <p className="text-gray-300">
                  <strong>Email:</strong> {siteConfig?.email || 'information@cannlaw.com'}
                </p>
              </div>
            </div>

            {/* Office Locations */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Office Locations</h3>
              <div className="space-y-3">
                {locations.map((location: any, index: number) => (
                  <div key={index} className="text-gray-300">
                    <p className="font-medium">{location.type}</p>
                    <p>{location.city}</p>
                    {location.address && <p>{location.address}</p>}
                    {location.zip && <p>{location.zip}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media & Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
              <div className="space-y-2">
                {socialMediaPlatforms.map((platform: string, index: number) => (
                  <p key={index} className="text-gray-300">{platform}</p>
                ))}
              </div>
              <div className="mt-6">
                <Link to="/contact">
                  <Button variant="primary" className="w-full">
                    Schedule Consultation
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} {siteConfig?.firmName || 'Cann Legal Group'}. All rights reserved.</p>
            <p className="mt-2 text-sm">
              This website is for informational purposes only and does not constitute legal advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout