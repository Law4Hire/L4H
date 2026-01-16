import React, { useState, useCallback } from 'react'
import { fetchJson } from '@l4h/shared-ui'

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

export interface CaseUpdateData {
  status?: string
  assignedStaffId?: number | null
  clientFirstName?: string
  clientLastName?: string
  clientEmail?: string
}

export function useCases() {
  const [cases, setCases] = useState<DashboardCase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCases = useCallback(async (options: UseCasesOptions = {}) => {
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

      const data = await fetchJson<DashboardCase[]>(`/v1/cases/dashboard?${params.toString()}`)
      setCases(data)
    } catch (err) {
      console.error('Error fetching cases:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const assignCase = useCallback(async (caseId: string, staffId: number | null) => {
    try {
      await fetchJson(`/v1/cases/${caseId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ staffId })
      })

      return { success: true }
    } catch (err) {
      console.error('Error assigning case:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }
  }, [])

  const updateVisaTypes = useCallback(async (
    caseId: string,
    visaTypeIds: number[],
    primaryVisaTypeId?: number
  ) => {
    try {
      await fetchJson(`/v1/cases/${caseId}/visa-types`, {
        method: 'PUT',
        body: JSON.stringify({
          visaTypeIds,
          primaryVisaTypeId
        })
      })

      return { success: true }
    } catch (err) {
      console.error('Error updating visa types:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }
  }, [])

  const updateCase = useCallback(async (caseId: string, data: CaseUpdateData) => {
    try {
      await fetchJson(`/v1/cases/${caseId}`, {
        method: 'PATCH', // Using PATCH for partial updates
        body: JSON.stringify(data)
      })

      return { success: true }
    } catch (err) {
      console.error('Error updating case:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [])

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
