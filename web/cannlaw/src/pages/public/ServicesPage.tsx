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
      <section className="py-16 bg-white dark:bg-navy-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {serviceCategories.map((category, categoryIndex) => (
            <div key={category.id} className={`${categoryIndex > 0 ? 'mt-16' : ''}`}>
              {/* Category Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-white mb-4">{category.name}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{category.description}</p>
              </div>

              {/* Services Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.services?.map((service) => (
                  <Card key={service.id} className="p-6 hover:shadow-lg transition-all dark:bg-navy-900 dark:border-navy-800 border-t-4 border-t-gold-500">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gold-100 dark:bg-gold-900 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">{service.name}</h3>
                        {service.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{service.description}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Contact CTA */}
          <div className="mt-16 bg-navy-50 dark:bg-navy-900 rounded-lg p-10 text-center transition-colors border border-navy-100 dark:border-navy-800 shadow-inner">
            <h3 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-4">
              Don't See Your Specific Need?
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto font-light">
              We handle a wide range of immigration matters. Contact us today to discuss your unique situation with our legal professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-bold uppercase tracking-wider rounded-sm text-white bg-blue-900 hover:bg-blue-800 shadow-md transition-all"
              >
                Schedule Consultation
              </a>
              <a 
                href={`tel:${siteConfig?.primaryPhone || '(410) 988-0123'}`}
                className="inline-flex items-center px-8 py-3 border border-blue-900 dark:border-gold-500 text-base font-bold uppercase tracking-wider rounded-sm text-blue-900 dark:text-gold-500 bg-white dark:bg-transparent hover:bg-blue-50 dark:hover:bg-navy-800 transition-all"
              >
                Call {siteConfig?.primaryPhone || '(410) 988-0123'}
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default ServicesPage
