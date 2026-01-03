import React, { useState, useEffect } from 'react'
import { Card, Button, Modal } from '@l4h/shared-ui'
import PublicLayout from '../../components/PublicLayout'

interface VisaType {
  id: number
  name: string
  code: string
  description: string | null
  isActive: boolean
}

interface VisaLibraryTile {
  id: string
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
  visaTypes: VisaType[]
}

const ResourcesPage: React.FC = () => {
  const [tiles, setTiles] = useState<VisaLibraryTile[]>([])
  const [selectedVisa, setSelectedVisa] = useState<VisaType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVisaLibrary = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/v1/visa-library/tiles')
        if (!response.ok) {
          throw new Error('Failed to fetch visa library')
        }
        const data = await response.json()
        setTiles(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchVisaLibrary()
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

          {tiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No visa information available at this time. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-16">
              {tiles.map((tile) => (
                <section key={tile.id}>
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-serif font-bold text-navy-900 dark:text-white mb-3">
                      {tile.name}
                    </h3>
                    {tile.description && (
                      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        {tile.description}
                      </p>
                    )}
                  </div>
                  {tile.visaTypes.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {tile.visaTypes.map((visa) => (
                        <div
                          key={visa.id}
                          className="bg-white dark:bg-navy-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-t-4 border-navy-900 dark:border-gold-500 flex flex-col h-full group cursor-pointer"
                          onClick={() => setSelectedVisa(visa)}
                        >
                          <div className="p-6 flex-grow text-center">
                            <div className="w-16 h-16 bg-navy-50 dark:bg-navy-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gold-600 dark:text-gold-500 group-hover:bg-navy-900 dark:group-hover:bg-gold-500 dark:group-hover:text-white transition-colors">
                              <span className="text-xl font-bold">{visa.code}</span>
                            </div>
                            <h4 className="text-lg font-serif font-bold text-navy-900 dark:text-white mb-2 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                              {visa.name}
                            </h4>
                            {visa.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                                {visa.description}
                              </p>
                            )}
                          </div>
                          <div className="px-6 pb-6 bg-gray-50 dark:bg-navy-700 border-t border-gray-100 dark:border-navy-600 mt-auto pt-4">
                            <span className="text-navy-600 dark:text-gold-500 font-bold uppercase text-xs tracking-wider group-hover:text-gold-600 dark:group-hover:text-white transition-colors flex items-center justify-center">
                              Learn More
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visa Detail Modal */}
      {selectedVisa && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-navy-900 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setSelectedVisa(null)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-navy-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white dark:bg-navy-800 px-4 pt-5 pb-4 sm:p-8">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-navy-900 dark:bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-white dark:text-navy-900">{selectedVisa.code}</span>
                  </div>
                  <h3 className="text-3xl leading-6 font-serif font-bold text-navy-900 dark:text-white mb-3" id="modal-title">
                    {selectedVisa.name}
                  </h3>
                  {selectedVisa.description && (
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                      {selectedVisa.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 bg-blue-50 dark:bg-navy-700 rounded-lg p-6">
                  <p className="text-gray-700 dark:text-gray-300 text-center">
                    For detailed information about <strong>{selectedVisa.name} ({selectedVisa.code})</strong> eligibility requirements,
                    application process, and benefits, please schedule a consultation with our immigration experts.
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-navy-700 px-4 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto bg-navy-900 hover:bg-navy-800 dark:bg-gold-600 dark:hover:bg-gold-500 dark:text-navy-900 font-bold"
                  onClick={() => window.location.href = '/contact'}
                >
                  Schedule Consultation
                </Button>
                <Button
                  variant="outline"
                  className="mt-3 w-full sm:w-auto sm:mt-0 dark:bg-transparent dark:text-gray-300 dark:border-gray-600 dark:hover:bg-navy-600"
                  onClick={() => setSelectedVisa(null)}
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
