import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Button, apiClient, formatCurrency } from '@l4h/shared-ui'

interface PricingPackage {
  id: string
  name: string
  description: string
  price: number
  currency: string
  features: string[]
}

interface PricingData {
  packages: PricingPackage[]
}

const PricingPage: React.FC = () => {
  const { t } = useTranslation()
  const [pricing, setPricing] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [selectionLoading, setSelectionLoading] = useState<string | null>(null)
  const [selectionError, setSelectionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const result = await apiClient.getPricing()
        if (result.success) {
          setPricing(result.data)
        } else {
          setError(result.error || 'Failed to load pricing')
        }
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadPricing()
  }, [])

  const handleSelectPackage = async (packageId: string) => {
    setSelectionLoading(packageId)
    setSelectionError('')
    setSuccessMessage('')

    try {
      const result = await apiClient.selectPackage(packageId)
      if (result.success) {
        setSelectedPackage(packageId)
        setSuccessMessage('Package selected successfully!')
      } else {
        setSelectionError(result.error || 'Failed to select package')
      }
    } catch (err) {
      setSelectionError('An unexpected error occurred')
    } finally {
      setSelectionLoading(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('pricing.title') || 'Pricing Packages'}
          </h1>
          <p className="text-xl text-gray-600">
            {t('pricing.subtitle') || 'Choose the package that best fits your needs'}
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-error-50 border border-error-200 rounded-md p-4" role="alert">
            <div className="text-error-800">{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-8 bg-success-50 border border-success-200 rounded-md p-4" role="alert">
            <div className="text-success-800">{successMessage}</div>
          </div>
        )}

        {pricing && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricing.packages.map((pkg) => (
              <Card key={pkg.id} className="relative">
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {pkg.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {pkg.description}
                    </p>
                    <div className="text-4xl font-bold text-primary-600">
                      {formatCurrency(pkg.price, pkg.currency)}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      {t('pricing.features') || 'Features'}
                    </h4>
                    <ul className="space-y-2">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg
                            className="h-5 w-5 text-success-500 mr-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => handleSelectPackage(pkg.id)}
                      loading={selectionLoading === pkg.id}
                      disabled={selectionLoading !== null || selectedPackage === pkg.id}
                      className="w-full"
                      variant={selectedPackage === pkg.id ? 'secondary' : 'primary'}
                    >
                      {selectedPackage === pkg.id
                        ? t('pricing.selected') || 'Selected'
                        : t('pricing.select') || 'Select Package'
                      }
                    </Button>
                  </div>

                  {selectedPackage === pkg.id && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-success-100 text-success-800 px-2 py-1 rounded-full text-xs font-medium">
                        {t('pricing.selected') || 'Selected'}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectionError && (
          <div className="mt-8 bg-error-50 border border-error-200 rounded-md p-4" role="alert">
            <div className="text-error-800">{selectionError}</div>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            {t('pricing.questions') || 'Have questions about our pricing?'}
          </p>
          <Button variant="outline">
            {t('pricing.contact') || 'Contact Us'}
          </Button>
        </div>
      </div>
    </main>
  )
}

export { PricingPage }
export default PricingPage
