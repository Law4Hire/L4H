import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, RouteGuard, ToastContainer, useToast } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import { useAuth } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ClientProtectedRoute } from './components/ClientProtectedRoute'

// Public pages
import HomePage from './pages/public/HomePage'
import AboutPage from './pages/public/AboutPage'
import ServicesPage from './pages/public/ServicesPage'
import AttorneysPage from './pages/public/AttorneysPage'
import ContactPage from './pages/public/ContactPage'
import FeesPage from './pages/public/FeesPage'

// Auth pages
import LoginPage from './pages/LoginPage'

// Legal Professional Dashboard
import LegalDashboard from './pages/dashboard/LegalDashboard'
import ClientManagement from './pages/dashboard/ClientManagement'
import ClientProfilePage from './pages/dashboard/ClientProfilePage'
import TimeTrackingPage from './pages/dashboard/TimeTrackingPage'

// Admin billing
import BillingDashboard from './pages/admin/BillingDashboard'

// Admin pages
import AdminPage from './pages/AdminPage'
import AdminPricingPage from './pages/AdminPricingPage'
import AdminWorkflowsPage from './pages/AdminWorkflowsPage'
import AdminTimeEntriesPage from './pages/AdminTimeEntriesPage'
import AdminReportsPage from './pages/AdminReportsPage'
import SiteConfigPage from './pages/admin/SiteConfigPage'
import AttorneyManagementPage from './pages/admin/AttorneyManagementPage'

// Legacy pages (keeping for compatibility)
import SchedulePage from './pages/SchedulePage'
import CasesPage from './pages/CasesPage'

function App() {
  const { t } = useTranslation()
  const { toasts, removeToast } = useToast()
  const { user, isAuthenticated } = useAuth()

  const isLegalProfessional = user?.isLegalProfessional || false
  const isAdmin = user?.isAdmin || false

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/attorneys" element={<AttorneysPage />} />
        <Route path="/fees" element={<FeesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Legal Professional Dashboard - Only for legal professionals */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requireLegalProfessional>
              <Layout title="Legal Dashboard">
                <LegalDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients" 
          element={
            <ProtectedRoute requireLegalProfessional>
              <Layout title="Client Management">
                <ClientManagement />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients/:id" 
          element={
            <ClientProtectedRoute>
              <Layout title="Client Profile">
                <ClientProfilePage />
              </Layout>
            </ClientProtectedRoute>
          } 
        />
        <Route 
          path="/time-tracking" 
          element={
            <ProtectedRoute requireLegalProfessional>
              <Layout title="Time Tracking">
                <TimeTrackingPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Legacy Routes - Keep for existing functionality */}
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
        
        {/* Admin Routes - Only for admins */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title={t('admin.title')}>
                <AdminPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/site-config" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title="Site Configuration">
                <SiteConfigPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/attorneys" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title="Attorney Management">
                <AttorneyManagementPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/billing" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title="Billing Dashboard">
                <BillingDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/pricing" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title={t('admin.pricing')}>
                <AdminPricingPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/workflows" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title={t('admin.workflows')}>
                <AdminWorkflowsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/time-entries" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title={t('admin.timeEntries')}>
                <AdminTimeEntriesPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title={t('admin.reports')}>
                <AdminReportsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Unauthorized page */}
        <Route path="/unauthorized" element={
          <Layout title="Unauthorized">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
              <Navigate to="/" replace />
            </div>
          </Layout>
        } />
        
        {/* Fallback for authenticated users */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

export default App
