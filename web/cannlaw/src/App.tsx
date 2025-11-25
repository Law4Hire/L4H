import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, RouteGuard, ToastProvider } from '@l4h/shared-ui'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ClientProtectedRoute } from './components/ClientProtectedRoute'

// Lazy load page components for code-splitting
// Public pages
const HomePage = lazy(() => import('./pages/public/HomePage'))
const AboutPage = lazy(() => import('./pages/public/AboutPage'))
const ServicesPage = lazy(() => import('./pages/public/ServicesPage'))
const AttorneysPage = lazy(() => import('./pages/public/AttorneysPage'))
const ContactPage = lazy(() => import('./pages/public/ContactPage'))
const FeesPage = lazy(() => import('./pages/public/FeesPage'))

// Auth pages
const LoginPage = lazy(() => import('./pages/LoginPage'))

// Legal Professional Dashboard
const LegalDashboard = lazy(() => import('./pages/dashboard/LegalDashboard'))
const ClientManagement = lazy(() => import('./pages/dashboard/ClientManagement'))
const ClientProfilePage = lazy(() => import('./pages/dashboard/ClientProfilePage'))
const TimeTrackingPage = lazy(() => import('./pages/dashboard/TimeTrackingPage'))

// Admin billing
const BillingDashboard = lazy(() => import('./pages/admin/BillingDashboard'))

// Admin pages
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminPricingPage = lazy(() => import('./pages/AdminPricingPage'))
const AdminWorkflowsPage = lazy(() => import('./pages/AdminWorkflowsPage'))
const AdminTimeEntriesPage = lazy(() => import('./pages/AdminTimeEntriesPage'))
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'))
const SiteConfigPage = lazy(() => import('./pages/admin/SiteConfigPage'))
const AttorneyManagementPage = lazy(() => import('./pages/admin/AttorneyManagementPage'))

// Legacy pages (keeping for compatibility)
const SchedulePage = lazy(() => import('./pages/SchedulePage'))
const CasesPage = lazy(() => import('./pages/CasesPage'))

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

function App() {
  const { t } = useTranslation()

  return (
    <ToastProvider>
      <Suspense fallback={<LoadingFallback />}>
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
              <Layout title={'Schedule'}>
                <SchedulePage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/cases" 
          element={
            <RouteGuard>
              <Layout title={'Cases'}>
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
      </Suspense>
    </ToastProvider>
  )
}

export default App
