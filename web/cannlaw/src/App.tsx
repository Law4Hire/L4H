import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import LoginPage from './pages/LoginPage'
import SchedulePage from './pages/SchedulePage'
import CasesPage from './pages/CasesPage'
import AdminPage from './pages/AdminPage'
import { RouteGuard } from '@l4h/shared-ui'

function App() {
  const { t } = useTranslation()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/schedule" 
        element={
          <RouteGuard>
            <Layout title={t('schedule.title')}>
              <SchedulePage />
            </Layout>
          </RouteGuard>
        } 
      />
      <Route 
        path="/cases" 
        element={
          <RouteGuard>
            <Layout title={t('cases.title')}>
              <CasesPage />
            </Layout>
          </RouteGuard>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <RouteGuard>
            <Layout title={t('admin.title')}>
              <AdminPage />
            </Layout>
          </RouteGuard>
        } 
      />
      <Route path="/" element={<Navigate to="/schedule" replace />} />
    </Routes>
  )
}

export default App
