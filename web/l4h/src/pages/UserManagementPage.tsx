import React, { useState, useEffect } from 'react'
import { Card, Button, Input, useToast, admin, Modal } from '@l4h/shared-ui'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
  isStaff: boolean
  isActive: boolean
  emailVerified: boolean
  createdAt: string
}

interface CreateUserForm {
  email: string
  firstName: string
  lastName: string
  password: string
  isAdmin: boolean
  isStaff: boolean
}

const UserManagementPage: React.FC = () => {
  const { error, success } = useToast()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    isAdmin: false,
    isStaff: false
  })

  // Load users
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await admin.users()
      setUsers(data)
    } catch (err) {
      error('Failed to load users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }


  const handleCreateUser = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password) {
      error('Please fill in all required fields')
      return
    }

    try {
      setCreating(true)
      
      await admin.createUser(formData)

      success('User created successfully')
      setShowCreateModal(false)
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        isAdmin: false,
        isStaff: false
      })
      fetchUsers()
    } catch (err: any) {
      error('Failed to create user', err.detail || err.message)
    } finally {
      setCreating(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                User Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage user roles and permissions for the Law4Hire platform
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              Create User
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card title="Search Users">
        <Input
          placeholder="Search by email, first name, or last name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </div>
      </Card>

      {/* Users Table */}
      <Card title="Users">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-300">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigate(`/admin/users/${user.id}`)
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No users found matching your search criteria.
            </div>
          )}
        </div>
      </Card>

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
              required
            />

            <Input
              label="Last Name *"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>

          <Input
            label="Password *"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
          />

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Administrator</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isStaff}
                onChange={(e) => setFormData({ ...formData, isStaff: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Legal Professional</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              loading={creating}
            >
              Create User
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}

export default UserManagementPage