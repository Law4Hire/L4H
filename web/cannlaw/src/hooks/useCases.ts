import { useState } from 'react'

export interface CaseVisaType {
  visaTypeId: number
  visaTypeCode: string
  visaTypeName: string
  isPrimary: boolean
  displayOrder: number
}

export interface DashboardCase {
  id: string
  clientId?: number
  clientFirstName: string
  clientLastName: string
  clientEmail: string
  status: string
  lastActivityAt: string
  createdAt: string
  assignedStaffId: number | null
  assignedStaffName: string | null
  visaTypes: CaseVisaType[]
}

export interface UseCasesOptions {
  showAssigned?: boolean
  search?: string
  sortBy?: string
  sortDesc?: boolean
}

export function useCases() {
  const [cases, setCases] = useState<DashboardCase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCases = async (options: UseCasesOptions = {}) => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.showAssigned !== undefined) {
        params.append('showAssigned', options.showAssigned.toString())
      }
      if (options.search) {
        params.append('search', options.search)
      }
      if (options.sortBy) {
        params.append('sortBy', options.sortBy)
      }
      if (options.sortDesc !== undefined) {
        params.append('sortDesc', options.sortDesc.toString())
      }

      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/cases/dashboard?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch cases: ${response.status}`)
      }

      const data = await response.json()
      setCases(data)
    } catch (err) {
      console.error('Error fetching cases:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const assignCase = async (caseId: string, staffId: number | null) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/cases/${caseId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ staffId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.title || 'Failed to assign case')
      }

      return { success: true }
    } catch (err) {
      console.error('Error assigning case:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }
  }

  const updateVisaTypes = async (
    caseId: string,
    visaTypeIds: number[],
    primaryVisaTypeId?: number
  ) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/cases/${caseId}/visa-types`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visaTypeIds,
          primaryVisaTypeId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.title || 'Failed to update visa types')
      }

      return { success: true }
    } catch (err) {
      console.error('Error updating visa types:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }
  }

  const updateCase = async (caseId: string, data: any) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/cases/${caseId}`, {
        method: 'PATCH', // Using PATCH for partial updates
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update case')
      }
      return { success: true }
    } catch (err) {
      console.error('Error updating case:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  return {
    cases,
    isLoading,
    error,
    fetchCases,
    assignCase,
    updateVisaTypes,
    updateCase,
    refetch: fetchCases
  }
}
