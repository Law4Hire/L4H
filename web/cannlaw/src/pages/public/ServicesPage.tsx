import React from 'react'
import { Card } from '@l4h/shared-ui'
import { useServices } from '../../hooks/useServices'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import PublicLayout from '../../components/PublicLayout'

const ServicesPage: React.FC = () => {
  const { serviceCategories, isLoading } = useServices()
  const { siteConfig } = useSiteConfig()

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Immigration Services</h1>
            <p className="text-xl max-w-3xl mx-auto">
              {siteConfig?.primaryFocusStatement || 'Fast, efficient, and convenient. Comprehensive representation from state side through consular processing.'}
            </p>
          </div>
        </div>
      </section>

      {/* Services Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {serviceCategories.map((category, categoryIndex) => (
            <div key={category.id} className={`${categoryIndex > 0 ? 'mt-16' : ''}`}>
              {/* Category Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{category.name}</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">{category.description}</p>
              </div>

              {/* Services Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.services?.map((service) => (
                  <Card key={service.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                        {service.description && (
                          <p className="text-gray-600 text-sm">{service.description}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Contact CTA */}
          <div className="mt-16 bg-blue-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Don't See Your Specific Need?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              We handle a wide range of immigration matters. Contact us to discuss your specific situation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Schedule Consultation
              </a>
              <a 
                href={`tel:${siteConfig?.primaryPhone || '(410) 783-1888'}`}
                className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                Call {siteConfig?.primaryPhone || '(410) 783-1888'}
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default ServicesPage