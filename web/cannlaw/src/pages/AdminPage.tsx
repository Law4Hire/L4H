import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@l4h/shared-ui'

const AdminPage: React.FC = () => {
  const navigate = useNavigate()

  const handleUserManagement = () => {
    navigate('/admin/users')
  }

  const handleCaseManagement = () => {
    navigate('/admin/cases')
  }

  const handlePricingEditor = () => {
    navigate('/admin/pricing')
  }

  const handleReportsAnalytics = () => {
    navigate('/admin/reports')
  }

  const handleTimeEntries = () => {
    navigate('/admin/time-entries')
  }

  const handleWorkflowReview = () => {
    navigate('/admin/workflows')
  }

  const handleServicesManagement = () => {
    navigate('/admin/services')
  }

  const handleVisaLibraryManagement = () => {
    navigate('/admin/visa-library')
  }

  const handleAlertsManagement = () => {
    navigate('/admin/alerts')
  }

  const handleAttorneysManagement = () => {
    navigate('/admin/attorneys')
  }

  const handleSiteConfig = () => {
    navigate('/admin/config')
  }

  const handleAppointmentsManagement = () => {
    navigate('/admin/appointments')
  }

  const handleInterviewEditor = () => {
    navigate('/admin/interview')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('admin.title')}
          </h1>
          <p className="text-gray-600">
            {'Your immigration journey starts here.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="User Management">
          <p className="text-gray-600 mb-4">
            Manage users, roles, and permissions
          </p>
          <Button onClick={handleUserManagement}>
            Manage Users
          </Button>
        </Card>

        <Card title="Case Management">
          <p className="text-gray-600 mb-4">
            Review and manage immigration cases
          </p>
          <Button onClick={handleCaseManagement}>
            Manage Cases
          </Button>
        </Card>

        <Card title={t('admin.pricing')}>
          <p className="text-gray-600 mb-4">
            Manage pricing plans and service costs
          </p>
          <Button onClick={handlePricingEditor}>
            {'Edit'}
          </Button>
        </Card>

        <Card title="Time Entries">
          <p className="text-gray-600 mb-4">
            Track and manage billable hours
          </p>
          <Button onClick={handleTimeEntries}>
            Manage Time
          </Button>
        </Card>

        <Card title={t('admin.workflows')}>
          <p className="text-gray-600 mb-4">
            Review and approve workflow changes
          </p>
          <Button onClick={handleWorkflowReview}>
            {'View'}
          </Button>
        </Card>

        <Card title="Services Management">
          <p className="text-gray-600 mb-4">
            Manage service categories and offerings
          </p>
          <Button onClick={handleServicesManagement}>
            Manage Services
          </Button>
        </Card>

        <Card title="Visa Library">
          <p className="text-gray-600 mb-4">
            Organize visa types into tiles for the public visa library
          </p>
          <Button onClick={handleVisaLibraryManagement}>
            Manage Visa Library
          </Button>
        </Card>

        <Card title="Alerts & Notifications">
          <p className="text-gray-600 mb-4">
            Send alerts to users and manage notification templates
          </p>
          <Button onClick={handleAlertsManagement}>
            Manage Alerts
          </Button>
        </Card>

        <Card title="Attorney Management">
          <p className="text-gray-600 mb-4">
            Manage attorney profiles and information
          </p>
          <Button onClick={handleAttorneysManagement}>
            Manage Attorneys
          </Button>
        </Card>

        <Card title="Appointments">
          <p className="text-gray-600 mb-4">
            View and manage client appointments and staff assignments
          </p>
          <Button onClick={handleAppointmentsManagement}>
            Manage Appointments
          </Button>
        </Card>

        <Card title="Interview Editor">
          <p className="text-gray-600 mb-4">
            Manage interview questions and decision trees
          </p>
          <Button onClick={handleInterviewEditor}>
            Edit Interview
          </Button>
        </Card>

        <Card title="Reports & Analytics">
          <p className="text-gray-600 mb-4">
            View business metrics and performance data
          </p>
          <Button onClick={handleReportsAnalytics}>
            View Reports
          </Button>
        </Card>

        <Card title="Site Configuration">
          <p className="text-gray-600 mb-4">
            Configure site settings and branding
          </p>
          <Button onClick={handleSiteConfig}>
            Configure Site
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default AdminPage
