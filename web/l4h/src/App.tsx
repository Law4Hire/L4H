import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, RouteGuard, ToastProvider, UnifiedDashboard, SettingsHub, AuthProvider } from '@l4h/shared-ui'
import { InterviewProvider } from './InterviewContext';
import { useAuth } from './hooks/useAuth'

// Lazy load page components for code-splitting
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SinglePageRegistration = lazy(() => import('./pages/SinglePageRegistration'))
// const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const SchedulingPage = lazy(() => import('./pages/SchedulingPage'))
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const UploadsPage = lazy(() => import('./pages/UploadsPage'))
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'))
const VerifyPage = lazy(() => import('./pages/VerifyPage'))
const VisaLibraryPage = lazy(() => import('./pages/VisaLibraryPage'))
const InterviewPage = lazy(() => import('./pages/InterviewPage'))
const VisaResultsPage = lazy(() => import('./pages/VisaResultsPage'))
const DocumentInterviewPage = lazy(() => import('./pages/DocumentInterviewPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'))
const UserDetailPage = lazy(() => import('./pages/UserDetailPage'))
const AdminPricingPage = lazy(() => import('./pages/AdminPricingPage'))
const AdminInterviewQuestionsPage = lazy(() => import('./pages/AdminInterviewQuestionsPage'))
const AdminPackagesPage = lazy(() => import('./pages/AdminPackagesPage'))
const AdminCaseManagementPage = lazy(() => import('./pages/AdminCaseManagementPage'))
const AdminUSCISFormsPage = lazy(() => import('./pages/AdminUSCISFormsPage'))
const AdminVisaLibraryPage = lazy(() => import('./pages/AdminVisaLibraryPage'))
const CaseDetailPage = lazy(() => import('./pages/CaseDetailPage'))
const AttorneyManagementPage = lazy(() => import('./pages/admin/AttorneyManagementPage'))
// const SystemSettingsPage = lazy(() => import('./pages/admin/SystemSettingsPage'))
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'))
const DocumentPoolPage = lazy(() => import('./pages/admin/DocumentPoolPage'))

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

