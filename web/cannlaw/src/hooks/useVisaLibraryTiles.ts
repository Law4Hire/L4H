import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@l4h/shared-ui'

export interface VisaTypeInfo {
  id: number
  code: string
  name: string
  isActive: boolean
}

export interface VisaLibraryTile {
  id?: string
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
  assignedVisaTypeIds?: number[]
}

export interface AdminVisaType {
  id: number
  code: string
  name: string
  isActive: boolean
}

export const useVisaLibraryTiles = () => {
  const [tiles, setTiles] = useState<VisaLibraryTile[]>([])
  const [allVisaTypes, setAllVisaTypes] = useState<AdminVisaType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getAuthHeaders } = useAuth()

  const fetchTiles = useCallback(async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const response = await fetch('/api/v1/visa-library/admin/tiles', {
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to fetch visa library tiles')
      }

      const data = await response.json()
      setTiles(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  const fetchVisaTypes = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/v1/admin/pricing/visa-types', {
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to fetch visa types')
      }

      const data = await response.json()
      setAllVisaTypes(data.map((vt: AdminVisaType) => ({
        id: vt.id,
        code: vt.code,
        name: vt.name,
        isActive: vt.isActive
      })))
    } catch (err: any) {
      console.error('Error fetching visa types:', err)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    fetchTiles()
    fetchVisaTypes()
  }, [fetchTiles, fetchVisaTypes])

  const createTile = async (tile: VisaLibraryTile) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/v1/visa-library/admin/tiles', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tile)
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.title || 'Failed to create tile' }
      }

      await fetchTiles()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const updateTile = async (id: string, tile: VisaLibraryTile) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/v1/visa-library/admin/tiles/${id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tile)
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.title || 'Failed to update tile' }
      }

      await fetchTiles()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const deleteTile = async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/v1/visa-library/admin/tiles/${id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        return { success: false, error: 'Failed to delete tile' }
      }

      await fetchTiles()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const assignVisaTypes = async (tileId: string, visaTypeIds: number[]) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/v1/visa-library/admin/tiles/${tileId}/visa-types`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ visaTypeIds })
      })

      if (!response.ok) {
        return { success: false, error: 'Failed to assign visa types' }
      }

      await fetchTiles()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  return {
    tiles,
    allVisaTypes,
    loading,
    error,
    createTile,
    updateTile,
    deleteTile,
    assignVisaTypes,
    refetch: fetchTiles
  }
}
