import React, { useState } from 'react'
import { Card, Button, Input, Modal, useToast } from '@l4h/shared-ui'
import { Plus, Edit, Trash2, GripVertical, Save, X } from 'lucide-react'
import { useServices } from '../../hooks/useServices'

interface LegalService {
  id?: number
  name: string
  description: string
  serviceCategoryId: number
  isActive: boolean
  displayOrder: number
}

interface ServiceCategory {
  id?: number
  name: string
  description: string
  iconUrl: string
  isActive: boolean
  displayOrder: number
  services?: LegalService[]
}

const ServicesManagementPage: React.FC = () => {
  const { serviceCategories, createServiceCategory, updateServiceCategory, refetch } = useServices()
  const { success, error } = useToast()

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [categoryFormData, setCategoryFormData] = useState<ServiceCategory>({
    name: '',
    description: '',
    iconUrl: '',
    isActive: true,
    displayOrder: 1
  })

  const handleCreateCategory = () => {
    setCategoryFormData({
      name: '',
      description: '',
      iconUrl: '',
      isActive: true,
      displayOrder: (serviceCategories?.length || 0) + 1
    })
    setEditingCategory(null)
    setShowCategoryModal(true)
  }

  const handleEditCategory = (category: any) => {
    setCategoryFormData({
      name: category.name,
      description: category.description,
      iconUrl: category.iconUrl || '',
      isActive: category.isActive,
      displayOrder: category.displayOrder
    })
    setEditingCategory(category)
    setShowCategoryModal(true)
  }

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        const result = await updateServiceCategory(editingCategory.id!, categoryFormData)
        if (result.success) {
          success('Category updated successfully')
          setShowCategoryModal(false)
          refetch()
        } else {
          error(result.error || 'Failed to update category')
        }
      } else {
        const result = await createServiceCategory(categoryFormData)
        if (result.success) {
          success('Category created successfully')
          setShowCategoryModal(false)
          refetch()
        } else {
          error(result.error || 'Failed to create category')
        }
      }
    } catch (err) {
      error('An error occurred')
    }
  }

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage service categories and individual services for the public-facing website
          </p>
        </div>
        <Button onClick={handleCreateCategory} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Category
        </Button>
      </div>

      {/* Service Categories */}
      <div className="space-y-4">
        {serviceCategories && serviceCategories.length > 0 ? (
          serviceCategories.map((category: any) => (
            <Card key={category.id} className="p-6 dark:bg-navy-900">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-move" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{category.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        category.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Order: {category.displayOrder}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {category.services?.length || 0} services
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                    className="dark:border-navy-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Services in this category */}
              {category.services && category.services.length > 0 && (
                <div className="mt-4 pl-8 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Services:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.services.map((service: any) => (
                      <div
                        key={service.id}
                        className="p-3 bg-gray-50 dark:bg-navy-800 rounded border border-gray-200 dark:border-navy-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{service.description}</p>
                            )}
                          </div>
                          <span className={`ml-2 px-2 py-1 text-xs rounded ${
                            service.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {service.isActive ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center dark:bg-navy-900">
            <p className="text-gray-500 dark:text-gray-400">No service categories found. Create your first category to get started.</p>
          </Card>
        )}
      </div>

      {/* Category Modal */}
      <Modal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? 'Edit Service Category' : 'New Service Category'}
      >
        <div className="space-y-4">
          <Input
            label="Category Name *"
            name="name"
            value={categoryFormData.name}
            onChange={handleCategoryInputChange}
            placeholder="e.g., Family Immigration"
            className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              rows={3}
              value={categoryFormData.description}
              onChange={handleCategoryInputChange}
              placeholder="Brief description of this service category"
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-md dark:bg-navy-800 dark:text-white"
            />
          </div>

          <Input
            label="Icon URL (optional)"
            name="iconUrl"
            value={categoryFormData.iconUrl}
            onChange={handleCategoryInputChange}
            placeholder="https://example.com/icon.png"
            className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
          />

          <Input
            label="Display Order"
            name="displayOrder"
            type="number"
            value={categoryFormData.displayOrder.toString()}
            onChange={handleCategoryInputChange}
            className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={categoryFormData.isActive}
              onChange={(e) => setCategoryFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Active (visible on public site)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              <Save className="w-4 h-4 mr-2" />
              Save Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Note:</strong> Services within each category can be managed through the database.
          A more advanced UI for managing individual services will be added in a future update.
          For now, categories can be created and edited here, and the default services are automatically populated.
        </p>
      </Card>
    </div>
  )
}

export default ServicesManagementPage
