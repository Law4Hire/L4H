import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, RouteGuard, ToastContainer, useToast, useTranslation } from '@l4h/shared-ui'
import { InterviewProvider } from './InterviewContext';
import { useAuth } from './hooks/useAuth'

// Lazy load page components for code-splitting
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ProfileCompletionPage = lazy(() => import('./pages/ProfileCompletionPage'))
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
  const { t } = useTranslation()
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
          path="/register" 
          element={
            <Layout 
              showUserMenu={false} 
              user={user} 
              isAuthenticated={isAuthenticated}
            >
              <RegisterPage />
            </Layout>
          } 
        />
        <Route 
          path="/profile-completion" 
          element={
            <RouteGuard>
              <Layout 
                showUserMenu={false} 
                user={user} 
                isAuthenticated={isAuthenticated}
              >
                <ProfileCompletionPage />
              </Layout>
            </RouteGuard>
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
                title={t('nav.dashboard')} 
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
                title={t('nav.pricing')} 
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
                title={t('nav.scheduling')} 
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
                title={t('nav.appointments')} 
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
                title={t('nav.messages')} 
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
                title={t('nav.uploads')} 
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
                title={t('nav.invoices')} 
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
              title={t('nav.interview')}
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
          path="/admin" 
          element={
            <RouteGuard>
              <Layout 
                title={t('nav.admin')} 
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
                title={t('admin.userManagement')}
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
                title={t('admin.userDetails')}
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
                title={t('admin.pricingManagement')}
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
                title={t('admin.caseManagement')}
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
                title={t('case.detail.title')}
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
