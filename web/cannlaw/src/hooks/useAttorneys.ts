import { useState, useEffect, useCallback } from 'react'

interface Attorney {
  id: number
  name: string
  title: string
  bio: string
  photoUrl: string
  email: string
  phone: string
  directPhone: string
  directEmail: string
  officeLocation: string
  defaultHourlyRate: number
  credentials: string // JSON array
  practiceAreas: string // JSON array
  languages: string // JSON array
  isActive: boolean
  isManagingAttorney: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export function useAttorneys() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttorneys = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/attorneys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Attorney fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch attorneys: ${response.status} ${errorText.substring(0, 100)}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Expected JSON but got:', contentType, text.substring(0, 200))
        throw new Error(`Invalid response format: ${contentType}`)
      }

      const attorneyList = await response.json()
      setAttorneys(attorneyList)
      setError(null)
    } catch (err) {
      console.error('Error fetching attorneys:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAttorneys()
  }, [fetchAttorneys])

  const getAttorney = useCallback(async (id: number) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch attorney')
      return await response.json()
    } catch (err) {
      console.error('Error fetching attorney:', err)
      throw err
    }
  }, [])

  const createAttorney = useCallback(async (attorney: Partial<Attorney>) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/attorneys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attorney)
      })

      if (!response.ok) throw new Error('Failed to create user profile')
      const newAttorney = await response.json()
      await fetchAttorneys()
      return { success: true, data: newAttorney }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [fetchAttorneys])

  const updateAttorney = useCallback(async (id: number, attorney: Partial<Attorney>) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/attorneys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attorney)
      })

      if (!response.ok) throw new Error('Failed to update attorney')
      await fetchAttorneys()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [fetchAttorneys])

  return {
    attorneys,
    isLoading,
    error,
    getAttorney,
    createAttorney,
    updateAttorney,
    refetch: fetchAttorneys
  }
}