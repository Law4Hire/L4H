import React from 'react'
import { Card } from '@l4h/shared-ui'
import { useAttorneys } from '../../hooks/useAttorneys'
import PublicLayout from '../../components/PublicLayout'
import { Mail, Phone, MapPin, Briefcase, Globe, Info } from 'lucide-react'

const AttorneysPage: React.FC = () => {
  const { attorneys, isLoading, error } = useAttorneys()

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-[60vh] bg-white dark:bg-navy-950">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
        </div>
      </PublicLayout>
    )
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh] bg-white dark:bg-navy-950 p-4 text-center">
          <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-4">Unable to Load Team</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">We're having trouble retrieving our legal team information. Please try again later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-950 rounded hover:bg-navy-800 dark:hover:bg-gold-400 transition-colors"
          >
            Retry
          </button>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-white">Our Legal Team</h1>
            <div className="w-24 h-1 bg-gold-500 mx-auto mb-8"></div>
            <p className="text-xl max-w-3xl mx-auto text-gray-300 font-light leading-relaxed">
              Experienced immigration professionals dedicated to providing comprehensive and compassionate representation since 1998.
            </p>
        </div>
      </section>

      {/* Attorneys Grid */}
      <section className="py-20 bg-gray-50 dark:bg-navy-950 transition-colors duration-300 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {attorneys.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500 dark:text-gray-400 text-xl">No team members currently listed.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {attorneys.map((attorney) => (
                    <div key={attorney.id} className="bg-white dark:bg-navy-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-t-4 border-gold-500 dark:border-navy-800 flex flex-col h-full group">
                    {/* Attorney Photo */}
                    <div className="pt-8 pb-4 text-center bg-gray-50 dark:bg-navy-800 transition-colors">
                        {attorney.photoUrl && !attorney.photoUrl.includes('placeholder') ? (
                        <img 
                            src={attorney.photoUrl} 
                            alt={attorney.name}
                            className="w-40 h-40 rounded-full mx-auto object-cover shadow-md border-4 border-white dark:border-navy-700 grayscale group-hover:grayscale-0 transition-all duration-500"
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
                            <p className="text-md text-gold-600 dark:text-gold-500 font-bold uppercase tracking-widest text-xs">{attorney.title}</p>
                        </div>

                        {/* Bio */}
                        {attorney.bio && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed line-clamp-6 border-b border-gray-100 dark:border-navy-800 pb-6 font-light">
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
                                <h4 className="font-bold text-navy-900 dark:text-white mb-3 text-[10px] uppercase tracking-widest">Expertise</h4>
                                <div className="flex flex-wrap gap-2">
                                    {practiceAreas.slice(0, 3).map((area: string, index: number) => (
                                    <span
                                        key={index}
                                        className="inline-block bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-200 text-[10px] font-bold uppercase px-2 py-1 rounded-sm border border-navy-100 dark:border-navy-700 tracking-tight"
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
                                    className="flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-500 transition-colors tracking-wide"
                                >
                                    <Mail className="w-3.5 h-3.5 mr-3 text-gold-500" />
                                    {attorney.email}
                                </a>
                                )}
                                {attorney.phone && (
                                <a 
                                    href={`tel:${attorney.phone}`} 
                                    className="flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-500 transition-colors tracking-wide"
                                >
                                    <Phone className="w-3.5 h-3.5 mr-3 text-gold-500" />
                                    {attorney.phone}
                                </a>
                                )}
                            </div>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-navy-900 dark:bg-navy-950 text-white transition-colors duration-300 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Ready to Work with Our Professionals?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto font-light">
            Our team is here to help you navigate your immigration journey with clarity and confidence. 
            Contact us today to schedule a consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="inline-flex items-center px-10 py-4 border border-transparent text-base font-bold uppercase tracking-wider rounded-sm text-navy-900 bg-gold-500 hover:bg-gold-400 shadow-lg transition-all"
            >
              Get Started
            </a>
            <a 
              href="tel:(410) 783-1888"
              className="inline-flex items-center px-10 py-4 border border-white text-base font-medium rounded-sm text-white hover:bg-white hover:text-navy-900 transition-all"
            >
              Call Us
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default AttorneysPage