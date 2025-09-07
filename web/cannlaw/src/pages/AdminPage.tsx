import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Button } from '@l4h/shared-ui'

const AdminPage: React.FC = () => {
  const { t } = useTranslation()

  const handlePricingEditor = () => {
    // TODO: Navigate to pricing editor
    console.log('Navigate to pricing editor')
  }

  const handleWorkflowReview = () => {
    // TODO: Navigate to workflow review
    console.log('Navigate to workflow review')
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
        <Card title={t('admin.pricing')}>
          <p className="text-gray-600 mb-4">
            Manage pricing plans and service costs
          </p>
          <Button onClick={handlePricingEditor}>
            {t('common.edit')}
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

        <Card title={t('admin.settings')}>
          <p className="text-gray-600 mb-4">
            System configuration and settings
          </p>
          <Button variant="outline" disabled>
            {t('common.view')}
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default AdminPage
