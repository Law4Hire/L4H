import { useState, useEffect } from 'react'

interface LegalService {
  id: number
  name: string
  description: string
  serviceCategoryId: number
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

interface ServiceCategory {
  id: number
  name: string
  description: string
  iconUrl: string
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
  services: LegalService[]
}

export function useServices() {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v1/services/categories')
      
      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }
      
      const categories = await response.json()
      setServiceCategories(categories)
      setError(null)
    } catch (err) {
      console.error('Error fetching services:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const getServiceCategory = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/services/categories/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch service category')
      }
      
      return await response.json()
    } catch (err) {
      console.error('Error fetching service category:', err)
      throw err
    }
  }

  const createServiceCategory = async (category: Partial<ServiceCategory>) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/services/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(category)
      })

      if (!response.ok) {
        throw new Error('Failed to create service category')
      }

      const newCategory = await response.json()
      await fetchServices() // Refresh data
      return { success: true, data: newCategory }
    } catch (err) {
      console.error('Error creating service category:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const updateServiceCategory = async (id: number, category: Partial<ServiceCategory>) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/services/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(category)
      })

      if (!response.ok) {
        throw new Error('Failed to update service category')
      }

      await fetchServices() // Refresh data
      return { success: true }
    } catch (err) {
      console.error('Error updating service category:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  return {
    serviceCategories,
    isLoading,
    error,
    getServiceCategory,
    createServiceCategory,
    updateServiceCategory,
    refetch: fetchServices
  }
}