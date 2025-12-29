import { useState } from 'react'
import { useAuth } from './useAuth'

export interface NotificationTemplate {
  id: number
  type: string
  subjectTemplate: string
  bodyTemplate: string
  emailBodyTemplate: string | null
}

export interface SendAlertRequest {
  userId: string
  title: string
  message: string
  priority: 'Low' | 'Normal' | 'High' | 'Critical'
}

export const useAdminAlerts = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getAuthHeaders } = useAuth()

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const headers = await getAuthHeaders()
      const response = await fetch('/api/notifications/templates', {
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notification templates')
      }

      const data = await response.json()
      setTemplates(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateTemplate = async (id: number, subjectTemplate: string, bodyTemplate: string, emailBodyTemplate: string | null) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/notifications/templates/${id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjectTemplate,
          bodyTemplate,
          emailBodyTemplate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.title || 'Failed to update template' }
      }

      await fetchTemplates()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const sendTestAlert = async (request: SendAlertRequest) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.title || 'Failed to send alert' }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    updateTemplate,
    sendTestAlert
  }
}
