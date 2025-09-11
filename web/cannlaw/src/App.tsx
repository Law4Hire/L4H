import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, RouteGuard, ToastContainer, useToast } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import LoginPage from './pages/LoginPage'
import SchedulePage from './pages/SchedulePage'
import CasesPage from './pages/CasesPage'
import AdminPricingPage from './pages/AdminPricingPage'
import AdminWorkflowsPage from './pages/AdminWorkflowsPage'
import AdminTimeEntriesPage from './pages/AdminTimeEntriesPage'
import AdminReportsPage from './pages/AdminReportsPage'

function App() {
  const { t } = useTranslation()
  const { toasts, removeToast } = useToast()

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/schedule" 
          element={
            <RouteGuard>
              <Layout title={t('nav.schedule')}>
                <SchedulePage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/cases" 
          element={
            <RouteGuard>
              <Layout title={t('nav.cases')}>
                <CasesPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/admin/pricing" 
          element={
            <RouteGuard>
              <Layout title={t('admin.pricing')}>
                <AdminPricingPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/admin/workflows" 
          element={
            <RouteGuard>
              <Layout title={t('admin.workflows')}>
                <AdminWorkflowsPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/admin/time-entries" 
          element={
            <RouteGuard>
              <Layout title={t('admin.timeEntries')}>
                <AdminTimeEntriesPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <RouteGuard>
              <Layout title={t('admin.reports')}>
                <AdminReportsPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route path="/" element={<Navigate to="/schedule" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

export default App
