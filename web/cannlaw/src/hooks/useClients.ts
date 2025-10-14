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

enum CaseStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress', 
  Paid = 'Paid',
  FormsCompleted = 'Forms Completed',
  Complete = 'Complete',
  ClosedRejected = 'Closed (US Government Rejected)'
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
}

interface Document {
  id: number
  clientId: number
  fileName: string
  originalFileName: string
  category: string
  uploadDate: string
}

interface TimeEntry {
  id: number
  clientId: number
  attorneyId: number
  duration: number
  billableAmount: number
  isBilled: boolean
  createdAt: string
}

interface SearchFilters {
  searchTerm?: string
  assignedAttorney?: string
  attorneyId?: number
  caseStatus?: string
  caseType?: string
  dateRange?: string
  unassignedOnly?: boolean
  hasActiveCase?: boolean
  sortBy?: 'name' | 'createdAt' | 'lastActivity' | 'caseStatus'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

interface ClientsResponse {
  clients: Client[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchClients()
  }, [user])

  const fetchClients = async (filters?: SearchFilters) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('jwt_token')
      
      // Build query parameters with role-based filtering
      const params = new URLSearchParams()
      
      // Apply role-based filtering
      if (user?.role === 'LegalProfessional' && user.attorneyId) {
        params.append('attorneyId', user.attorneyId.toString())
      }
      
      // Apply search filters
      if (filters?.searchTerm) params.append('search', filters.searchTerm)
      if (filters?.assignedAttorney) params.append('attorney', filters.assignedAttorney)
      if (filters?.attorneyId) params.append('attorneyId', filters.attorneyId.toString())
      if (filters?.caseStatus) params.append('status', filters.caseStatus)
      if (filters?.caseType) params.append('caseType', filters.caseType)
      if (filters?.dateRange) params.append('dateRange', filters.dateRange)
      if (filters?.unassignedOnly) params.append('unassignedOnly', 'true')
      if (filters?.hasActiveCase !== undefined) params.append('hasActiveCase', filters.hasActiveCase.toString())
      if (filters?.sortBy) params.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())

      const response = await fetch(`/api/v1/clients?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied: You do not have permission to view clients')
        }
        throw new Error('Failed to fetch clients')
      }
      
      const result: ClientsResponse = await response.json()
      setClients(result.clients)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setCurrentPage(result.currentPage)
      setError(null)
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const getClient = async (id: number) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch client')
      }
      
      return await response.json()
    } catch (err) {
      console.error('Error fetching client:', err)
      throw err
    }
  }

  const createClient = async (client: Partial<Client>) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(client)
      })

      if (!response.ok) {
        throw new Error('Failed to create client')
      }

      const newClient = await response.json()
      await fetchClients() // Refresh data
      return { success: true, data: newClient }
    } catch (err) {
      console.error('Error creating client:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const updateClient = async (id: number, client: Partial<Client>) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(client)
      })

      if (!response.ok) {
        throw new Error('Failed to update client')
      }

      await fetchClients() // Refresh data
      return { success: true }
    } catch (err) {
      console.error('Error updating client:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const assignClient = async (clientId: number, attorneyId: number) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/clients/${clientId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attorneyId })
      })

      if (!response.ok) {
        throw new Error('Failed to assign client')
      }

      await fetchClients() // Refresh data
      return { success: true }
    } catch (err) {
      console.error('Error assigning client:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const getMyClients = async () => {
    if (user?.role === 'LegalProfessional' && user.attorneyId) {
      return fetchClients({ attorneyId: user.attorneyId })
    }
    return fetchClients()
  }

  const getUnassignedClients = async () => {
    if (user?.role === 'Admin') {
      return fetchClients({ unassignedOnly: true })
    }
    throw new Error('Unauthorized: Admin access required')
  }

  const searchClientsByName = async (searchTerm: string) => {
    return fetchClients({ searchTerm, sortBy: 'name', sortOrder: 'asc' })
  }

  const getClientsByStatus = async (status: CaseStatus) => {
    return fetchClients({ caseStatus: status })
  }

  const canViewAllClients = () => {
    return user?.role === 'Admin'
  }

  const canAssignClients = () => {
    return user?.role === 'Admin'
  }

  const getClientStats = () => {
    const stats = {
      total: clients.length,
      assigned: clients.filter(c => c.assignedAttorneyId).length,
      unassigned: clients.filter(c => !c.assignedAttorneyId).length,
      withActiveCases: clients.filter(c => 
        c.cases.some(case_ => 
          case_.status !== CaseStatus.Complete && 
          case_.status !== CaseStatus.ClosedRejected
        )
      ).length
    }
    
    return stats
  }

  return {
    clients,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    error,
    getClient,
    createClient,
    updateClient,
    assignClient,
    searchClients: fetchClients,
    getMyClients,
    getUnassignedClients,
    searchClientsByName,
    getClientsByStatus,
    refetch: fetchClients,
    canViewAllClients: canViewAllClients(),
    canAssignClients: canAssignClients(),
    getClientStats
  }
}