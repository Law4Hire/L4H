import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

interface TimeEntry {
  id: number
  clientId: number
  client: {
    id: number
    firstName: string
    lastName: string
  }
  attorneyId: number
  attorney: {
    id: number
    name: string
  }
  startTime: string
  endTime: string
  duration: number // In hours (0.1 increments)
  description: string
  notes?: string
  hourlyRate: number
  billableAmount: number
  isBilled: boolean
  billedDate?: string
  createdAt: string
}

interface TimeEntryFilters {
  clientId?: number
  attorneyId?: number
  startDate?: string
  endDate?: string
  isBilled?: boolean
  sortBy?: 'date' | 'client' | 'duration' | 'amount'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

interface TimeEntriesResponse {
  timeEntries: TimeEntry[]
  totalCount: number
  totalPages: number
  currentPage: number
  totalHours: number
  totalAmount: number
  unbilledAmount: number
}

interface TimeEntryResult {
  success: boolean
  error?: string
  timeEntry?: TimeEntry
}

export function useTimeEntries(initialFilters?: TimeEntryFilters) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalHours, setTotalHours] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [unbilledAmount, setUnbilledAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchTimeEntries(initialFilters)
  }, [user])

  const fetchTimeEntries = async (filters?: TimeEntryFilters) => {
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
      if (filters?.clientId) params.append('clientId', filters.clientId.toString())
      if (filters?.attorneyId) params.append('attorneyId', filters.attorneyId.toString())
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.isBilled !== undefined) params.append('isBilled', filters.isBilled.toString())
      if (filters?.sortBy) params.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())

      const response = await fetch(`/api/v1/time-entries?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied: You do not have permission to view time entries')
        }
        throw new Error('Failed to fetch time entries')
      }
      
      const result: TimeEntriesResponse = await response.json()
      setTimeEntries(result.timeEntries)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setCurrentPage(result.currentPage)
      setTotalHours(result.totalHours)
      setTotalAmount(result.totalAmount)
      setUnbilledAmount(result.unbilledAmount)
      setError(null)
    } catch (err) {
      console.error('Error fetching time entries:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeEntry = async (id: number): Promise<TimeEntry> => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/time-entries/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch time entry')
      }
      
      return await response.json()
    } catch (err) {
      console.error('Error fetching time entry:', err)
      throw err
    }
  }

  const createTimeEntry = async (timeEntry: Partial<TimeEntry>): Promise<TimeEntryResult> => {
    if (!user || user.role !== 'LegalProfessional') {
      return { success: false, error: 'Unauthorized: Legal professional access required' }
    }

    try {
      setIsUpdating(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch('/api/v1/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(timeEntry)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to create time entry')
      }

      const newTimeEntry = await response.json()
      await fetchTimeEntries(initialFilters) // Refresh data
      return { success: true, timeEntry: newTimeEntry }
    } catch (err) {
      console.error('Error creating time entry:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const updateTimeEntry = async (id: number, updates: Partial<TimeEntry>): Promise<TimeEntryResult> => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/time-entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update time entry')
      }

      const updatedTimeEntry = await response.json()
      await fetchTimeEntries(initialFilters) // Refresh data
      return { success: true, timeEntry: updatedTimeEntry }
    } catch (err) {
      console.error('Error updating time entry:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteTimeEntry = async (id: number): Promise<TimeEntryResult> => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/time-entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete time entry')
      }

      await fetchTimeEntries(initialFilters) // Refresh data
      return { success: true }
    } catch (err) {
      console.error('Error deleting time entry:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const getTimeEntriesByClient = async (clientId: number) => {
    return fetchTimeEntries({ ...initialFilters, clientId })
  }

  const getUnbilledTimeEntries = async () => {
    return fetchTimeEntries({ ...initialFilters, isBilled: false })
  }

  const getTimeEntriesForDateRange = async (startDate: string, endDate: string) => {
    return fetchTimeEntries({ ...initialFilters, startDate, endDate })
  }

  const canEditTimeEntry = (timeEntry: TimeEntry): boolean => {
    if (!user) return false
    
    // Admin can edit any time entry
    if (user.role === 'Admin') return true
    
    // Legal professional can edit their own time entries if not billed
    if (user.role === 'LegalProfessional' && 
        user.attorneyId === timeEntry.attorneyId && 
        !timeEntry.isBilled) {
      return true
    }
    
    return false
  }

  const canDeleteTimeEntry = (timeEntry: TimeEntry): boolean => {
    if (!user) return false
    
    // Admin can delete any unbilled time entry
    if (user.role === 'Admin' && !timeEntry.isBilled) return true
    
    // Legal professional can delete their own unbilled time entries
    if (user.role === 'LegalProfessional' && 
        user.attorneyId === timeEntry.attorneyId && 
        !timeEntry.isBilled) {
      return true
    }
    
    return false
  }

  const formatDuration = (hours: number): string => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    
    if (wholeHours === 0) {
      return `${minutes}m`
    } else if (minutes === 0) {
      return `${wholeHours}h`
    } else {
      return `${wholeHours}h ${minutes}m`
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return {
    timeEntries,
    totalCount,
    totalPages,
    currentPage,
    totalHours,
    totalAmount,
    unbilledAmount,
    isLoading,
    error,
    isUpdating,
    getTimeEntry,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getTimeEntriesByClient,
    getUnbilledTimeEntries,
    getTimeEntriesForDateRange,
    searchTimeEntries: fetchTimeEntries,
    refetch: () => fetchTimeEntries(initialFilters),
    canEditTimeEntry,
    canDeleteTimeEntry,
    formatDuration,
    formatCurrency
  }
}