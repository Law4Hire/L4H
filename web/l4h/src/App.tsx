import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, RouteGuard, ToastContainer, useToast } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfileCompletionPage from './pages/ProfileCompletionPage'
import DashboardPage from './pages/DashboardPage'
import PricingPage from './pages/PricingPage'
import SchedulingPage from './pages/SchedulingPage'
import AppointmentsPage from './pages/AppointmentsPage'
import MessagesPage from './pages/MessagesPage'
import UploadsPage from './pages/UploadsPage'
import InvoicesPage from './pages/InvoicesPage'
import VerifyPage from './pages/VerifyPage'
import VisaLibraryPage from './pages/VisaLibraryPage'
import InterviewPage from './pages/InterviewPage'
import AdminPage from './pages/AdminPage'
import UserManagementPage from './pages/UserManagementPage'
import UserDetailPage from './pages/UserDetailPage'
import AdminPricingPage from './pages/AdminPricingPage'
import { InterviewProvider } from './InterviewContext';
import AdminCaseManagementPage from './pages/AdminCaseManagementPage'
import CaseDetailPage from './pages/CaseDetailPage'
import { useAuth } from './hooks/useAuth'

function App() {
  const { t } = useTranslation()
  const { toasts, removeToast } = useToast()
  const { isAuthenticated, user } = useAuth()

  return (
    <>
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
            <RouteGuard>
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
            </RouteGuard>
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
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

export default App
