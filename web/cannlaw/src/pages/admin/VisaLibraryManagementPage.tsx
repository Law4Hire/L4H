import React, { useState } from 'react'
import { Card, Button, Input, Modal, useToast } from '@l4h/shared-ui'
import { Plus, Edit, Trash2, GripVertical, Save, X, Check } from 'lucide-react'
import { useVisaLibraryTiles, VisaLibraryTile, AdminVisaType } from '../../hooks/useVisaLibraryTiles'

const VisaLibraryManagementPage: React.FC = () => {
  const { tiles, allVisaTypes, createTile, updateTile, deleteTile, assignVisaTypes, refetch } = useVisaLibraryTiles()
  const { success, error } = useToast()

  const [showTileModal, setShowTileModal] = useState(false)
  const [showVisaTypesModal, setShowVisaTypesModal] = useState(false)
  const [editingTile, setEditingTile] = useState<VisaLibraryTile | null>(null)
  const [selectedTileForVisaTypes, setSelectedTileForVisaTypes] = useState<VisaLibraryTile | null>(null)
  const [selectedVisaTypeIds, setSelectedVisaTypeIds] = useState<number[]>([])
  const [tileFormData, setTileFormData] = useState<VisaLibraryTile>({
    name: '',
    description: '',
    isActive: true,
    displayOrder: 1
  })

  const handleCreateTile = () => {
    setTileFormData({
      name: '',
      description: '',
      isActive: true,
      displayOrder: (tiles?.length || 0) + 1
    })
    setEditingTile(null)
    setShowTileModal(true)
  }

  const handleEditTile = (tile: VisaLibraryTile) => {
    setTileFormData({
      name: tile.name,
      description: tile.description,
      isActive: tile.isActive,
      displayOrder: tile.displayOrder
    })
    setEditingTile(tile)
    setShowTileModal(true)
  }

  const handleSaveTile = async () => {
    try {
      if (editingTile && editingTile.id) {
        const result = await updateTile(editingTile.id, tileFormData)
        if (result.success) {
          success('Tile updated successfully')
          setShowTileModal(false)
          refetch()
        } else {
          error(result.error || 'Failed to update tile')
        }
      } else {
        const result = await createTile(tileFormData)
        if (result.success) {
          success('Tile created successfully')
          setShowTileModal(false)
          refetch()
        } else {
          error(result.error || 'Failed to create tile')
        }
      }
    } catch (err) {
      error('An error occurred')
    }
  }

  const handleDeleteTile = async (tileId: string) => {
    if (!confirm('Are you sure you want to delete this tile? This will remove all visa type assignments.')) {
      return
    }

    const result = await deleteTile(tileId)
    if (result.success) {
      success('Tile deleted successfully')
      refetch()
    } else {
      error(result.error || 'Failed to delete tile')
    }
  }

  const handleManageVisaTypes = (tile: VisaLibraryTile) => {
    setSelectedTileForVisaTypes(tile)
    setSelectedVisaTypeIds(tile.assignedVisaTypeIds || [])
    setShowVisaTypesModal(true)
  }

  const handleVisaTypeToggle = (visaTypeId: number) => {
    setSelectedVisaTypeIds(prev => {
      if (prev.includes(visaTypeId)) {
        return prev.filter(id => id !== visaTypeId)
      } else {
        return [...prev, visaTypeId]
      }
    })
  }

  const handleSaveVisaTypes = async () => {
    if (!selectedTileForVisaTypes || !selectedTileForVisaTypes.id) return

    const result = await assignVisaTypes(selectedTileForVisaTypes.id, selectedVisaTypeIds)
    if (result.success) {
      success('Visa types assigned successfully')
      setShowVisaTypesModal(false)
      refetch()
    } else {
      error(result.error || 'Failed to assign visa types')
    }
  }

  const handleTileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setTileFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getAssignedVisaTypesDisplay = (tile: VisaLibraryTile) => {
    if (!tile.assignedVisaTypeIds || tile.assignedVisaTypeIds.length === 0) {
      return 'No visa types assigned'
    }
    const assignedTypes = allVisaTypes.filter(vt => tile.assignedVisaTypeIds!.includes(vt.id))
    return assignedTypes.map(vt => vt.code).join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visa Library Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Create tiles to organize visa types into categories for the public visa library
          </p>
        </div>
        <Button onClick={handleCreateTile} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Tile
        </Button>
      </div>

      {/* Tiles */}
      <div className="space-y-4">
        {tiles && tiles.length > 0 ? (
          tiles.map((tile) => (
            <Card key={tile.id} className="p-6 dark:bg-navy-900">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-move" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tile.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tile.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        tile.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {tile.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Order: {tile.displayOrder}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {tile.assignedVisaTypeIds?.length || 0} visa types
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-navy-800 rounded border border-gray-200 dark:border-navy-700">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Assigned Visa Types:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{getAssignedVisaTypesDisplay(tile)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageVisaTypes(tile)}
                    className="dark:border-navy-700"
                  >
                    Assign Types
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTile(tile)}
                    className="dark:border-navy-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => tile.id && handleDeleteTile(tile.id)}
                    className="dark:border-navy-700 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center dark:bg-navy-900">
            <p className="text-gray-500 dark:text-gray-400">No tiles found. Create your first tile to get started.</p>
          </Card>
        )}
      </div>

      {/* Tile Modal */}
      <Modal
        open={showTileModal}
        onClose={() => setShowTileModal(false)}
        title={editingTile ? 'Edit Visa Library Tile' : 'New Visa Library Tile'}
      >
        <div className="space-y-4">
          <Input
            label="Tile Name *"
            name="name"
            value={tileFormData.name}
            onChange={handleTileInputChange}
            placeholder="e.g., Non-Immigrant Visas"
            className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={tileFormData.description || ''}
              onChange={handleTileInputChange}
              placeholder="Brief description of this tile category"
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-md dark:bg-navy-800 dark:text-white"
            />
          </div>

          <Input
            label="Display Order"
            name="displayOrder"
            type="number"
            value={tileFormData.displayOrder.toString()}
            onChange={handleTileInputChange}
            className="dark:bg-navy-800 dark:border-navy-700 dark:text-white"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={tileFormData.isActive}
              onChange={(e) => setTileFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Active (visible on public site)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTileModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTile}>
              <Save className="w-4 h-4 mr-2" />
              Save Tile
            </Button>
          </div>
        </div>
      </Modal>

      {/* Visa Types Assignment Modal */}
      <Modal
        open={showVisaTypesModal}
        onClose={() => setShowVisaTypesModal(false)}
        title={`Assign Visa Types - ${selectedTileForVisaTypes?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select the visa types that should appear in this tile. They will be displayed in the order selected.
          </p>

          <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-navy-700 rounded-md p-4 space-y-2">
            {[...allVisaTypes]
              .sort((a, b) => {
                // Active first
                if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
                // Then alphabetical by code
                return a.code.localeCompare(b.code);
              })
              .map((visaType) => (
              <div
                key={visaType.id}
                className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                  selectedVisaTypeIds.includes(visaType.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                    : 'border-gray-200 dark:border-navy-700 hover:border-gray-300 dark:hover:border-navy-600'
                }`}
                onClick={() => handleVisaTypeToggle(visaType.id)}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  selectedVisaTypeIds.includes(visaType.id)
                    ? 'border-blue-500 bg-blue-500 dark:bg-blue-600'
                    : 'border-gray-300 dark:border-navy-600'
                }`}>
                  {selectedVisaTypeIds.includes(visaType.id) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {visaType.code} - {visaType.name}
                  </p>
                </div>
                {!visaType.isActive && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">(Inactive)</span>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              <strong>{selectedVisaTypeIds.length}</strong> visa type(s) selected
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowVisaTypesModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVisaTypes}>
              <Save className="w-4 h-4 mr-2" />
              Save Assignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Note:</strong> Tiles organize visa types into categories for easier browsing on the public visa library page.
          Create tiles like "Non-Immigrant Visas", "Employment-Based", etc., and assign relevant visa types to each tile.
        </p>
      </Card>
    </div>
  )
}

export default VisaLibraryManagementPage
