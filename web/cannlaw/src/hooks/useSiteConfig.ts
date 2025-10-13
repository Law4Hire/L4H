import { useState, useEffect } from 'react'

interface SiteConfiguration {
  id: number
  firmName: string
  managingAttorney: string
  primaryPhone: string
  email: string
  primaryFocusStatement: string
  locations: string // JSON
  socialMediaPlatforms: string // JSON
  uniqueSellingPoints: string // JSON
  logoUrl: string
  createdAt: string
  updatedAt: string
}

export function useSiteConfig() {
  const [siteConfig, setSiteConfig] = useState<SiteConfiguration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSiteConfig()
  }, [])

  const fetchSiteConfig = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v1/site-config')
      
      if (!response.ok) {
        throw new Error('Failed to fetch site configuration')
      }
      
      const config = await response.json()
      setSiteConfig(config)
      setError(null)
    } catch (err) {
      console.error('Error fetching site config:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSiteConfig = async (config: Partial<SiteConfiguration>) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/site-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        throw new Error('Failed to update site configuration')
      }

      await fetchSiteConfig() // Refresh data
      return { success: true }
    } catch (err) {
      console.error('Error updating site config:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  return {
    siteConfig,
    isLoading,
    error,
    updateSiteConfig,
    refetch: fetchSiteConfig
  }
}