import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LanguageSwitcher, useTranslation } from '@l4h/shared-ui'
import { useAuth, getUserDisplayName } from '../hooks/useAuth'

export const Navigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { isAuthenticated, user, isLoading } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isLoginPage = location.pathname === '/login'
  const isVerifyPage = location.pathname === '/verify'

  const handleLogout = () => {
    // Clear the JWT token and redirect to home
    import('@l4h/shared-ui').then(({ setJwtToken }) => {
      setJwtToken(null)
      // Dispatch custom event to notify auth state change
      window.dispatchEvent(new Event('jwt-token-changed'))
      window.location.href = '/'
    })
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Don't show navigation on login/verify pages
  if (isLoginPage || isVerifyPage) {
    return null
  }

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '1rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{ width: '48px', height: '48px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>🇺🇸</span>
          </div>
          <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{t('brand:title', 'US Immigration Help')}</h1>
            <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>{t('brand:subtitle', 'Powered by Law4Hire')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LanguageSwitcher variant="compact" />
          <button
            onClick={() => navigate('/visa-library')}
            style={{ 
              background: location.pathname === '/visa-library' ? '#f3f4f6' : 'none', 
              border: 'none', 
              color: location.pathname === '/visa-library' ? '#2563eb' : '#666', 
              cursor: 'pointer', 
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: location.pathname === '/visa-library' ? 'bold' : 'normal'
            }}
          >
            {t('nav.visaLibrary', 'Visa Library')}
          </button>
          
          {isLoading ? (
            <div style={{ padding: '0.5rem 1rem', color: '#666' }}>Loading...</div>
          ) : isAuthenticated && user ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ 
                  background: 'none', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  padding: '0.5rem 1rem', 
                  cursor: 'pointer',
                  color: '#374151'
                }}
              >
                {t('nav.hello', 'Hello')} {getUserDisplayName(user)}
              </button>
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  minWidth: '150px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000
                }}>
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/dashboard') }}
                    style={{ 
                      width: '100%',
                      textAlign: 'left',
                      background: 'none', 
                      border: 'none', 
                      padding: '0.75rem 1rem', 
                      cursor: 'pointer',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    {t('dashboard', { ns: 'nav' })}
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); handleLogout() }}
                    style={{ 
                      width: '100%',
                      textAlign: 'left',
                      background: 'none', 
                      border: 'none', 
                      padding: '0.75rem 1rem', 
                      cursor: 'pointer',
                      color: '#dc2626'
                    }}
                  >
                    {t('auth.logout', 'Logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer' }}
              >
                {t('auth.login', 'Login')}
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer' }}
              >
                {t('common.getStarted', 'Get Started')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}