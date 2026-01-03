import { useState, useEffect } from 'react'

interface PricingPackage {
  id: string
  packageCode: string
  name: string
  displayName: string
  description: string
  price: number | null
  basePrice: number | null
  taxRate: number
  currency: string
  total: number | null
  sortOrder: number
  features: string[]
}

interface PricingResponse {
  visaType: string
  country: string
  packages: PricingPackage[]
}

export function usePricing() {
  const [pricingData, setPricingData] = useState<PricingResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v1/pricing')

      if (!response.ok) {
        throw new Error('Failed to fetch pricing')
      }

      const data = await response.json()
      setPricingData(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching pricing:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    pricingData,
    packages: pricingData?.packages || [],
    isLoading,
    error,
    refetch: fetchPricing
  }
}
