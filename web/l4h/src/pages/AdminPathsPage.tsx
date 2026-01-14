import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Modal, Input, useToast } from '@l4h/shared-ui';

interface AdminPath {
  id: string;
  name: string;
  path: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  parentPathId?: string;
  parentPathName?: string;
  requiredRole?: string;
  childPathCount: number;
  createdAt: string;
  updatedAt: string;
  createdByUserEmail?: string;
  updatedByUserEmail?: string;
}

interface PathFormData {
  name: string;
  path: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  parentPathId: string;
  requiredRole: string;
}

export default function AdminPathsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [paths, setPaths] = useState<AdminPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPath, setEditingPath] = useState<AdminPath | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pathToDelete, setPathToDelete] = useState<AdminPath | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<PathFormData>({
    name: '',
    path: '',
    description: '',
    icon: '',
    displayOrder: 0,
    isActive: true,
    parentPathId: '',
    requiredRole: 'admin'
  });

  const loadPaths = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('/api/v1/admin/paths', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load paths');
      }

      const data = await response.json();
      setPaths(data);
    } catch (err: any) {
      error('Failed to load paths', err.message);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  const openCreateModal = () => {
    setEditingPath(null);
    setFormData({
      name: '',
      path: '',
      description: '',
      icon: '',
      displayOrder: paths.length,
      isActive: true,
      parentPathId: '',
      requiredRole: 'admin'
    });
    setShowModal(true);
  };

  const openEditModal = (path: AdminPath) => {
    setEditingPath(path);
    setFormData({
      name: path.name,
      path: path.path,
      description: path.description || '',
      icon: path.icon || '',
      displayOrder: path.displayOrder,
      isActive: path.isActive,
      parentPathId: path.parentPathId || '',
      requiredRole: path.requiredRole || 'admin'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('jwt_token');
      const url = editingPath
        ? `/api/v1/admin/paths/${editingPath.id}`
        : '/api/v1/admin/paths';

      const method = editingPath ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        parentPathId: formData.parentPathId || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save path');
      }

      success(editingPath ? 'Path updated successfully' : 'Path created successfully');
      setShowModal(false);
      loadPaths();
    } catch (err: any) {
      error('Failed to save path', err.message);
    }
  };

  const handleDelete = async () => {
    if (!pathToDelete) return;

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/v1/admin/paths/${pathToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete path');
      }

      success('Path deleted successfully');
      setShowDeleteConfirm(false);
      setPathToDelete(null);
      loadPaths();
    } catch (err: any) {
      error('Failed to delete path', err.message);
    }
  };

  const movePathUp = async (path: AdminPath) => {
    const currentIndex = paths.findIndex(p => p.id === path.id);
    if (currentIndex <= 0) return;

    const newPaths = [...paths];
    const temp = newPaths[currentIndex - 1].displayOrder;
    newPaths[currentIndex - 1].displayOrder = path.displayOrder;
    newPaths[currentIndex].displayOrder = temp;

    await reorderPaths([
      { pathId: newPaths[currentIndex - 1].id, displayOrder: newPaths[currentIndex - 1].displayOrder },
      { pathId: newPaths[currentIndex].id, displayOrder: newPaths[currentIndex].displayOrder }
    ]);
  };

  const movePathDown = async (path: AdminPath) => {
    const currentIndex = paths.findIndex(p => p.id === path.id);
    if (currentIndex >= paths.length - 1) return;

    const newPaths = [...paths];
    const temp = newPaths[currentIndex + 1].displayOrder;
    newPaths[currentIndex + 1].displayOrder = path.displayOrder;
    newPaths[currentIndex].displayOrder = temp;

    await reorderPaths([
      { pathId: newPaths[currentIndex].id, displayOrder: newPaths[currentIndex].displayOrder },
      { pathId: newPaths[currentIndex + 1].id, displayOrder: newPaths[currentIndex + 1].displayOrder }
    ]);
  };

  const reorderPaths = async (updates: { pathId: string; displayOrder: number }[]) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('/api/v1/admin/paths/reorder', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paths: updates })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder paths');
      }

      success('Paths reordered successfully');
      loadPaths();
    } catch (err: any) {
      error('Failed to reorder paths', err.message);
    }
  };

  const toggleActive = async (path: AdminPath) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/v1/admin/paths/${path.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...path,
          isActive: !path.isActive
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle path status');
      }

      success(`Path ${!path.isActive ? 'activated' : 'deactivated'} successfully`);
      loadPaths();
    } catch (err: any) {
      error('Failed to toggle path status', err.message);
    }
  };

  const filteredPaths = paths.filter(path => {
    // Filter by active/inactive
    if (selectedFilter === 'active' && !path.isActive) return false;
    if (selectedFilter === 'inactive' && path.isActive) return false;
    if (selectedFilter === 'toplevel' && path.parentPathId) return false;
    if (selectedFilter === 'children' && !path.parentPathId) return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        path.name.toLowerCase().includes(searchLower) ||
        path.path.toLowerCase().includes(searchLower) ||
        path.description?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const topLevelPaths = paths.filter(p => !p.parentPathId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading paths...</div>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Paths Management</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage navigation paths for the admin panel. Configure display order, active status, and hierarchy.
              </p>
            </div>
            <Button onClick={openCreateModal}>Add New Path</Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paths</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{paths.length}</div>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Paths</div>
            <div className="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">
              {paths.filter(p => p.isActive).length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive Paths</div>
            <div className="mt-1 text-3xl font-semibold text-gray-400 dark:text-gray-500">
              {paths.filter(p => !p.isActive).length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Level</div>
            <div className="mt-1 text-3xl font-semibold text-blue-600 dark:text-blue-400">
              {topLevelPaths.length}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter Paths
              </label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Paths</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="toplevel">Top Level Only</option>
                <option value="children">Child Paths Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search by name, path, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Paths Table */}
      <Card>
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Children
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPaths.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No paths found
                    </td>
                  </tr>
                ) : (
                  filteredPaths.map((path, index) => (
                    <tr key={path.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{path.displayOrder}</span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => movePathUp(path)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                              title="Move up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => movePathDown(path)}
                              disabled={index === filteredPaths.length - 1}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                              title="Move down"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {path.icon && <span className="mr-2 dark:text-gray-300">{path.icon}</span>}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{path.name}</div>
                            {path.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{path.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                          {path.path}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {path.parentPathName ? (
                          <span className="text-sm text-gray-600 dark:text-gray-300">{path.parentPathName}</span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(path)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            path.isActive
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {path.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{path.childPathCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditModal(path)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setPathToDelete(path);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          disabled={path.childPathCount > 0}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingPath ? 'Edit Admin Path' : 'Create Admin Path'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., User Management"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Path *
            </label>
            <Input
              type="text"
              value={formData.path}
              onChange={(e) => setFormData({ ...formData, path: e.target.value })}
              required
              placeholder="e.g., /admin/users"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Optional description of this path's purpose"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icon (emoji or text)
              </label>
              <Input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., 👥 or icon-users"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Order
              </label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Parent Path
            </label>
            <select
              value={formData.parentPathId}
              onChange={(e) => setFormData({ ...formData, parentPathId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">None (Top Level)</option>
              {topLevelPaths
                .filter(p => !editingPath || p.id !== editingPath.id)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Required Role
            </label>
            <Input
              type="text"
              value={formData.requiredRole}
              onChange={(e) => setFormData({ ...formData, requiredRole: e.target.value })}
              placeholder="e.g., admin, super_admin"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Active (visible in navigation)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingPath ? 'Update Path' : 'Create Path'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Delete"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete the path <strong>{pathToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}