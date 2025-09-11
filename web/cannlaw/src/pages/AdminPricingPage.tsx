import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container, Card, Button, Input, useToast } from '@l4h/shared-ui'
import { admin } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import { Save, Plus, Trash2, Edit } from 'lucide-react'

interface PricingEntry {
  id: string
  visaType: string
  packageType: string
  country: string
  price: number
  currency: string
}

export default function AdminPricingPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const queryClient = useQueryClient()
  // const [editingEntry, setEditingEntry] = useState<PricingEntry | null>(null)
  const [newEntry, setNewEntry] = useState<Partial<PricingEntry>>({
    visaType: '',
    packageType: '',
    country: '',
    price: 0,
    currency: 'USD'
  })

  // Fetch pricing data
  const { data: pricingData = [], isLoading } = useQuery({
    queryKey: ['admin-pricing'],
    queryFn: admin.pricing
  })

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: admin.updatePricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pricing'] })
      success(t('common.success'), 'Pricing updated successfully')
      // setEditingEntry(null)
    },
    onError: (err) => {
      showError(t('common.error'), err instanceof Error ? err.message : '')
    }
  })

  // const handleSaveEntry = (entry: PricingEntry) => {
  //   const updatedData = pricingData.map((item: PricingEntry) =>
  //     item.id === entry.id ? entry : item
  //   )
  //   updatePricingMutation.mutate(updatedData)
  // }

  const handleAddEntry = () => {
    if (!newEntry.visaType || !newEntry.packageType || !newEntry.country) {
      showError(t('common.error'), 'Please fill in all required fields')
      return
    }

    const entry: PricingEntry = {
      id: Date.now().toString(),
      visaType: newEntry.visaType!,
      packageType: newEntry.packageType!,
      country: newEntry.country!,
      price: newEntry.price || 0,
      currency: newEntry.currency || 'USD'
    }

    const updatedData = [...pricingData, entry]
    updatePricingMutation.mutate(updatedData)
    setNewEntry({ visaType: '', packageType: '', country: '', price: 0, currency: 'USD' })
  }

  const handleDeleteEntry = (id: string) => {
    const updatedData = pricingData.filter((item: PricingEntry) => item.id !== id)
    updatePricingMutation.mutate(updatedData)
  }

  if (isLoading) {
    return (
      <Container>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">{t('common.loading')}</div>
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('admin.pricing')}</h1>
        <Button onClick={() => {/* setEditingEntry({} as PricingEntry) */}}>
          <Plus className="h-4 w-4 mr-2" />
          {t('common.add')}
        </Button>
      </div>

      {/* Add New Entry Form */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('admin.addPricing')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            label={t('admin.visaType')}
            value={newEntry.visaType || ''}
            onChange={(e) => setNewEntry(prev => ({ ...prev, visaType: e.target.value }))}
            placeholder="e.g., H1B, L1"
          />
          <Input
            label={t('admin.packageType')}
            value={newEntry.packageType || ''}
            onChange={(e) => setNewEntry(prev => ({ ...prev, packageType: e.target.value }))}
            placeholder="e.g., Basic, Premium"
          />
          <Input
            label={t('admin.country')}
            value={newEntry.country || ''}
            onChange={(e) => setNewEntry(prev => ({ ...prev, country: e.target.value }))}
            placeholder="e.g., US, CA"
          />
          <Input
            label={t('admin.price')}
            type="number"
            value={newEntry.price || ''}
            onChange={(e) => setNewEntry(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            placeholder="0.00"
          />
          <div className="flex items-end">
            <Button onClick={handleAddEntry} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t('common.add')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Pricing Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.visaType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.packageType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.country')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.price')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricingData.map((entry: PricingEntry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.visaType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.packageType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: entry.currency
                    }).format(entry.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* setEditingEntry(entry) */}}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bulk Save Button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={() => updatePricingMutation.mutate(pricingData)}
          loading={updatePricingMutation.isPending}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {t('admin.saveAllChanges')}
        </Button>
      </div>
    </Container>
  )
}


