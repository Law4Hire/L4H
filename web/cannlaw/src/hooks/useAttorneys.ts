import { useState, useEffect } from 'react'

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

  useEffect(() => {
    fetchAttorneys()
  }, [])

  const fetchAttorneys = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v1/attorneys')
      
      if (!response.ok) {
        throw new Error('Failed to fetch attorneys')
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
  }

  const getAttorney = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/attorneys/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch attorney')
      }
      
      return await response.json()
    } catch (err) {
      console.error('Error fetching attorney:', err)
      throw err
    }
  }

  const createAttorney = async (attorney: Partial<Attorney>) => {
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

      if (!response.ok) {
        throw new Error('Failed to create attorney')
      }

      const newAttorney = await response.json()
      await fetchAttorneys() // Refresh data
      return { success: true, data: newAttorney }
    } catch (err) {
      console.error('Error creating attorney:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const updateAttorney = async (id: number, attorney: Partial<Attorney>) => {
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

      if (!response.ok) {
        throw new Error('Failed to update attorney')
      }

      await fetchAttorneys() // Refresh data
      return { success: true }
    } catch (err) {
      console.error('Error updating attorney:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

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