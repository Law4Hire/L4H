import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Modal, useToast } from '@l4h/shared-ui'
import { Send, Bell, Settings, AlertTriangle } from 'lucide-react'
import { useAdminAlerts, SendAlertRequest, NotificationTemplate } from '../../hooks/useAdminAlerts'

const AlertsManagementPage: React.FC = () => {
  const { templates, loading, error, fetchTemplates, updateTemplate, sendTestAlert } = useAdminAlerts()
  const { success, error: toastError } = useToast()

  const [showSendAlertModal, setShowSendAlertModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)

  const [alertFormData, setAlertFormData] = useState<SendAlertRequest>({
    userId: '',
    title: '',
    message: '',
    priority: 'Normal'
  })

  const [templateFormData, setTemplateFormData] = useState({
    subjectTemplate: '',
    bodyTemplate: '',
    emailBodyTemplate: ''
  })

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleSendAlert = async () => {
    if (!alertFormData.userId || !alertFormData.title || !alertFormData.message) {
      toastError('Please fill in all required fields')
      return
    }

    const result = await sendTestAlert(alertFormData)
    if (result.success) {
      success('Alert sent successfully')
      setShowSendAlertModal(false)
      setAlertFormData({
        userId: '',
        title: '',
        message: '',
        priority: 'Normal'
      })
    } else {
      toastError(result.error || 'Failed to send alert')
    }
  }

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setTemplateFormData({
      subjectTemplate: template.subjectTemplate,
      bodyTemplate: template.bodyTemplate,
      emailBodyTemplate: template.emailBodyTemplate || ''
    })
    setShowTemplateModal(true)
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return

    const result = await updateTemplate(
      editingTemplate.id,
      templateFormData.subjectTemplate,
      templateFormData.bodyTemplate,
      templateFormData.emailBodyTemplate || null
    )

    if (result.success) {
      success('Template updated successfully')
      setShowTemplateModal(false)
      setEditingTemplate(null)
    } else {
      toastError(result.error || 'Failed to update template')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'Normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts & Notifications Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Send notifications to users and manage notification templates
          </p>
        </div>
        <Button onClick={() => setShowSendAlertModal(true)} className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          Send Alert
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 dark:bg-navy-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{templates.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 dark:bg-navy-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Notifications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 dark:bg-navy-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Notification Templates */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Notification Templates
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <Card className="p-6 text-center dark:bg-navy-900">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchTemplates} className="mt-4">Retry</Button>
          </Card>
        ) : templates.length === 0 ? (
          <Card className="p-12 text-center dark:bg-navy-900">
            <p className="text-gray-500 dark:text-gray-400">No notification templates found.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="p-6 dark:bg-navy-900">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {template.type}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Subject</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-navy-800 p-2 rounded">
                          {template.subjectTemplate}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Body</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-navy-800 p-2 rounded line-clamp-2">
                          {template.bodyTemplate}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    className="ml-4 dark:border-navy-700"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Send Alert Modal */}
      <Modal
        open={showSendAlertModal}
        onClose={() => setShowSendAlertModal(false)}
        title="Send Alert to User"
      >
        <div className="space-y-4">
          <Input
            label="User ID *"
            value={alertFormData.userId}
            onChange={(e) => setAlertFormData(prev => ({ ...prev, userId: e.target.value }))}
            placeholder="Enter user GUID"
            className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
          />

          <Input
            label="Title *"
            value={alertFormData.title}
            onChange={(e) => setAlertFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Alert title"
            className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message *
            </label>
            <textarea
              rows={4}
              value={alertFormData.message}
              onChange={(e) => setAlertFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Alert message"
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-md dark:bg-navy-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority *
            </label>
            <select
              value={alertFormData.priority}
              onChange={(e) => setAlertFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-md dark:bg-navy-800 dark:text-white"
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className={`p-3 rounded ${getPriorityColor(alertFormData.priority)}`}>
            <p className="text-sm font-semibold">Preview</p>
            <p className="text-xs mt-1">
              This alert will be sent with <strong>{alertFormData.priority}</strong> priority
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowSendAlertModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendAlert}>
              <Send className="w-4 h-4 mr-2" />
              Send Alert
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={`Edit Template: ${editingTemplate?.type}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject Template
            </label>
            <Input
              value={templateFormData.subjectTemplate}
              onChange={(e) => setTemplateFormData(prev => ({ ...prev, subjectTemplate: e.target.value }))}
              placeholder="Use {{variable}} for dynamic content"
              className="dark:bg-navy-800 dark:border-navy-700 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Body Template
            </label>
            <textarea
              rows={6}
              value={templateFormData.bodyTemplate}
              onChange={(e) => setTemplateFormData(prev => ({ ...prev, bodyTemplate: e.target.value }))}
              placeholder="Use {{variable}} for dynamic content"
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-md dark:bg-navy-800 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Body Template (optional)
            </label>
            <textarea
              rows={6}
              value={templateFormData.emailBodyTemplate}
              onChange={(e) => setTemplateFormData(prev => ({ ...prev, emailBodyTemplate: e.target.value }))}
              placeholder="HTML email template (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-md dark:bg-navy-800 dark:text-white font-mono"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              <strong>Tip:</strong> Use variables like {"{{userName}}"}, {"{{caseId}}"}, {"{{deadline}}"} for dynamic content.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Settings className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>
      </Modal>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Note:</strong> Notifications are delivered to users through the in-app notification center.
          Email notifications are sent based on user preferences. Templates use Mustache-style variable substitution.
        </p>
      </Card>
    </div>
  )
}

export default AlertsManagementPage
