import React from 'react'
import { Card } from '@l4h/shared-ui'
import { useAttorneys } from '../../hooks/useAttorneys'
import PublicLayout from '../../components/PublicLayout'

const AttorneysPage: React.FC = () => {
  const { attorneys, isLoading } = useAttorneys()

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
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Legal Team</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Experienced immigration attorneys dedicated to your success
            </p>
          </div>
        </div>
      </section>

      {/* Attorneys Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {attorneys.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">Attorney profiles will be available soon.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {attorneys.map((attorney) => (
                <Card key={attorney.id} className="p-6 hover:shadow-lg transition-shadow">
                  {/* Attorney Photo */}
                  <div className="text-center mb-6">
                    {attorney.photoUrl ? (
                      <img 
                        src={attorney.photoUrl} 
                        alt={attorney.name}
                        className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full mx-auto bg-gray-300 flex items-center justify-center shadow-lg">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Attorney Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{attorney.name}</h3>
                    <p className="text-lg text-blue-600 mb-2">{attorney.title}</p>
                    {attorney.isManagingAttorney && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Managing Attorney
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {attorney.bio && (
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-4">
                      {attorney.bio}
                    </p>
                  )}

                  {/* Practice Areas */}
                  {attorney.practiceAreas && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Practice Areas:</h4>
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(attorney.practiceAreas).slice(0, 3).map((area: string, index: number) => (
                          <span 
                            key={index}
                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {attorney.languages && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Languages:</h4>
                      <p className="text-gray-600 text-sm">
                        {JSON.parse(attorney.languages).join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Credentials */}
                  {attorney.credentials && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Credentials:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {JSON.parse(attorney.credentials).slice(0, 2).map((credential: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            {credential}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="border-t pt-4 space-y-2">
                    {attorney.email && (
                      <a 
                        href={`mailto:${attorney.email}`} 
                        className="flex items-center text-sm text-gray-600 hover:text-blue-600"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {attorney.email}
                      </a>
                    )}
                    {attorney.phone && (
                      <a 
                        href={`tel:${attorney.phone}`} 
                        className="flex items-center text-sm text-gray-600 hover:text-blue-600"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {attorney.phone}
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Work with Our Team?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Our experienced attorneys are here to help you navigate your immigration journey. 
            Contact us today to schedule a consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Schedule Consultation
            </a>
            <a 
              href="tel:(410) 783-1888"
              className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
            >
              Call (410) 783-1888
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default AttorneysPage