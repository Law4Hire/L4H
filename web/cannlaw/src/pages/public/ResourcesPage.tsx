import React, { useState, useEffect } from 'react'
import { Card, Button, Modal } from '@l4h/shared-ui'
import PublicLayout from '../../components/PublicLayout'

interface ResourceContent {
  id: string
  title: string
  summary: string | null
  content: string
  contentType: string
  author: string | null
  imageUrl: string | null
  publishedAt: string
  tags: string | null
}

const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<ResourceContent[]>([])
  const [selectedResource, setSelectedResource] = useState<ResourceContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/v1/public/site-content?type=resource')
        if (!response.ok) {
          throw new Error('Failed to fetch resources')
        }
        const data = await response.json()
        setResources(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [])

  if (loading) {
    return (
      <PublicLayout>
        <div className="bg-gray-50 dark:bg-navy-950 min-h-screen py-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
        </div>
      </PublicLayout>
    )
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="bg-gray-50 dark:bg-navy-950 min-h-screen py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-red-600 dark:text-red-400">Error loading resources: {error}</p>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="bg-gray-50 dark:bg-navy-950 min-h-screen py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold-600 font-bold tracking-widest uppercase text-sm mb-2 block">Knowledge Base</span>
            <h1 className="text-4xl font-serif font-bold text-navy-900 dark:text-white mb-6">Immigration Law Library</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
              Explore our comprehensive guides to understanding various visa types and immigration processes.
            </p>
          </div>

          {resources.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No resources available at this time. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white dark:bg-navy-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-t-4 border-navy-900 dark:border-gold-500 flex flex-col h-full group cursor-pointer"
                  onClick={() => setSelectedResource(resource)}
                >
                  <div className="p-8 flex-grow">
                    <div className="w-12 h-12 bg-navy-50 dark:bg-navy-700 rounded-lg flex items-center justify-center mb-6 text-gold-500 group-hover:bg-navy-900 dark:group-hover:bg-gold-500 dark:group-hover:text-navy-900 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-navy-900 dark:text-white mb-3 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">{resource.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">{resource.summary || 'Click to read more'}</p>
                  </div>
                  <div className="px-8 pb-8 bg-gray-50 dark:bg-navy-700 border-t border-gray-100 dark:border-navy-600 mt-auto pt-4">
                    <span className="text-navy-600 dark:text-gold-500 font-bold uppercase text-xs tracking-wider group-hover:text-gold-600 dark:group-hover:text-white transition-colors flex items-center">
                      Read Details
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-navy-900 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setSelectedResource(null)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-navy-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-navy-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-2xl leading-6 font-serif font-bold text-navy-900 dark:text-white mb-6" id="modal-title">
                      {selectedResource.title}
                    </h3>
                    <div className="mt-2 text-gray-600 dark:text-gray-300 prose dark:prose-invert max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedResource.content }}>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-navy-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto sm:ml-3 bg-navy-900 hover:bg-navy-800 dark:bg-gold-600 dark:hover:bg-gold-500 dark:text-navy-900 font-bold"
                  onClick={() => window.location.href = '/contact'}
                >
                  Schedule Consultation
                </Button>
                <Button
                  variant="outline"
                  className="mt-3 w-full sm:w-auto sm:mt-0 dark:bg-transparent dark:text-gray-300 dark:border-gray-600 dark:hover:bg-navy-600"
                  onClick={() => setSelectedResource(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  )
}

export default ResourcesPage
