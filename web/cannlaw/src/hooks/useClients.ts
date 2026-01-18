import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { fetchJson } from '@l4h/shared-ui'

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

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchClients = useCallback(async (filters?: SearchFilters) => {
    try {
      setIsLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      
      // Apply role-based filtering logic
      if (user?.role === 'LegalProfessional' && user.attorneyId) {
        params.append('attorneyId', user.attorneyId.toString())
      }
      
      // Apply search filters
      if (filters?.searchTerm) params.append('search', filters.searchTerm)
      if (filters?.assignedAttorney) params.append('attorneyId', filters.assignedAttorney)
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

      // The backend returns Client[] directly, but with X-Total-Count header
      // fetchJson will return the body.
      const data = await fetchJson<Client[]>(`/v1/clients?${params.toString()}`)
      
      setClients(data || [])
      setTotalCount(data?.length || 0) // Fallback for pagination if headers not parsed by fetchJson
      setTotalPages(1)
      setCurrentPage(1)
      setError(null)
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchClients()
  }, [user, fetchClients])

  const getClient = useCallback(async (id: number) => {
    return await fetchJson<Client>(`/v1/clients/${id}`)
  }, [])

  const createClient = useCallback(async (client: Partial<Client>) => {
    try {
      const data = await fetchJson<Client>('/v1/clients', {
        method: 'POST',
        body: JSON.stringify(client)
      })
      await fetchClients()
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [fetchClients])

  const updateClient = useCallback(async (id: number, client: Partial<Client>) => {
    try {
      await fetchJson(`/v1/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(client)
      })
      await fetchClients()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [fetchClients])

  const assignClient = useCallback(async (clientId: number, attorneyId: number) => {
    try {
      await fetchJson(`/v1/clients/${clientId}/assign`, {
        method: 'PUT', // Backend uses PUT for assign
        body: JSON.stringify({ attorneyId })
      })
      await fetchClients()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [fetchClients])

  const getMyClients = useCallback(async () => {
    if (user?.role === 'LegalProfessional' && user.attorneyId) {
      return fetchClients({ attorneyId: user.attorneyId })
    }
    return fetchClients()
  }, [user, fetchClients])

  const getUnassignedClients = useCallback(async () => {
    if (user?.role === 'Admin') {
      return fetchClients({ unassignedOnly: true })
    }
    throw new Error('Unauthorized: Admin access required')
  }, [user, fetchClients])

  const searchClientsByName = useCallback(async (searchTerm: string) => {
    return fetchClients({ searchTerm, sortBy: 'name', sortOrder: 'asc' })
  }, [fetchClients])

  const getClientsByStatus = useCallback(async (status: CaseStatus) => {
    return fetchClients({ caseStatus: status })
  }, [fetchClients])

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
        c.cases && c.cases.some(case_ => 
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