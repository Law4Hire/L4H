import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { RouteGuard } from '@l4h/shared-ui'

function App() {
  const { t } = useTranslation()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/dashboard" 
        element={
          <RouteGuard>
            <Layout title={t('dashboard.title')}>
              <DashboardPage />
            </Layout>
          </RouteGuard>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
