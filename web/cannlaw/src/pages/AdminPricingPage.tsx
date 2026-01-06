import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container, Card, Button, Input, useToast } from '@l4h/shared-ui'
import { admin } from '@l4h/shared-ui'
import { Save, Plus, Trash2, Edit } from 'lucide-react'

// Dummy translation function
const t = (key: string) => {
  const map: Record<string, string> = {
    'admin.pricing': 'Pricing',
    'common.add': 'Add',
    'admin.addPricing': 'Add New Pricing',
    'admin.visaType': 'Visa Type',
    'admin.packageType': 'Package Type',
    'admin.country': 'Country',
    'admin.price': 'Price',
    'common.actions': 'Actions',
    'admin.saveAllChanges': 'Save All Changes'
  }
  return map[key] || key
}

interface PricingEntry {
  id: string
  visaType: string
  packageType: string
  country: string
  price: number
  currency: string
}

export default function AdminPricingPage() {
  const { success, error: showError } = useToast()
  const queryClient = useQueryClient()
  const [editingEntry, setEditingEntry] = useState<PricingEntry | null>(null)
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
      success('Success', 'Pricing updated successfully')
      setEditingEntry(null)
    },
    onError: (err) => {
      showError('Error', err instanceof Error ? err.message : '')
    }
  })

  const handleSaveEntry = (entry: PricingEntry) => {
    // If we are just updating local state for bulk save later?
    // Actually the current pattern seems to be immediate save for individual edits if we follow `handleDeleteEntry`.
    // But `handleDeleteEntry` calls mutate immediately.
    // So let's do the same for save.
    const updatedData = pricingData.map((item: PricingEntry) =>
      item.id === entry.id ? entry : item
    )
    updatePricingMutation.mutate(updatedData)
  }

  const handleAddEntry = () => {
    if (!newEntry.visaType || !newEntry.packageType || !newEntry.country) {
      showError('Error', 'Please fill in all required fields')
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
        <Card className="dark:bg-navy-800">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg dark:text-white">{'Loading...'}</div>
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">{t('admin.pricing')}</h1>
        <Button onClick={() => setEditingEntry({} as PricingEntry)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('common.add')}
        </Button>
      </div>

      {/* Add New Entry Form */}
      <Card className="mb-6 dark:bg-navy-800 dark:border-navy-700">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('admin.addPricing')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            label={t('admin.visaType')}
            value={newEntry.visaType || ''}
            onChange={(e) => setNewEntry(prev => ({ ...prev, visaType: e.target.value }))}
            placeholder="e.g., H1B, L1"
            className="dark:bg-navy-900 dark:text-white dark:border-navy-600"
          />
          <Input
            label={t('admin.packageType')}
            value={newEntry.packageType || ''}
            onChange={(e) => setNewEntry(prev => ({ ...prev, packageType: e.target.value }))}
            placeholder="e.g., Basic, Premium"
            className="dark:bg-navy-900 dark:text-white dark:border-navy-600"
          />
          <Input
            label={t('admin.country')}
            value={newEntry.country || ''}
            onChange={(e) => setNewEntry(prev => ({ ...prev, country: e.target.value }))}
            placeholder="e.g., US, CA"
            className="dark:bg-navy-900 dark:text-white dark:border-navy-600"
          />
          <Input
            label={t('admin.price')}
            type="number"
            value={newEntry.price || ''}
            onChange={(e) => setNewEntry(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            placeholder="0.00"
            className="dark:bg-navy-900 dark:text-white dark:border-navy-600"
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
      <Card className="dark:bg-navy-800 dark:border-navy-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
            <thead className="bg-gray-50 dark:bg-navy-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.visaType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.packageType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.country')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.price')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-navy-800 divide-y divide-gray-200 dark:divide-navy-700">
              {pricingData.map((entry: PricingEntry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {editingEntry?.id === entry.id ? (
                      <Input
                        value={editingEntry.visaType}
                        onChange={(e) => setEditingEntry({...editingEntry, visaType: e.target.value})}
                        className="dark:bg-navy-900 dark:text-white"
                      />
                    ) : entry.visaType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {editingEntry?.id === entry.id ? (
                      <Input
                        value={editingEntry.packageType}
                        onChange={(e) => setEditingEntry({...editingEntry, packageType: e.target.value})}
                        className="dark:bg-navy-900 dark:text-white"
                      />
                    ) : entry.packageType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {editingEntry?.id === entry.id ? (
                      <Input
                        value={editingEntry.country}
                        onChange={(e) => setEditingEntry({...editingEntry, country: e.target.value})}
                        className="dark:bg-navy-900 dark:text-white"
                      />
                    ) : entry.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {editingEntry?.id === entry.id ? (
                      <Input
                        type="number"
                        value={editingEntry.price}
                        onChange={(e) => setEditingEntry({...editingEntry, price: parseFloat(e.target.value)})}
                        className="dark:bg-navy-900 dark:text-white"
                      />
                    ) : new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: entry.currency
                    }).format(entry.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {editingEntry?.id === entry.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveEntry(editingEntry)}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingEntry(entry)}
                          className="dark:text-gray-400 dark:hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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


