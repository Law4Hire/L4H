import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, useToast } from '@l4h/shared-ui'

interface AdminPath {
  id: string
  name: string
  path: string
  description?: string
  icon?: string
  displayOrder: number
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate()

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  // Static paths for reliability
  const displayPaths = [
    { name: 'User Management', path: '/admin/users', description: 'Manage users, roles, and permissions', displayOrder: 1 },
    { name: 'Case Management', path: '/admin/cases', description: 'Review and manage immigration cases', displayOrder: 2 },
    { name: 'Pricing & Packages', path: '/admin/pricing', description: 'Configure service packages and pricing', displayOrder: 3 },
    { name: 'Interview Questions', path: '/admin/interview-questions', description: 'Manage customer interview questions and flow', displayOrder: 4 },
    { name: 'USCIS Forms', path: '/admin/uscis-forms', description: 'Manage immigration forms, pricing, and dependencies', displayOrder: 5 },
    { name: 'Visa Library', path: '/admin/visa-library', description: 'Manage visa library categories and assign visa types', displayOrder: 6 },
    { name: 'Legal Professionals', path: '/admin/attorneys', description: 'Manage legal professional accounts', displayOrder: 7 },
    { name: 'Reports & Analytics', path: '/admin/reports', description: 'View platform statistics and reports', displayOrder: 1000 },
    { name: 'System Settings', path: '/admin/system-settings', description: 'Configure platform settings including phone number', displayOrder: 1001 },
  ]

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
        {displayPaths.map((item) => (
          <Card key={item.path} title={item.name}>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description || 'Manage ' + item.name}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleNavigate(item.path)}
              className="w-full !bg-blue-600 !text-white hover:!bg-blue-700"
              style={{ backgroundColor: '#2563eb !important', color: '#ffffff !important' }}
            >
              {item.name === 'System Settings' ? 'Configure Settings' : `Manage ${item.name.split(' ')[0]}`}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AdminPage