function App() {
  const { isAuthenticated, user } = useAuth()

  // Item 11: Automatic Cache Clearing on New Build
  React.useEffect(() => {
    // @ts-expect-error - __APP_VERSION__ is defined in vite.config.ts
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
    <AuthProvider>
    <ToastProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <Layout
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <LandingPage />
              </Layout>
            }
          />
        <Route 
          path="/login" 
          element={
            <Layout 
              showUserMenu={false} 
              user={user} 
              isAuthenticated={isAuthenticated}
            >
              <LoginPage />
            </Layout>
          } 
        />
        <Route 
          path="/register" 
          element={
            <Layout 
              showUserMenu={false} 
              user={user} 
              isAuthenticated={isAuthenticated}
            >
              <SinglePageRegistration />
            </Layout>
          } 
        />
        <Route 
          path="/register-interview" 
          element={
            <Layout 
              showUserMenu={false} 
              user={user} 
              isAuthenticated={isAuthenticated}
            >
              <SinglePageRegistration />
            </Layout>
          } 
        />
        <Route 
          path="/visa-library" 
          element={
            <Layout 
              showUserMenu={true} 
              user={user} 
              isAuthenticated={isAuthenticated}
            >
              <VisaLibraryPage />
            </Layout>
          } 
        />
        <Route 
          path="/verify" 
          element={
            <Layout 
              showUserMenu={false} 
              user={user} 
              isAuthenticated={isAuthenticated}
            >
              <VerifyPage />
            </Layout>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <RouteGuard>
              <Layout 
                title={'Dashboard'} 
                showUserMenu={true} 
                user={user} 
                isAuthenticated={isAuthenticated}
              >
                <UnifiedDashboard />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/pricing" 
          element={
            <RouteGuard>
              <Layout 
                title={'Pricing'} 
                showUserMenu={true} 
                user={user} 
                isAuthenticated={isAuthenticated}
              >
                <PricingPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/scheduling" 
          element={
            <RouteGuard>
              <Layout 
                title={'Schedule Interview'} 
                showUserMenu={true} 
                user={user} 
                isAuthenticated={isAuthenticated}
              >
                <SchedulingPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/appointments" 
          element={
            <RouteGuard>
              <Layout 
                title={'Appointments'} 
                showUserMenu={true} 
                user={user} 
                isAuthenticated={isAuthenticated}
              >
                <AppointmentsPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <RouteGuard>
              <Layout 
                title={'Messages'} 
                showUserMenu={true} 
                user={user} 
                isAuthenticated={isAuthenticated}
              >
                <MessagesPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/uploads" 
          element={
            <RouteGuard>
              <Layout 
                title={'Uploads'} 
                showUserMenu={true} 
                user={user} 
                isAuthenticated={isAuthenticated}
              >
                <UploadsPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route 
          path="/invoices" 
          element={
            <RouteGuard>
              <Layout 
                title={'Invoices'} 
                showUserMenu={true} 
                user={user} 
                isAuthenticated={isAuthenticated}
              >
                <InvoicesPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route
          path="/interview"
          element={
            <Layout
              title={'Interview'}
              showUserMenu={true}
              user={user}
              isAuthenticated={isAuthenticated}
            >
              <InterviewProvider>
                <InterviewPage />
              </InterviewProvider>
            </Layout>
          }
        />
        <Route
          path="/results"
          element={
            <Layout
              title={'Results'}
              showUserMenu={true}
              user={user}
              isAuthenticated={isAuthenticated}
            >
              <VisaResultsPage />
            </Layout>
          }
        />
        <Route
          path="/document-interview/:formId"
          element={
            <RouteGuard>
              <Layout
                title={'Smart Form Completion'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <DocumentInterviewPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route 
          path="/admin" 
          element={
            <RouteGuard>
              <Layout 
                title={'Admin'} 
                showUserMenu={true} 
                user={user} 
                isAuthenticated={isAuthenticated}
              >
                <AdminPage />
              </Layout>
            </RouteGuard>
          } 
        />
        <Route
          path="/admin/users"
          element={
            <RouteGuard>
              <Layout
                title={'User Management'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <UserManagementPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <RouteGuard>
              <Layout
                title={'User Details'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <UserDetailPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/pricing"
          element={
            <RouteGuard>
              <Layout
                title={'Visa/Pricing Management'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <AdminPricingPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/packages"
          element={
            <RouteGuard>
              <Layout
                title={'Package Management'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <AdminPackagesPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/interview-questions"
          element={
            <RouteGuard>
              <Layout
                title={'Interview Questions Management'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <AdminInterviewQuestionsPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/attorneys"
          element={
            <RouteGuard>
              <Layout
                title={'Attorney Management'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <AttorneyManagementPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/cases"
          element={
            <RouteGuard>
              <Layout
                title={'Case Management'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <AdminCaseManagementPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/uscis-forms"
          element={
            <RouteGuard>
              <Layout
                title={'USCIS Forms Management'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <AdminUSCISFormsPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/visa-library"
          element={
            <RouteGuard>
              <Layout
                title={'Visa Library Management'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <AdminVisaLibraryPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/system-settings"
          element={
            <RouteGuard>
              <Layout
                title={'System Settings'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <SettingsHub />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RouteGuard>
              <Layout
                title={'Reports & Analytics'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <AdminReportsPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/admin/document-pool"
          element={
            <RouteGuard>
              <Layout
                title={'Document Pool Management'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <DocumentPoolPage />
              </Layout>
            </RouteGuard>
          }
        />
        <Route
          path="/cases/:id"
          element={
            <RouteGuard>
              <Layout
                title={'Case Detail'}
                showUserMenu={true}
                user={user}
                isAuthenticated={isAuthenticated}
              >
                <CaseDetailPage />
              </Layout>
            </RouteGuard>
          }
        />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ToastProvider>
    </AuthProvider>
  )
}

export default App