import React from 'react'
import { useAttorneys } from '../../hooks/useAttorneys'
import PublicLayout from '../../components/PublicLayout'

const AttorneysPage: React.FC = () => {
  const { attorneys, isLoading } = useAttorneys()

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-screen dark:bg-navy-950">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-navy-900 dark:bg-navy-950 text-white py-20 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 opacity-10">
            <img 
                src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                alt="Law Library Background" 
                className="w-full h-full object-cover"
            />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-white">Our Legal Team</h1>
            <p className="text-xl max-w-3xl mx-auto text-gray-300 font-light border-l-4 border-gold-500 pl-6 inline-block">
              Experienced immigration professionals dedicated to your success
            </p>
          </div>
        </div>
      </section>

      {/* Attorneys Grid */}
      <section className="py-20 bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {attorneys.map((attorney) => (
                <div key={attorney.id} className="bg-white dark:bg-navy-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-t-4 border-gold-500 dark:border-navy-800 flex flex-col h-full">
                  {/* Attorney Photo */}
                  <div className="pt-8 pb-4 text-center bg-gray-50 dark:bg-navy-800 transition-colors">
                    {attorney.photoUrl && !attorney.photoUrl.includes('placeholder') ? (
                      <img 
                        src={attorney.photoUrl} 
                        alt={attorney.name}
                        className="w-40 h-40 rounded-full mx-auto object-cover shadow-md border-4 border-white dark:border-navy-700"
                        onError={(e) => {
                          e.currentTarget.onerror = null; 
                          const initials = attorney.name.split(' ').map((n: string) => n[0]).join('');
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${initials}&background=102a43&color=c5a059&size=256&font-size=0.35`;
                        }}
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-full mx-auto bg-navy-800 dark:bg-navy-700 flex items-center justify-center shadow-md border-4 border-white dark:border-navy-600 text-gold-500">
                        <span className="text-4xl font-serif font-bold tracking-tighter">
                          {attorney.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Attorney Info */}
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-1">{attorney.name}</h3>
                        <p className="text-md text-gold-600 dark:text-gold-500 font-medium uppercase tracking-wide">{attorney.title}</p>
                    </div>

                    {/* Bio */}
                    {attorney.bio && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed line-clamp-6 border-b border-gray-100 dark:border-navy-800 pb-6">
                        {attorney.bio}
                        </p>
                    )}

                    {/* Practice Areas */}
                    {attorney.practiceAreas && (() => {
                        try {
                        const practiceAreas = typeof attorney.practiceAreas === 'string' ? JSON.parse(attorney.practiceAreas) : attorney.practiceAreas
                        if (!Array.isArray(practiceAreas) || practiceAreas.length === 0) return null
                        
                        return (
                            <div className="mb-4">
                            <h4 className="font-bold text-navy-900 dark:text-white mb-2 text-xs uppercase tracking-wider">Practice Areas</h4>
                            <div className="flex flex-wrap gap-2">
                                {practiceAreas.slice(0, 3).map((area: string, index: number) => (
                                <span
                                    key={index}
                                    className="inline-block bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-200 text-xs px-2 py-1 rounded border border-navy-100 dark:border-navy-700"
                                >
                                    {area}
                                </span>
                                ))}
                            </div>
                            </div>
                        )
                        } catch {
                        return null
                        }
                    })()}

                    <div className="mt-auto">
                        {/* Contact Info */}
                        <div className="pt-4 border-t border-gray-100 dark:border-navy-800 space-y-3">
                            {attorney.email && (
                            <a 
                                href={`mailto:${attorney.email}`} 
                                className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-500 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-3 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {attorney.email}
                            </a>
                            )}
                            {attorney.phone && (
                            <a 
                                href={`tel:${attorney.phone}`} 
                                className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-500 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-3 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {attorney.phone}
                            </a>
                            )}
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-navy-900 dark:bg-navy-950 text-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Ready to Work with Our Team?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto font-light">
            Our experienced professionals are here to help you navigate your immigration journey. 
            Contact us today to schedule a consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-bold uppercase tracking-wider rounded-sm text-navy-900 bg-gold-500 hover:bg-gold-400 shadow-lg transition-all"
            >
              Schedule Consultation
            </a>
            <a 
              href="tel:(410) 988-0123"
              className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-sm text-white hover:bg-white hover:text-navy-900 transition-all"
            >
              Call (410) 988-0123
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default AttorneysPage