import { useState } from 'react'
import { useAuth } from './useAuth'

interface AssignmentResult {
  success: boolean
  error?: string
}

export function useClientAssignment() {
  const [isAssigning, setIsAssigning] = useState(false)
  const { user } = useAuth()

  const assignClient = async (clientId: number, attorneyId: number): Promise<AssignmentResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    try {
      setIsAssigning(true)
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
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to assign client')
      }

      return { success: true }
    } catch (err) {
      console.error('Error assigning client:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsAssigning(false)
    }
  }

  const reassignClient = async (clientId: number, fromAttorneyId: number, toAttorneyId: number): Promise<AssignmentResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    try {
      setIsAssigning(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/clients/${clientId}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fromAttorneyId, toAttorneyId })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to reassign client')
      }

      return { success: true }
    } catch (err) {
      console.error('Error reassigning client:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsAssigning(false)
    }
  }

  const unassignClient = async (clientId: number): Promise<AssignmentResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    try {
      setIsAssigning(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/clients/${clientId}/unassign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to unassign client')
      }

      return { success: true }
    } catch (err) {
      console.error('Error unassigning client:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsAssigning(false)
    }
  }

  const bulkAssign = async (clientIds: number[], attorneyId: number): Promise<AssignmentResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    try {
      setIsAssigning(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch('/api/v1/clients/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ clientIds, attorneyId })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to bulk assign clients')
      }

      return { success: true }
    } catch (err) {
      console.error('Error bulk assigning clients:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsAssigning(false)
    }
  }

  return {
    isAssigning,
    assignClient,
    reassignClient,
    unassignClient,
    bulkAssign
  }
}