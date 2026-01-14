import React, { useState, useEffect } from 'react'
import { Card, Button, Modal, Input, useToast } from '@l4h/shared-ui'
import PublicLayout from '../../components/PublicLayout'

interface SiteContent {
  id?: string
  contentType: string
  title: string
  content: string
  summary?: string
  author?: string
  imageUrl?: string
  isPublished: boolean
  publishedAt?: string
  tags?: string
  createdAt?: string
}

const CONTENT_TYPES = [
  { value: 'blog', label: 'Blog Post' },
  { value: 'news', label: 'Latest News' },
  { value: 'resource', label: 'Law Library Resource' },
]

const AdminContentManagementPage: React.FC = () => {
  const [contentList, setContentList] = useState<SiteContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContent, setEditingQuestion] = useState<SiteContent | null>(null)
  const { success, error } = useToast()
  const [content, setContent] = useState<SiteContent[]>([]);

  const [formData, setFormData] = useState<SiteContent>({
    contentType: 'blog',
    title: '',
    content: '',
    summary: '',
    author: 'Denise S. Cann',
    isPublished: false,
    tags: ''
  })

  const loadContent = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('jwt_token')
      const headers = {
        'Authorization': `Bearer ${token}`
      }
      const response = await fetch('/api/v1/admin/content', { headers })
      if (!response.ok) {
        throw new Error('Failed to load content data')
      }
      const data = await response.json()
      setContent(data)
    } catch (err) {
      console.error('Error loading content:', err)
      error('Failed to load content')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const handleOpenModal = (content?: SiteContent) => {
    if (content) {
      setEditingQuestion(content)
      setFormData({ ...content })
    } else {
      setEditingQuestion(null)
      setFormData({
        contentType: 'blog',
        title: '',
        content: '',
        summary: '',
        author: 'Denise S. Cann',
        isPublished: false,
        tags: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('jwt_token')
      const method = editingContent ? 'PUT' : 'POST'
      const url = editingContent 
        ? `/api/v1/admin/site-content/${editingContent.id}` 
        : '/api/v1/admin/site-content'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        success(`Content ${editingContent ? 'updated' : 'created'} successfully`)
        setShowModal(false)
        loadContent()
      } else {
        error('Failed to save content')
      }
    } catch (err) {
      error('An error occurred while saving')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/admin/site-content/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        success('Content deleted successfully')
        loadContent()
      }
    } catch (err) {
      error('Failed to delete content')
    }
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-navy-900">Content Management</h1>
          <Button onClick={() => handleOpenModal()}>Add New Content</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {contentList.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded">
                        {item.contentType}
                      </span>
                      {item.isPublished ? (
                        <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-green-100 text-green-800 rounded">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-800 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-navy-900">{item.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      By {item.author} • {new Date(item.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(item)}>Edit</Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(item.id!)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
            {contentList.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500">No content found. Start by creating your first post.</p>
              </div>
            )}
          </div>
        )}

        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={editingContent ? 'Edit Content' : 'Create New Content'}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                >
                  {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summary (Short description)</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded"
                rows={2}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (Supports HTML)</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded font-mono text-sm"
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Comma separated)</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g. immigration, visa, h1b"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">Published (Visible on site)</label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit">{editingContent ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </PublicLayout>
  )
}

export default AdminContentManagementPage
