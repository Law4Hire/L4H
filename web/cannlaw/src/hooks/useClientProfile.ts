import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

interface Client {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  countryOfOrigin: string
  assignedAttorneyId?: number
  assignedAttorney?: {
    id: number
    name: string
    email: string
    photoUrl?: string
  }
  cases: Case[]
  documents: Document[]
  timeEntries: TimeEntry[]
  createdAt: string
  updatedAt: string
}

interface Case {
  id: number
  clientId: number
  caseType: string
  status: CaseStatus
  description: string
  startDate: string
  completionDate?: string
  governmentCaseNumber?: string
  rejectionReason?: string
  notes?: string
  statusHistory: CaseStatusHistory[]
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

interface Document {
  id: number
  clientId: number
  fileName: string
  originalFileName: string
  fileUrl: string
  contentType: string
  fileSize: number
  category: DocumentCategory
  description?: string
  uploadDate: string
  uploadedBy: string
}

interface TimeEntry {
  id: number
  clientId: number
  attorneyId: number
  attorney: {
    id: number
    name: string
  }
  startTime: string
  endTime: string
  duration: number
  description: string
  notes?: string
  hourlyRate: number
  billableAmount: number
  isBilled: boolean
  billedDate?: string
  createdAt: string
}

enum CaseStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Paid = 'Paid',
  FormsCompleted = 'Forms Completed',
  Complete = 'Complete',
  ClosedRejected = 'Closed (US Government Rejected)'
}

enum DocumentCategory {
  PersonalDocuments = 'Personal Documents',
  GovernmentForms = 'Government Forms',
  SupportingEvidence = 'Supporting Evidence',
  Correspondence = 'Correspondence',
  Legal = 'Legal',
  Other = 'Other'
}

interface UpdateResult {
  success: boolean
  error?: string
}

export function useClientProfile(clientId: number) {
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Client not found')
        } else if (response.status === 403) {
          throw new Error('Access denied: You do not have permission to view this client')
        }
        throw new Error('Failed to fetch client profile')
      }
      
      const clientData = await response.json()
      setClient(clientData)
    } catch (err) {
      console.error('Error fetching client profile:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateClient = async (updates: Partial<Client>): Promise<UpdateResult> => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update client')
      }

      // Refresh client data
      await fetchClient()
      return { success: true }
    } catch (err) {
      console.error('Error updating client:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const addNote = async (note: string): Promise<UpdateResult> => {
    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/clients/${clientId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to add note')
      }

      // Refresh client data
      await fetchClient()
      return { success: true }
    } catch (err) {
      console.error('Error adding note:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    }
  }

  const canEdit = () => {
    if (!user || !client) return false
    
    // Admin can edit any client
    if (user.role === 'Admin') return true
    
    // Legal professional can edit their assigned clients
    if (user.role === 'LegalProfessional' && user.attorneyId === client.assignedAttorneyId) {
      return true
    }
    
    return false
  }

  const canViewBilling = () => {
    if (!user) return false
    
    // Admin can view all billing
    if (user.role === 'Admin') return true
    
    // Legal professional can view billing for their clients
    if (user.role === 'LegalProfessional' && user.attorneyId === client?.assignedAttorneyId) {
      return true
    }
    
    return false
  }

  const getTotalBillableAmount = () => {
    if (!client?.timeEntries) return 0
    return client.timeEntries.reduce((total, entry) => total + entry.billableAmount, 0)
  }

  const getTotalHours = () => {
    if (!client?.timeEntries) return 0
    return client.timeEntries.reduce((total, entry) => total + entry.duration, 0)
  }

  const getUnbilledAmount = () => {
    if (!client?.timeEntries) return 0
    return client.timeEntries
      .filter(entry => !entry.isBilled)
      .reduce((total, entry) => total + entry.billableAmount, 0)
  }

  return {
    client,
    isLoading,
    error,
    isUpdating,
    updateClient,
    addNote,
    refetch: fetchClient,
    canEdit: canEdit(),
    canViewBilling: canViewBilling(),
    getTotalBillableAmount,
    getTotalHours,
    getUnbilledAmount
  }
}