import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@l4h/shared-ui'

const AdminPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {'Admin'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administrative dashboard for managing the Law4Hire platform
          </p>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="User Management">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage users, roles, and permissions</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              console.log('Manage Users button clicked - navigating to /admin/users');
              navigate('/admin/users');
            }}
            className="w-full !bg-blue-600 !text-white hover:!bg-blue-700"
            style={{ backgroundColor: '#2563eb !important', color: '#ffffff !important' }}
          >
            Manage Users
          </Button>
        </Card>

        <Card title="Case Management">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Review and manage immigration cases</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              console.log('Manage Cases button clicked - navigating to /admin/cases')
              navigate('/admin/cases')
            }}
            className="w-full !bg-blue-600 !text-white hover:!bg-blue-700"
            style={{ backgroundColor: '#2563eb !important', color: '#ffffff !important' }}
          >
            Manage Cases
          </Button>
        </Card>

        <Card title="Pricing & Packages">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Configure service packages and pricing</p>
          <div className="space-y-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                console.log('Manage Pricing button clicked - navigating to /admin/pricing')
                navigate('/admin/pricing')
              }}
              className="w-full !bg-blue-600 !text-white hover:!bg-blue-700"
              style={{ backgroundColor: '#2563eb !important', color: '#ffffff !important' }}
            >
              Manage Pricing
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                console.log('Manage Packages button clicked - navigating to /admin/packages')
                navigate('/admin/packages')
              }}
              className="w-full"
            >
              Manage Packages
            </Button>
          </div>
        </Card>

        <Card title="Interview Questions">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage customer interview questions and flow</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              console.log('Manage Interview Questions button clicked - navigating to /admin/interview-questions')
              navigate('/admin/interview-questions')
            }}
            className="w-full !bg-blue-600 !text-white hover:!bg-blue-700"
            style={{ backgroundColor: '#2563eb !important', color: '#ffffff !important' }}
          >
            Manage Questions
          </Button>
        </Card>

        <Card title="Admin Paths">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Configure admin navigation paths and hierarchy</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              console.log('Manage Paths button clicked - navigating to /admin/paths')
              navigate('/admin/paths')
            }}
            className="w-full !bg-blue-600 !text-white hover:!bg-blue-700"
            style={{ backgroundColor: '#2563eb !important', color: '#ffffff !important' }}
          >
            Manage Paths
          </Button>
        </Card>

        <Card title="USCIS Forms">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage immigration forms, pricing, and dependencies</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              console.log('Manage USCIS Forms button clicked - navigating to /admin/uscis-forms')
              navigate('/admin/uscis-forms')
            }}
            className="w-full !bg-blue-600 !text-white hover:!bg-blue-700"
            style={{ backgroundColor: '#2563eb !important', color: '#ffffff !important' }}
          >
            Manage Forms
          </Button>
        </Card>

        <Card title="Visa Library">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage visa library categories and assign visa types</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              console.log('Manage Visa Library button clicked - navigating to /admin/visa-library')
              navigate('/admin/visa-library')
            }}
            className="w-full !bg-blue-600 !text-white hover:!bg-blue-700"
            style={{ backgroundColor: '#2563eb !important', color: '#ffffff !important' }}
          >
            Manage Library
          </Button>
        </Card>

        <Card title="Reports & Analytics">
          <p className="text-gray-600 dark:text-gray-400 mb-4">View platform statistics and reports</p>
          <div className="text-sm text-gray-500 dark:text-gray-400">Coming soon...</div>
        </Card>

        <Card title="System Settings">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Configure platform settings and features</p>
          <div className="text-sm text-gray-500 dark:text-gray-400">Coming soon...</div>
        </Card>

        <Card title="Legal Professionals">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage legal professional accounts</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              console.log('Manage Attorneys button clicked - navigating to /admin/attorneys')
              navigate('/admin/attorneys')
            }}
            className="w-full !bg-blue-600 !text-white hover:!bg-blue-700"
            style={{ backgroundColor: '#2563eb !important', color: '#ffffff !important' }}
          >
            Manage Attorneys
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default AdminPage