import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Button } from '@l4h/shared-ui'

const AdminPage: React.FC = () => {
  const { t } = useTranslation()
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

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('admin.title')}
          </h1>
          <p className="text-gray-600">
            {t('app.tagline')}
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

        <Card title="Reports & Analytics">
          <p className="text-gray-600 mb-4">
            View business metrics and performance data
          </p>
          <Button onClick={handleReportsAnalytics}>
            View Reports
          </Button>
        </Card>

        <Card title={t('admin.pricing')}>
          <p className="text-gray-600 mb-4">
            Manage pricing plans and service costs
          </p>
          <Button onClick={handlePricingEditor}>
            {t('common.edit')}
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
            {t('common.view')}
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default AdminPage
