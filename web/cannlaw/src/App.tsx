import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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
const ResourcesPage = lazy(() => import('./pages/public/ResourcesPage'))

// Auth pages
const LoginPage = lazy(() => import('./pages/LoginPage'))

// Public Layout
import PublicLayout from './components/PublicLayout'

// Legal Professional Dashboard
const LegalDashboard = lazy(() => import('./pages/dashboard/LegalDashboard'))
const ClientManagement = lazy(() => import('./pages/dashboard/ClientManagement'))
const ClientProfilePage = lazy(() => import('./pages/dashboard/ClientProfilePage'))
const TimeTrackingPage = lazy(() => import('./pages/dashboard/TimeTrackingPage'))
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'))
const MessagesPage = lazy(() => import('./pages/dashboard/MessagesPage'))

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
const ServicesManagementPage = lazy(() => import('./pages/admin/ServicesManagementPage'))
const VisaLibraryManagementPage = lazy(() => import('./pages/admin/VisaLibraryManagementPage'))
const AlertsManagementPage = lazy(() => import('./pages/admin/AlertsManagementPage'))
const AdminContentManagementPage = lazy(() => import('./pages/admin/AdminContentManagementPage'))
const AdminAppointmentsPage = lazy(() => import('./pages/admin/AdminAppointmentsPage'))
const AdminInterviewEditor = lazy(() => import('./pages/admin/AdminInterviewEditor'))

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
  // Item 11: Automatic Cache Clearing on New Build
  React.useEffect(() => {
    // @ts-ignore - __APP_VERSION__ is defined in vite.config.ts
    const currentVersion = __APP_VERSION__;
    const storedVersion = localStorage.getItem('app_version');

    if (storedVersion && storedVersion !== currentVersion) {
      console.log('New build detected, clearing authentication and storage...');

      // CRITICAL: Call logout to clear server-side cookies before clearing localStorage
      // This prevents the "stuck cookie" problem where users remain logged in after rebuild
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies for proper logout
      }).catch(err => {
        // Logout may fail if already logged out - that's okay
        console.log('Logout during version update:', err.message);
      }).finally(() => {
        // Clear everything except theme preference
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        if (theme) localStorage.setItem('theme', theme);

        localStorage.setItem('app_version', currentVersion);
        window.location.reload();
      });
    } else if (!storedVersion) {
      localStorage.setItem('app_version', currentVersion);
    }
  }, []);

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
        <Route path="/resources" element={<ResourcesPage />} />
        
        {/* Authentication */}
        <Route 
          path="/login" 
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          } 
        />
        
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
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute requireLegalProfessional>
              <Layout title="Messages">
                <MessagesPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute requireLegalProfessional>
              <Layout title="My Profile">
                <ProfilePage />
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
              <Layout title={'Admin'}>
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
          path="/admin/services"
          element={
            <ProtectedRoute requireAdmin>
              <Layout title="Services Management">
                <ServicesManagementPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/visa-library"
          element={
            <ProtectedRoute requireAdmin>
              <Layout title="Visa Library Management">
                <VisaLibraryManagementPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/alerts"
          element={
            <ProtectedRoute requireAdmin>
              <Layout title="Alerts Management">
                <AlertsManagementPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <ProtectedRoute requireAdmin>
              <Layout title="Content Management">
                <AdminContentManagementPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute requireAdmin>
              <Layout title="Appointment Management">
                <AdminAppointmentsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/interview"
          element={
            <ProtectedRoute requireAdmin>
              <Layout title="Interview Editor">
                <AdminInterviewEditor />
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
              <Layout title={'Pricing'}>
                <AdminPricingPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/workflows" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title={'Workflows'}>
                <AdminWorkflowsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/time-entries" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title={'Time Entries'}>
                <AdminTimeEntriesPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute requireAdmin>
              <Layout title={'Reports'}>
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
