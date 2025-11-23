import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, RouteGuard, ToastContainer, useToast } from '@l4h/shared-ui'
import { InterviewProvider } from './InterviewContext';
import { useAuth } from './hooks/useAuth'

// Lazy load page components for code-splitting
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SinglePageRegistration = lazy(() => import('./pages/SinglePageRegistration'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
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
const AdminPage = lazy(() => import('./pages/AdminPage'))
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'))
const UserDetailPage = lazy(() => import('./pages/UserDetailPage'))
const AdminPricingPage = lazy(() => import('./pages/AdminPricingPage'))
const AdminCaseManagementPage = lazy(() => import('./pages/AdminCaseManagementPage'))
const CaseDetailPage = lazy(() => import('./pages/CaseDetailPage'))

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

function App() {
  const { toasts, removeToast } = useToast()
  const { isAuthenticated, user } = useAuth()

  return (
    <>
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
                <DashboardPage />
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
              title={t('nav.results', 'Results')}
              showUserMenu={true}
              user={user}
              isAuthenticated={isAuthenticated}
            >
              <VisaResultsPage />
            </Layout>
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
                title={'Pricing Management'}
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
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

export default App