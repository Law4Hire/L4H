import React from 'react'
import { Link } from 'react-router-dom'
import { Card, Button } from '@l4h/shared-ui'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { useServices } from '../../hooks/useServices'
import { useAttorneys } from '../../hooks/useAttorneys'
import PublicLayout from '../../components/PublicLayout'

const HomePage: React.FC = () => {
  const { siteConfig, isLoading: configLoading } = useSiteConfig()
  const { serviceCategories, isLoading: servicesLoading } = useServices()
  const { attorneys } = useAttorneys()

  if (configLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PublicLayout>
    )
  }

  const managingAttorney = attorneys?.find(a => a.isManagingAttorney) || attorneys?.[0]
  const uniqueSellingPoints = siteConfig?.uniqueSellingPoints ? JSON.parse(siteConfig.uniqueSellingPoints) : []

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {siteConfig?.firmName || 'Cann Legal Group'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              {siteConfig?.primaryFocusStatement || 'Fast, efficient, and convenient. Comprehensive representation from state side through consular processing.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="primary" 
                className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 text-lg"
                onClick={() => window.location.href = '/contact'}
              >
                Free Consultation
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 text-lg"
                onClick={() => window.location.href = '/services'}
              >
                Our Services
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Unique Selling Points */}
      {uniqueSellingPoints.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Cann Legal Group?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {uniqueSellingPoints.map((point: string, index: number) => (
                <Card key={index} className="text-center p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{point}</h3>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Immigration Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive immigration law services with offices in the United States and Taiwan
            </p>
          </div>
          
          {!servicesLoading && serviceCategories && (
            <div className="grid md:grid-cols-3 gap-8">
              {serviceCategories.slice(0, 3).map((category) => (
                <Card key={category.id} className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{category.name}</h3>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <ul className="space-y-2 mb-6">
                    {category.services?.slice(0, 3).map((service) => (
                      <li key={service.id} className="text-sm text-gray-700 flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {service.name}
                      </li>
                    ))}
                  </ul>
                  <Link to="/services" className="text-blue-600 hover:text-blue-800 font-medium">
                    Learn More →
                  </Link>
                </Card>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/services">
              <Button variant="primary" className="px-8 py-3">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Managing Attorney Highlight */}
      {managingAttorney && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Meet Our Managing Attorney</h2>
                <h3 className="text-2xl font-semibold text-blue-900 mb-2">{managingAttorney.name}</h3>
                <p className="text-lg text-gray-600 mb-4">{managingAttorney.title}</p>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {managingAttorney.bio || 'Experienced immigration attorney providing comprehensive legal services.'}
                </p>
                <Link to="/attorneys">
                  <Button variant="outline" className="px-6 py-2">
                    Meet Our Team
                  </Button>
                </Link>
              </div>
              <div className="text-center">
                {managingAttorney.photoUrl ? (
                  <img 
                    src={managingAttorney.photoUrl} 
                    alt={managingAttorney.name}
                    className="w-64 h-64 rounded-full mx-auto object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-64 h-64 rounded-full mx-auto bg-gray-300 flex items-center justify-center shadow-lg">
                    <svg className="w-32 h-32 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Immigration Journey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Contact us today for a free consultation and let us help you navigate the immigration process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button variant="primary" className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 text-lg">
                Get Free Consultation
              </Button>
            </Link>
            <a href={`tel:${siteConfig?.primaryPhone || '(410) 783-1888'}`}>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 text-lg">
                Call {siteConfig?.primaryPhone || '(410) 783-1888'}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default HomePage