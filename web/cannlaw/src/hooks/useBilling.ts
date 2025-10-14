import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

interface BillingSummary {
  attorneyId: number
  attorneyName: string
  totalHours: number
  totalAmount: number
  billedAmount: number
  unbilledAmount: number
  clientCount: number
  averageHourlyRate: number
  lastActivity?: string
}

interface ClientBilling {
  clientId: number
  clientName: string
  totalHours: number
  totalAmount: number
  billedAmount: number
  unbilledAmount: number
  lastActivity: string
  timeEntries: TimeEntry[]
}

interface TimeEntry {
  id: number
  startTime: string
  endTime: string
  duration: number
  description: string
  hourlyRate: number
  billableAmount: number
  isBilled: boolean
  billedDate?: string
}

interface BillingFilters {
  attorneyId?: number
  clientId?: number
  startDate?: string
  endDate?: string
  includeUnbilledOnly?: boolean
  sortBy?: 'attorney' | 'amount' | 'hours' | 'lastActivity'
  sortOrder?: 'asc' | 'desc'
}

interface BillingReport {
  summaries: BillingSummary[]
  totalRevenue: number
  totalHours: number
  totalUnbilled: number
  averageHourlyRate: number
  periodStart: string
  periodEnd: string
}

interface BillingResult {
  success: boolean
  error?: string
}

export function useBilling() {
  const [billingSummaries, setBillingSummaries] = useState<BillingSummary[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalHours, setTotalHours] = useState(0)
  const [totalUnbilled, setTotalUnbilled] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchBillingSummary()
    }
  }, [user])

  const fetchBillingSummary = async (filters?: BillingFilters) => {
    if (!user || user.role !== 'Admin') {
      setError('Unauthorized: Admin access required')
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem('jwt_token')
      
      // Build query parameters
      const params = new URLSearchParams()
      if (filters?.attorneyId) params.append('attorneyId', filters.attorneyId.toString())
      if (filters?.clientId) params.append('clientId', filters.clientId.toString())
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.includeUnbilledOnly) params.append('unbilledOnly', 'true')
      if (filters?.sortBy) params.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/v1/billing/summary?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing summary')
      }
      
      const result: BillingReport = await response.json()
      setBillingSummaries(result.summaries)
      setTotalRevenue(result.totalRevenue)
      setTotalHours(result.totalHours)
      setTotalUnbilled(result.totalUnbilled)
      setError(null)
    } catch (err) {
      console.error('Error fetching billing summary:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const getAttorneyBilling = async (attorneyId: number, filters?: BillingFilters): Promise<BillingSummary | null> => {
    if (!user || user.role !== 'Admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    try {
      const token = localStorage.getItem('jwt_token')
      
      const params = new URLSearchParams()
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.includeUnbilledOnly) params.append('unbilledOnly', 'true')

      const response = await fetch(`/api/v1/billing/attorney/${attorneyId}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch attorney billing')
      }
      
      return await response.json()
    } catch (err) {
      console.error('Error fetching attorney billing:', err)
      throw err
    }
  }

  const getClientBilling = async (clientId: number, filters?: BillingFilters): Promise<ClientBilling | null> => {
    try {
      const token = localStorage.getItem('jwt_token')
      
      const params = new URLSearchParams()
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.includeUnbilledOnly) params.append('unbilledOnly', 'true')

      const response = await fetch(`/api/v1/billing/client/${clientId}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch client billing')
      }
      
      return await response.json()
    } catch (err) {
      console.error('Error fetching client billing:', err)
      throw err
    }
  }

  const markTimeEntriesAsBilled = async (timeEntryIds: number[]): Promise<BillingResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch('/api/v1/billing/mark-billed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ timeEntryIds })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to mark time entries as billed')
      }

      // Refresh billing data
      await fetchBillingSummary()
      return { success: true }
    } catch (err) {
      console.error('Error marking time entries as billed:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    }
  }

  const generateBillingReport = async (filters?: BillingFilters): Promise<BillingResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    try {
      const token = localStorage.getItem('jwt_token')
      
      const params = new URLSearchParams()
      if (filters?.attorneyId) params.append('attorneyId', filters.attorneyId.toString())
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.includeUnbilledOnly) params.append('unbilledOnly', 'true')

      const response = await fetch(`/api/v1/billing/report?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to generate billing report')
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `billing-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (err) {
      console.error('Error generating billing report:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    }
  }

  const getBillingAnalytics = async (period: 'week' | 'month' | 'quarter' | 'year') => {
    if (!user || user.role !== 'Admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/billing/analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing analytics')
      }
      
      return await response.json()
    } catch (err) {
      console.error('Error fetching billing analytics:', err)
      throw err
    }
  }

  const canViewBilling = (): boolean => {
    return user?.role === 'Admin'
  }

  const canMarkAsBilled = (): boolean => {
    return user?.role === 'Admin'
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatHours = (hours: number): string => {
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

  const getUtilizationRate = (summary: BillingSummary): number => {
    // Assuming 40 hours per week as full utilization
    const workingHoursPerWeek = 40
    const weeksInPeriod = 1 // This would be calculated based on the date range
    const expectedHours = workingHoursPerWeek * weeksInPeriod
    
    return Math.min((summary.totalHours / expectedHours) * 100, 100)
  }

  return {
    billingSummaries,
    totalRevenue,
    totalHours,
    totalUnbilled,
    isLoading,
    error,
    fetchBillingSummary,
    getAttorneyBilling,
    getClientBilling,
    markTimeEntriesAsBilled,
    generateBillingReport,
    getBillingAnalytics,
    canViewBilling: canViewBilling(),
    canMarkAsBilled: canMarkAsBilled(),
    formatCurrency,
    formatHours,
    getUtilizationRate
  }
}