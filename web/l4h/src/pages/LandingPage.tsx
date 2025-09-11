import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@l4h/shared-ui'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['landing', 'common'])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)' }}>
      {/* Hero Section */}
      <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827' }}>
            {t('hero.title', { ns: 'landing' })}
          </h2>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem', maxWidth: '48rem', margin: '0 auto 2rem' }}>
            {t('hero.description', { ns: 'landing' })}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '1rem 2rem', fontSize: '1.125rem', cursor: 'pointer' }}
            >
              {t('hero.startCase', { ns: 'landing' })}
            </button>
            <button
              onClick={() => navigate('/visa-library')}
              style={{ background: 'none', border: '2px solid #2563eb', color: '#2563eb', borderRadius: '8px', padding: '1rem 2rem', fontSize: '1.125rem', cursor: 'pointer' }}
            >
              {t('hero.exploreVisas', { ns: 'landing' })}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LandingPage