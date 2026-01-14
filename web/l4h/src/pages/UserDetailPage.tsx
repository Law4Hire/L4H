import React, { useState, useEffect } from 'react'
import { Card, Button, Input, useToast, admin } from '@l4h/shared-ui'
import { useNavigate, useParams } from 'react-router-dom'

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

const UserDetailPage: React.FC = () => {
  const { success, error } = useToast()
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isEditingBasic, setIsEditingBasic] = useState(false)
  const [basicFormData, setBasicFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  const fetchUser = React.useCallback(async (id: string) => {
    try {
      setLoading(true)
      const users = await admin.users()
      console.log('All users:', users)
      const foundUser = users.find((u: User) => u.id === id)
      console.log('Found user:', foundUser)
      if (foundUser) {
        setUser(foundUser)
        setBasicFormData({
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          email: foundUser.email
        })
      } else {
        error('User not found')
        navigate('/admin/users')
      }
    } catch (err) {
      error('Failed to load user details')
      console.error('Error fetching user:', err)
    } finally {
      setLoading(false)
    }
  }, [error, navigate])

  // Load user details
  useEffect(() => {
    if (userId) {
      fetchUser(userId)
    }
  }, [userId, fetchUser])

  const handleUpdateBasic = async () => {
    if (!user) return
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(basicFormData)
      })

      if (response.ok) {
        setUser({ ...user, ...basicFormData })
        setIsEditingBasic(false)
        success('User details updated successfully')
      } else {
        const data = await response.json()
        error('Failed to update user', data.detail || 'Unknown error')
      }
    } catch (err) {
      error('Error updating user')
    }
  }

  const updateUserRole = async (isAdmin: boolean, isStaff: boolean) => {
    if (!user) return

    try {
      console.log('Updating user roles:', { userId: user.id, isAdmin, isStaff })
      await admin.updateUserRoles(user.id, { isAdmin, isStaff })
      setUser({ ...user, isAdmin, isStaff })
      success('User roles updated successfully')
    } catch (err) {
      error('Failed to update user roles')
      console.error('Error updating user roles:', err)
    }
  }

  const toggleUserStatus = async (isActive: boolean) => {
    if (!user) return

    try {
      console.log('Toggling user status:', { userId: user.id, isActive })
      await admin.changeUserStatus(user.id, isActive)
      setUser({ ...user, isActive })
      success(`User ${isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
      error('Failed to update user status')
      console.error('Error updating user status:', err)
    }
  }

  const handlePasswordChange = async () => {
    if (!user || !newPassword.trim()) {
      error('Please enter a new password')
      return
    }

    try {
      console.log('Changing password for user:', user.id)
      await admin.changeUserPassword(user.id, newPassword)
      success('Password changed successfully')
      setNewPassword('')
    } catch (err) {
      error('Failed to change password')
      console.error('Error changing password:', err)
    }
  }

  const handleDeleteUser = async () => {
    if (!user) return

    try {
      console.log('Deleting user:', user.id)
      await admin.deleteUser(user.id)
      success('User deleted successfully')
      navigate('/admin/users')
    } catch (err) {
      error('Failed to delete user')
      console.error('Error deleting user:', err)
    }
  }

  const handleVerifyEmail = () => {
    success('Email verification sent (demo mode)')
  }

  const [showLinkModal, setShowLinkModal] = useState(false)
  const [verificationLink, setVerificationLink] = useState('')

  const handleResendEmail = () => {
    const link = `${window.location.origin}/verify?token=demo-token-${user?.id}`
    setVerificationLink(link)
    setShowLinkModal(true)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(verificationLink)
      success('Link copied to clipboard')
    } catch (err) {
      console.error('Failed to copy:', err)
      error('Failed to copy link to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading user details...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">User not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditingBasic ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="First Name"
                    value={basicFormData.firstName}
                    onChange={(e) => setBasicFormData({ ...basicFormData, firstName: e.target.value })}
                  />
                  <Input
                    label="Last Name"
                    value={basicFormData.lastName}
                    onChange={(e) => setBasicFormData({ ...basicFormData, lastName: e.target.value })}
                  />
                  <Input
                    label="Email"
                    value={basicFormData.email}
                    onChange={(e) => setBasicFormData({ ...basicFormData, email: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {isEditingBasic ? (
                <>
                  <Button variant="ghost" onClick={() => setIsEditingBasic(false)}>Cancel</Button>
                  <Button onClick={handleUpdateBasic}>Save</Button>
                </>
              ) : (
                <Button variant="ghost" onClick={() => setIsEditingBasic(true)}>Edit</Button>
              )}
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/users')}
                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to Users
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <Card title="Account Status">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Active Status</h3>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                user.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
              <Button
                size="sm"
                variant={user.isActive ? "ghost" : "primary"}
                onClick={() => toggleUserStatus(!user.isActive)}
                className={user.isActive ? "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" : ""}
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Email Verification</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  user.emailVerified
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              {!user.emailVerified && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleVerifyEmail}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Manual Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResendEmail}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Resend Email
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* User Roles */}
      <Card title="User Roles">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Administrator</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Full system access and user management</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={user.isAdmin}
                onChange={(e) => updateUserRole(e.target.checked, user.isStaff)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 shadow-sm focus:border-blue-300 dark:focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 focus:ring-opacity-50 dark:bg-gray-700"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Legal Professional</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Access to case management and legal tools</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={user.isStaff}
                onChange={(e) => updateUserRole(user.isAdmin, e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 shadow-sm focus:border-blue-300 dark:focus:border-blue-500 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 focus:ring-opacity-50 dark:bg-gray-700"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Password Management */}
      <Card title="Password Management">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="flex space-x-3">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="flex-1"
              />
              <Button
                onClick={handlePasswordChange}
                disabled={!newPassword.trim()}
                variant="primary"
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card title="Danger Zone">
        <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 dark:bg-red-900/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Delete User</h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Permanently delete this user and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
              disabled={user.isAdmin}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600"
            >
              Delete User
            </Button>
          </div>
          {user.isAdmin && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Admin users cannot be deleted for security reasons.
            </p>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Delete User
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
                Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>?
                This action cannot be undone and will permanently remove all user data.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteUser}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Email Verification Link
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Link (Demo Mode)
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 break-all text-sm text-gray-900 dark:text-gray-100">
                  {verificationLink}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowLinkModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={copyToClipboard}
                >
                  Copy Link
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => window.open(verificationLink, '_blank')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Open Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDetailPage