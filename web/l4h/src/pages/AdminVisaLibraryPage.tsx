import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Input, useToast } from '@l4h/shared-ui';

interface AdminTile {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedVisaTypeIds: number[];
}

interface VisaType {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

interface TileFormData {
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export default function AdminVisaLibraryPage() {
  const { success, error } = useToast();

  const [tiles, setTiles] = useState<AdminTile[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTileModal, setShowTileModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTile, setEditingTile] = useState<AdminTile | null>(null);
  const [assigningTile, setAssigningTile] = useState<AdminTile | null>(null);
  const [showInactiveVisas, setShowInactiveVisas] = useState(false);
  const [selectedVisaTypeIds, setSelectedVisaTypeIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const [tileFormData, setTileFormData] = useState<TileFormData>({
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load tiles
      const tilesResponse = await fetch('/api/v1/visa-library/admin/tiles', { headers });
      if (!tilesResponse.ok) throw new Error('Failed to load tiles');
      const tilesData = await tilesResponse.json();
      setTiles(tilesData);

      // Load all visa types (using admin pricing endpoint for extensive list)
      const visaTypesResponse = await fetch('/api/v1/admin/pricing/visa-types', { headers });
      if (!visaTypesResponse.ok) throw new Error('Failed to load visa types');
      const visaTypesData = await visaTypesResponse.json();
      setVisaTypes(visaTypesData);

    } catch (err: any) {
      error('Failed to load data', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateTileModal = () => {
    setEditingTile(null);
    setTileFormData({
      name: '',
      description: '',
      displayOrder: tiles.length,
      isActive: true
    });
    setShowTileModal(true);
  };

  const openEditTileModal = (tile: AdminTile) => {
    setEditingTile(tile);
    setTileFormData({
      name: tile.name,
      description: tile.description || '',
      displayOrder: tile.displayOrder,
      isActive: tile.isActive
    });
    setShowTileModal(true);
  };

  const handleSaveTile = async () => {
    if (!tileFormData.name.trim()) {
      error('Please enter a tile name');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('jwt_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const url = editingTile
        ? `/api/v1/visa-library/admin/tiles/${editingTile.id}`
        : '/api/v1/visa-library/admin/tiles';

      const method = editingTile ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(tileFormData)
      });

      if (!response.ok) throw new Error('Failed to save tile');

      success(editingTile ? 'Tile updated successfully' : 'Tile created successfully');
      setShowTileModal(false);
      loadData();
    } catch (err: any) {
      error('Failed to save tile', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTile = async (tile: AdminTile) => {
    if (!confirm(`Are you sure you want to delete "${tile.name}"? This will remove all visa type assignments.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/v1/visa-library/admin/tiles/${tile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete tile');

      success('Tile deleted successfully');
      loadData();
    } catch (err: any) {
      error('Failed to delete tile', err.message);
    }
  };

  const openAssignModal = (tile: AdminTile) => {
    setAssigningTile(tile);
    setSelectedVisaTypeIds([...tile.assignedVisaTypeIds]);
    setShowAssignModal(true);
  };

  const handleToggleVisaType = (visaTypeId: number) => {
    setSelectedVisaTypeIds(prev =>
      prev.includes(visaTypeId)
        ? prev.filter(id => id !== visaTypeId)
        : [...prev, visaTypeId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!assigningTile) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('jwt_token');

      const response = await fetch(`/api/v1/visa-library/admin/tiles/${assigningTile.id}/visa-types`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ visaTypeIds: selectedVisaTypeIds })
      });

      if (!response.ok) throw new Error('Failed to save assignments');

      success('Visa types assigned successfully');
      setShowAssignModal(false);
      loadData();
    } catch (err: any) {
      error('Failed to save assignments', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredVisaTypes = visaTypes.filter(vt => showInactiveVisas || vt.isActive);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading visa library...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Visa Library Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage visa library categories and assign visa types to them
              </p>
            </div>
            <Button onClick={openCreateTileModal}>
              Create Category
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Categories</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{tiles.length}</div>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Categories</div>
            <div className="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">
              {tiles.filter(t => t.isActive).length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Visa Types</div>
            <div className="mt-1 text-3xl font-semibold text-blue-600 dark:text-blue-400">{visaTypes.length}</div>
          </div>
        </Card>
      </div>

      {/* Tiles List */}
      <Card title="Categories">
        <div className="space-y-4">
          {tiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No categories found. Create one to get started.
            </div>
          ) : (
            tiles.map(tile => (
              <div
                key={tile.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tile.name}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tile.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {tile.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Order: {tile.displayOrder}
                      </span>
                    </div>
                    {tile.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tile.description}</p>
                    )}
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Assigned Visa Types: {tile.assignedVisaTypeIds.length}
                      </span>
                      {tile.assignedVisaTypeIds.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {tile.assignedVisaTypeIds.slice(0, 10).map(vtId => {
                            const vt = visaTypes.find(v => v.id === vtId);
                            return vt ? (
                              <span key={vtId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                {vt.code}
                              </span>
                            ) : null;
                          })}
                          {tile.assignedVisaTypeIds.length > 10 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{tile.assignedVisaTypeIds.length - 10} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAssignModal(tile)}
                    >
                      Assign Visas
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditTileModal(tile)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTile(tile)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Create/Edit Tile Modal */}
      <Modal
        open={showTileModal}
        onClose={() => setShowTileModal(false)}
        title={editingTile ? 'Edit Category' : 'Create Category'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name *"
            value={tileFormData.name}
            onChange={(e) => setTileFormData({ ...tileFormData, name: e.target.value })}
            placeholder="e.g., Employment-Based Visas"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={tileFormData.description}
              onChange={(e) => setTileFormData({ ...tileFormData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <Input
            label="Display Order"
            type="number"
            value={tileFormData.displayOrder}
            onChange={(e) => setTileFormData({ ...tileFormData, displayOrder: parseInt(e.target.value) || 0 })}
            min={0}
          />

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tileFormData.isActive}
              onChange={(e) => setTileFormData({ ...tileFormData, isActive: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active (visible on public site)</span>
          </label>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowTileModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveTile} loading={saving}>
              {editingTile ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Visa Types Modal */}
      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Visa Types to "${assigningTile?.name}"`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedVisaTypeIds.length} visa type(s) selected
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactiveVisas}
                onChange={(e) => setShowInactiveVisas(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show inactive visa types</span>
            </label>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
            {filteredVisaTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No visa types found
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVisaTypes.map(vt => (
                  <label
                    key={vt.id}
                    className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVisaTypeIds.includes(vt.id)}
                      onChange={() => handleToggleVisaType(vt.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">{vt.code}</span>
                        {!vt.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{vt.name}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowAssignModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignments} loading={saving}>
              Save Assignments
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
