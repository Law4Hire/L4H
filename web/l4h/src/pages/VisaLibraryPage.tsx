import React, { useState, useEffect } from 'react'
import { Card, Modal, Button } from '@l4h/shared-ui'
import { useNavigate } from 'react-router-dom'

interface VisaType {
  code: string
  name: string
  generalCategory: string
  description: string
}

// Fixed QueryClient issue - using useState instead of useQuery
const VisaLibraryPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedVisa, setSelectedVisa] = useState<VisaType | null>(null)

      // Use static data instead of React Query to avoid provider issues
    const [visaTypes, setVisaTypes] = useState<VisaType[]>([])
    const [isLoading, setIsLoading] = useState(true)
  
    useEffect(() => {
      // Fetch active visa types from the database
      const fetchVisaTypes = async () => {
        try {
          setIsLoading(true)
          const response = await fetch('/api/v1/visa-types')
          if (!response.ok) {
            throw new Error('Failed to load visa types')
          }
          const data = await response.json()
          setVisaTypes(data)
        } catch (error) {
          console.error('Error loading visa types:', error)
          // Optionally set empty array or show error message
          setVisaTypes([])
        } finally {
          setIsLoading(false)
        }
      }

      fetchVisaTypes()
  }, [])

  const groupedVisaTypes = visaTypes.reduce((acc, visa) => {
    if (!acc[visa.generalCategory]) {
      acc[visa.generalCategory] = []
    }
    acc[visa.generalCategory].push(visa)
    return acc
  }, {} as Record<string, VisaType[]>)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            US Visa Types Library
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore comprehensive information about different US visa categories. Click on any visa type to learn about eligibility requirements, application process, and benefits.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading visa information...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedVisaTypes).map(([category, visas]) => (
              <section key={category}>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                  {`${category} Visas`}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visas.map((visa) => (
                    <Card
                      key={visa.code}
                      className="p-6 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 hover:border-blue-200"
                      onClick={() => setSelectedVisa(visa)}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {visa.code}
                          </span>
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                          {visa.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {visa.description}
                        </p>
                        <span className="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                          Learn More →
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-blue-600 dark:bg-blue-700 rounded-lg p-8 text-center text-white mt-16">
          <h3 className="text-2xl font-bold mb-4">
            Need Help Choosing the Right Visa?
          </h3>
          <p className="text-lg text-blue-100 dark:text-blue-200 mb-6">
            Our immigration experts can help you determine which visa category fits your situation best.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Start Your Application
          </button>
        </div>
      </main>

      {/* Visa Detail Modal */}
      {selectedVisa && (
        <Modal
          open={!!selectedVisa}
          onClose={() => setSelectedVisa(null)}
          title={`${selectedVisa.code} - ${selectedVisa.name}`}
          size="lg"
          closeButtonLabel='Close'
        >
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-lg">Category</h4>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {`${selectedVisa.generalCategory} Visa`}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-lg">Description</h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {selectedVisa.description}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Next Steps</h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                {`Ready to apply for the ${selectedVisa.code} visa? Our immigration attorneys can guide you through the entire process.`}
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedVisa(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedVisa(null)
                  navigate('/login')
                }}
              >
                {`Apply for ${selectedVisa.code} Visa`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default VisaLibraryPage