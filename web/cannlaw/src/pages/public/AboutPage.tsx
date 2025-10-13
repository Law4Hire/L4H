import React from 'react'
import { Card } from '@l4h/shared-ui'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import { useAttorneys } from '../../hooks/useAttorneys'
import PublicLayout from '../../components/PublicLayout'

const AboutPage: React.FC = () => {
  const { siteConfig, isLoading: configLoading } = useSiteConfig()
  const { attorneys, isLoading: attorneysLoading } = useAttorneys()

  if (configLoading || attorneysLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PublicLayout>
    )
  }

  const locations = siteConfig?.locations ? JSON.parse(siteConfig.locations) : []
  const managingAttorney = attorneys?.find(a => a.isManagingAttorney) || attorneys?.[0]

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Cann Legal Group</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Comprehensive immigration law services with a global perspective and local expertise
            </p>
          </div>
        </div>
      </section>

      {/* Firm Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                {siteConfig?.primaryFocusStatement || 'Fast, efficient, and convenient. Comprehensive representation from state side through consular processing.'}
              </p>
              <p className="text-gray-700 mb-6 leading-relaxed">
                At Cann Legal Group, we understand that immigration law can be complex and overwhelming. 
                Our experienced team is dedicated to providing personalized, professional legal services 
                to help individuals and families navigate the U.S. immigration system successfully.
              </p>
              <p className="text-gray-700 leading-relaxed">
                With offices in the United States and Taiwan, we offer unique international perspective 
                and comprehensive support throughout your immigration journey.
              </p>
            </div>
            <div className="bg-blue-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-blue-900 mb-4">Why Choose Us?</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Experienced immigration attorneys</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">International office locations</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">24/7 round-the-clock support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Direct online client access</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Comprehensive case management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Managing Attorney Spotlight */}
      {managingAttorney && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Leadership</h2>
            </div>
            <Card className="max-w-4xl mx-auto p-8">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="text-center">
                  {managingAttorney.photoUrl ? (
                    <img 
                      src={managingAttorney.photoUrl} 
                      alt={managingAttorney.name}
                      className="w-48 h-48 rounded-full mx-auto object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-full mx-auto bg-gray-300 flex items-center justify-center shadow-lg">
                      <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{managingAttorney.name}</h3>
                  <p className="text-lg text-blue-600 mb-4">{managingAttorney.title}</p>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {managingAttorney.bio || 'Experienced immigration attorney providing comprehensive legal services with a focus on client success and satisfaction.'}
                  </p>
                  
                  {managingAttorney.credentials && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Credentials:</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {JSON.parse(managingAttorney.credentials).map((credential: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {credential}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 text-sm text-gray-600">
                    {managingAttorney.email && (
                      <a href={`mailto:${managingAttorney.email}`} className="hover:text-blue-600">
                        📧 {managingAttorney.email}
                      </a>
                    )}
                    {managingAttorney.phone && (
                      <a href={`tel:${managingAttorney.phone}`} className="hover:text-blue-600">
                        📞 {managingAttorney.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Office Locations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Locations</h2>
            <p className="text-lg text-gray-600">
              Serving clients from multiple strategic locations
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {locations.map((location: any, index: number) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{location.type}</h3>
                <p className="text-gray-600">{location.city}</p>
                {location.address && <p className="text-gray-600">{location.address}</p>}
                {location.zip && <p className="text-gray-600">{location.zip}</p>}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-xl max-w-2xl mx-auto">
              The principles that guide our practice and commitment to our clients
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Efficiency</h3>
              <p className="text-blue-100">
                Fast, streamlined processes that respect your time and urgency
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Integrity</h3>
              <p className="text-blue-100">
                Honest, transparent communication throughout your legal journey
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Global Reach</h3>
              <p className="text-blue-100">
                International perspective with local expertise and support
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default AboutPage