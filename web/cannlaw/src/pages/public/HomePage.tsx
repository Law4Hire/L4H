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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
        </div>
      </PublicLayout>
    )
  }

  // Safely parse JSON with error handling
  const safeJsonParse = <T,>(jsonString: string | undefined | null, fallback: T): T => {
    if (!jsonString) return fallback
    try {
      return JSON.parse(jsonString) as T
    } catch (error) {
      return fallback
    }
  }

  const managingAttorney = attorneys?.find(a => a.isManagingAttorney) || attorneys?.[0]
  const uniqueSellingPoints = safeJsonParse(siteConfig?.uniqueSellingPoints, [])

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-navy-900 text-white min-h-[600px] flex items-center">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1505664194779-8beaceb93744?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                alt="Law Office Background" 
                className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-navy-900 opacity-70"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight text-white">
              {siteConfig?.firmName || 'Cann Legal Group'}
            </h1>
            <p className="text-xl md:text-2xl mb-10 font-light text-gray-100 leading-relaxed border-l-4 border-gold-500 pl-6">
              {siteConfig?.primaryFocusStatement || 'Fast, efficient, and convenient. Comprehensive representation from state side through consular processing.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="primary" 
                className="bg-gold-500 !text-navy-900 hover:bg-gold-400 px-8 py-4 text-lg font-bold uppercase tracking-wider shadow-xl border-none"
                onClick={() => window.location.href = '/contact'}
              >
                Free Consultation
              </Button>
              <Button 
                variant="outline" 
                className="border-white !text-white hover:bg-white hover:!text-navy-900 px-8 py-4 text-lg font-medium tracking-wide bg-transparent"
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
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-gold-600 font-bold tracking-widest uppercase text-sm">Why Choose Us</span>
              <h2 className="text-4xl font-serif font-bold text-navy-900 mt-2">Excellence in Immigration Law</h2>
              <div className="w-24 h-1 bg-gold-500 mx-auto mt-6"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-10">
              {uniqueSellingPoints.map((point: string, index: number) => (
                <div key={index} className="flex p-6 bg-navy-50 rounded-lg border border-navy-100 hover:shadow-lg transition-all duration-300">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-navy-900 rounded-full flex items-center justify-center text-gold-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy-900 mb-2">{point}</h3>
                    <p className="text-gray-600">Dedicated to providing the highest quality legal representation for our clients.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Overview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-navy-900 mb-4">Our Immigration Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive immigration law services with offices in the United States and Taiwan
            </p>
          </div>
          
          {!servicesLoading && serviceCategories && (
            <div className="grid md:grid-cols-3 gap-8">
              {serviceCategories.slice(0, 3).map((category) => (
                <div key={category.id} className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-gold-500">
                  <h3 className="text-2xl font-serif font-bold text-navy-900 mb-4">{category.name}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{category.description}</p>
                  <ul className="space-y-3 mb-8">
                    {category.services?.slice(0, 3).map((service) => (
                      <li key={service.id} className="text-sm text-gray-700 flex items-center">
                        <svg className="w-4 h-4 text-gold-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {service.name}
                      </li>
                    ))}
                  </ul>
                  <Link to="/services" className="text-navy-600 hover:text-navy-900 font-bold uppercase text-sm tracking-wide flex items-center">
                    Learn More <span className="ml-2">→</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/services">
              <Button variant="outline" className="px-10 py-3 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white transition-colors">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Law Library Highlight */}
      <section className="py-20 bg-navy-900 text-white relative overflow-hidden">
         {/* Decorative circle */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-navy-800 rounded-full opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-gold-500 font-bold tracking-widest uppercase text-sm mb-2 block">Resources</span>
              <h2 className="text-4xl font-serif font-bold text-white mb-6">Law Library & Resources</h2>
              <p className="text-lg text-gray-300 mb-8 font-light leading-relaxed">
                 Stay informed with our comprehensive collection of legal resources. We provide easy access to vital information including the Visa Bulletin, BIA Appeals Cases, and civil surgeon locators.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <div className="flex items-center text-gray-200">
                  <div className="w-10 h-10 bg-navy-800 rounded flex items-center justify-center mr-4 text-gold-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  Visa Bulletin
                </div>
                <div className="flex items-center text-gray-200">
                  <div className="w-10 h-10 bg-navy-800 rounded flex items-center justify-center mr-4 text-gold-500">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  Checklists
                </div>
                 <div className="flex items-center text-gray-200">
                  <div className="w-10 h-10 bg-navy-800 rounded flex items-center justify-center mr-4 text-gold-500">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 21h18M3 21l8-8m10 8l-8-8" /></svg>
                  </div>
                  Civil Surgeons
                </div>
                 <div className="flex items-center text-gray-200">
                  <div className="w-10 h-10 bg-navy-800 rounded flex items-center justify-center mr-4 text-gold-500">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  Case Decisions
                </div>
              </div>
              <Link to="/resources">
                <Button variant="primary" className="bg-gold-500 text-navy-900 hover:bg-gold-400 border-none px-8 py-3 font-bold uppercase tracking-wider">
                  Access Law Library
                </Button>
              </Link>
            </div>
            <div className="relative hidden md:block">
               <div className="bg-white p-2 transform rotate-2 rounded shadow-2xl">
                  <div className="bg-gray-100 border-4 border-double border-gray-300 p-8 text-center">
                    <svg className="w-24 h-24 text-navy-900 mx-auto opacity-20 mb-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L1 21h22L12 2zm0 3.8L19.4 19H4.6L12 5.8z"/>
                    </svg>
                    <h3 className="text-2xl font-serif font-bold text-navy-900">Legal Knowledge Base</h3>
                    <p className="mt-2 text-gray-500 font-serif italic">Empowering our clients with information.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Managing Attorney Highlight */}
      {managingAttorney && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-gold-600 font-bold tracking-widest uppercase text-sm mb-2 block">Leadership</span>
                <h2 className="text-3xl font-serif font-bold text-navy-900 mb-6">Meet Our Managing Attorney</h2>
                <h3 className="text-2xl font-medium text-navy-800 mb-2">{managingAttorney.name}</h3>
                <p className="text-gold-600 font-medium mb-6 uppercase tracking-wide text-sm">{managingAttorney.title}</p>
                <p className="text-gray-700 mb-8 leading-relaxed text-lg font-light">
                  {managingAttorney.bio || 'Experienced immigration attorney providing comprehensive legal services. Dedicated to navigating complex immigration laws to help families and businesses succeed.'}
                </p>
                <Link to="/attorneys">
                  <Button variant="outline" className="px-8 py-3 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white">
                    Meet Our Team
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-0 border-4 border-gold-500 transform translate-x-4 translate-y-4 rounded-lg"></div>
                {managingAttorney.photoUrl ? (
                  <img 
                    src={managingAttorney.photoUrl} 
                    alt={managingAttorney.name}
                    className="w-full h-auto rounded-lg shadow-xl relative z-10 grayscale hover:grayscale-0 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full aspect-square bg-navy-100 rounded-lg flex items-center justify-center shadow-xl relative z-10">
                    <svg className="w-32 h-32 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-20 bg-navy-900 text-white border-t border-navy-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-serif font-bold mb-6">Ready to Start Your Immigration Journey?</h2>
          <p className="text-xl mb-10 font-light text-gray-300">
            Contact us today for a free consultation and let us help you navigate the immigration process with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button variant="primary" className="bg-gold-500 !text-navy-900 hover:bg-gold-400 px-10 py-4 text-lg font-bold uppercase tracking-wider shadow-xl border-none">
                Get Free Consultation
              </Button>
            </Link>
            <a href={`tel:${siteConfig?.primaryPhone || '(410) 988-0123'}`}>
              <Button variant="outline" className="border-white !text-white hover:bg-white hover:!text-navy-900 px-10 py-4 text-lg">
                Call {siteConfig?.primaryPhone || '(410) 988-0123'}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default HomePage
