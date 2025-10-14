import { useState } from 'react'
import { useAuth } from './useAuth'

enum CaseStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Paid = 'Paid',
  FormsCompleted = 'Forms Completed',
  Complete = 'Complete',
  ClosedRejected = 'Closed (US Government Rejected)'
}

interface CaseStatusHistory {
  id: number
  caseId: number
  previousStatus: CaseStatus
  newStatus: CaseStatus
  changedBy: string
  changedAt: string
  notes?: string
}

interface StatusUpdateRequest {
  newStatus: CaseStatus
  notes?: string
  rejectionReason?: string // Required for ClosedRejected status
  governmentCaseNumber?: string
}

interface StatusUpdateResult {
  success: boolean
  error?: string
  statusHistory?: CaseStatusHistory
}

export function useCaseStatus() {
  const [isUpdating, setIsUpdating] = useState(false)
  const { user } = useAuth()

  const updateCaseStatus = async (caseId: number, update: StatusUpdateRequest): Promise<StatusUpdateResult> => {
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate status transition
    const validationResult = validateStatusTransition(update.newStatus, update)
    if (!validationResult.isValid) {
      return { success: false, error: validationResult.error }
    }

    try {
      setIsUpdating(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(update)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update case status')
      }

      const result = await response.json()
      return { success: true, statusHistory: result }
    } catch (err) {
      console.error('Error updating case status:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const getCaseStatusHistory = async (caseId: number): Promise<CaseStatusHistory[]> => {
    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/cases/${caseId}/status-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch case status history')
      }

      return await response.json()
    } catch (err) {
      console.error('Error fetching case status history:', err)
      throw err
    }
  }

  const validateStatusTransition = (newStatus: CaseStatus, update: StatusUpdateRequest) => {
    // Validate required fields for specific statuses
    if (newStatus === CaseStatus.ClosedRejected && !update.rejectionReason) {
      return { 
        isValid: false, 
        error: 'Rejection reason is required when marking case as rejected' 
      }
    }

    if (newStatus === CaseStatus.Complete && !update.notes) {
      return { 
        isValid: false, 
        error: 'Completion notes are required when marking case as complete' 
      }
    }

    return { isValid: true }
  }

  const getValidNextStatuses = (currentStatus: CaseStatus): CaseStatus[] => {
    const statusFlow: Record<CaseStatus, CaseStatus[]> = {
      [CaseStatus.NotStarted]: [CaseStatus.InProgress, CaseStatus.ClosedRejected],
      [CaseStatus.InProgress]: [CaseStatus.Paid, CaseStatus.ClosedRejected],
      [CaseStatus.Paid]: [CaseStatus.FormsCompleted, CaseStatus.ClosedRejected],
      [CaseStatus.FormsCompleted]: [CaseStatus.Complete, CaseStatus.ClosedRejected],
      [CaseStatus.Complete]: [], // Terminal state
      [CaseStatus.ClosedRejected]: [] // Terminal state
    }

    return statusFlow[currentStatus] || []
  }

  const getStatusColor = (status: CaseStatus): string => {
    const colors: Record<CaseStatus, string> = {
      [CaseStatus.NotStarted]: 'gray',
      [CaseStatus.InProgress]: 'blue',
      [CaseStatus.Paid]: 'green',
      [CaseStatus.FormsCompleted]: 'purple',
      [CaseStatus.Complete]: 'emerald',
      [CaseStatus.ClosedRejected]: 'red'
    }

    return colors[status] || 'gray'
  }

  const getStatusIcon = (status: CaseStatus): string => {
    const icons: Record<CaseStatus, string> = {
      [CaseStatus.NotStarted]: '⏸️',
      [CaseStatus.InProgress]: '🔄',
      [CaseStatus.Paid]: '💰',
      [CaseStatus.FormsCompleted]: '📋',
      [CaseStatus.Complete]: '✅',
      [CaseStatus.ClosedRejected]: '❌'
    }

    return icons[status] || '❓'
  }

  const canUpdateStatus = (clientAssignedAttorneyId?: number): boolean => {
    if (!user) return false
    
    // Admin can update any case status
    if (user.role === 'Admin') return true
    
    // Legal professional can update status for their assigned clients
    if (user.role === 'LegalProfessional' && user.attorneyId === clientAssignedAttorneyId) {
      return true
    }
    
    return false
  }

  const formatStatusHistory = (history: CaseStatusHistory[]) => {
    return history
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
      .map(entry => ({
        ...entry,
        formattedDate: new Date(entry.changedAt).toLocaleDateString(),
        formattedTime: new Date(entry.changedAt).toLocaleTimeString(),
        statusChange: `${entry.previousStatus} → ${entry.newStatus}`
      }))
  }

  return {
    isUpdating,
    updateCaseStatus,
    getCaseStatusHistory,
    getValidNextStatuses,
    getStatusColor,
    getStatusIcon,
    canUpdateStatus,
    formatStatusHistory,
    CaseStatus
  }
}