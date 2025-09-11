import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Button, pricing, cases, useToast } from '@l4h/shared-ui'

interface PricingPackage {
  id: string
  name: string
  description: string
  price: number
  currency: string
  features: string[]
}

const PricingPage: React.FC = () => {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const queryClient = useQueryClient()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  // Fetch pricing data
  const { data: pricingData, isLoading, error } = useQuery({
    queryKey: ['pricing'],
    queryFn: pricing.get
  })

  // Select package mutation
  const selectPackageMutation = useMutation({
    mutationFn: (packageId: string) => cases.setPackage('current-case-id', packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] })
      success(t('pricing.selectPlan') + ' ' + t('common.success'))
    },
    onError: (err) => {
      showError(t('common.error'), err instanceof Error ? err.message : '')
    }
  })

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId)
    selectPackageMutation.mutate(packageId)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('pricing.title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('pricing.selectPlan')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
          <div className="text-red-800">{t('common.error')}</div>
        </div>
      )}

      {pricingData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingData.packages?.map((pkg: PricingPackage) => (
            <Card key={pkg.id} className="relative">
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {pkg.description}
                  </p>
                  <div className="text-4xl font-bold text-blue-600">
                    {formatCurrency(pkg.price, pkg.currency)}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('pricing.features')}
                  </h4>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg
                          className="h-5 w-5 text-green-500 mr-3"
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
                    loading={selectPackageMutation.isPending}
                    disabled={selectPackageMutation.isPending || selectedPackage === pkg.id}
                    className="w-full"
                    variant={selectedPackage === pkg.id ? 'secondary' : 'primary'}
                  >
                    {selectedPackage === pkg.id
                      ? t('pricing.currentPlan')
                      : t('pricing.choosePlan')
                    }
                  </Button>
                </div>

                {selectedPackage === pkg.id && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      {t('pricing.currentPlan')}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export { PricingPage }
export default PricingPage