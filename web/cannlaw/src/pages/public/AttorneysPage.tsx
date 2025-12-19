import React from 'react'
import { Card } from '@l4h/shared-ui'
import { useAttorneys } from '../../hooks/useAttorneys'
import PublicLayout from '../../components/PublicLayout'

const AttorneysPage: React.FC = () => {
  const { attorneys, isLoading } = useAttorneys()

  // Hardcoded fallback for all attorneys if API returns empty or fails
  const fallbackAttorneys = [
    {
      id: 'denise',
      name: 'Denise S. Cann',
      title: 'Founder and Managing Attorney',
      isManagingAttorney: true,
      bio: 'Denise S. Cann is the founder and managing attorney for Cann Legal Group. She has been practicing immigration law since 1998. Ms. Cann received her Juris Doctor degree from the University of Baltimore School of Law. She is a member of the American Immigration Lawyers Association (AILA).',
      email: 'dcann@cannlaw.com',
      phone: '(410) 783-1888',
      photoUrl: 'https://cannlaw.com/images/denise.jpg',
      practiceAreas: JSON.stringify(['Employment Immigration', 'Family Immigration', 'Deportation Defense']),
      languages: JSON.stringify(['English', 'Spanish']),
      isActive: true,
      credentials: JSON.stringify(['J.D. University of Baltimore School of Law', 'Member of AILA'])
    },
    {
      id: 'angela',
      name: 'Angela Taylor',
      title: 'Senior Attorney',
      isManagingAttorney: false,
      bio: 'Angela Taylor represents clients in all aspects of immigration law, including family-based petitions, naturalization, and removal defense. She is dedicated to providing compassionate and effective legal representation.',
      email: 'ataylor@cannlaw.com',
      phone: '(410) 783-1888',
      photoUrl: '',
      practiceAreas: JSON.stringify(['Family Immigration', 'Removal Defense']),
      languages: JSON.stringify(['English']),
      isActive: true,
      credentials: JSON.stringify(['J.D.', 'Member of State Bar'])
    },
    {
      id: 'john',
      name: 'John Charles',
      title: 'Director of Marketing',
      isManagingAttorney: false,
      bio: 'John Charles serves as the Director of Marketing and Business Development. He plays a key role in the firm\'s outreach and client relations strategies.',
      email: 'jcharles@cannlaw.com',
      phone: '(410) 783-1888',
      photoUrl: '',
      practiceAreas: JSON.stringify(['Business Development', 'Marketing']),
      languages: JSON.stringify(['English']),
      isActive: true,
      credentials: JSON.stringify([])
    },
    {
      id: 'alex',
      name: 'Alex Shu',
      title: 'Attorney',
      isManagingAttorney: false,
      bio: 'Alex Shu is an experienced attorney handling various immigration matters. He is committed to helping clients achieve their immigration goals.',
      email: 'ashu@cannlaw.com',
      phone: '(410) 783-1888',
      photoUrl: '',
      practiceAreas: JSON.stringify(['Immigration Law']),
      languages: JSON.stringify(['English']),
      isActive: true,
      credentials: JSON.stringify(['J.D.', 'Member of State Bar'])
    },
    {
      id: 'janice',
      name: 'Janice Lin',
      title: 'Attorney',
      isManagingAttorney: false,
      bio: 'Janice Lin focuses her practice on employment-based and family-based immigration. She works closely with clients to navigate the complex immigration system.',
      email: 'jlin@cannlaw.com',
      phone: '(410) 783-1888',
      photoUrl: '',
      practiceAreas: JSON.stringify(['Employment Immigration', 'Family Immigration']),
      languages: JSON.stringify(['English', 'Mandarin']),
      isActive: true,
      credentials: JSON.stringify(['J.D.', 'Member of State Bar'])
    },
    {
      id: 'chika',
      name: 'Chika Okala',
      title: 'Attorney',
      isManagingAttorney: false,
      bio: 'Chika Okala provides legal counsel in immigration law, assisting clients with visa applications and compliance issues.',
      email: 'cokala@cannlaw.com',
      phone: '(410) 783-1888',
      photoUrl: '',
      practiceAreas: JSON.stringify(['Immigration Law']),
      languages: JSON.stringify(['English']),
      isActive: true,
      credentials: JSON.stringify(['J.D.', 'Member of State Bar'])
    },
    {
      id: 'wen',
      name: 'Wen Lee',
      title: 'Attorney',
      isManagingAttorney: false,
      bio: 'Wen Lee specializes in business immigration, helping companies and individuals with work visas and green cards.',
      email: 'wlee@cannlaw.com',
      phone: '(410) 783-1888',
      photoUrl: '',
      practiceAreas: JSON.stringify(['Business Immigration']),
      languages: JSON.stringify(['English', 'Mandarin']),
      isActive: true,
      credentials: JSON.stringify(['J.D.', 'Member of State Bar'])
    },
    {
      id: 'katherine',
      name: 'Katherine J. Wong',
      title: 'Attorney',
      isManagingAttorney: false,
      bio: 'Katherine J. Wong handles a wide range of immigration cases. She is dedicated to providing personalized legal services to her clients.',
      email: 'kwong@cannlaw.com',
      phone: '(410) 783-1888',
      photoUrl: '',
      practiceAreas: JSON.stringify(['Immigration Law']),
      languages: JSON.stringify(['English']),
      isActive: true,
      credentials: JSON.stringify(['J.D.', 'Member of State Bar'])
    }
  ]

  const displayAttorneys = attorneys && attorneys.length > 0 ? attorneys : fallbackAttorneys

  // If loading takes too long, just show fallback (simulating API failure handling)
  // For now, we'll keep the spinner but ideally use a timeout to switch to fallback
  if (isLoading && attorneys.length === 0) {
     // Optional: You could return the fallback here if you want immediate render without spinner waiting
     // return <PublicLayout> ... render displayAttorneys ... </PublicLayout>
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-navy-900 text-white py-20 relative overflow-hidden">
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
              Experienced immigration attorneys dedicated to your success
            </p>
          </div>
        </div>
      </section>

      {/* Attorneys Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {displayAttorneys.map((attorney) => (
                <div key={attorney.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-t-4 border-gold-500">
                  {/* Attorney Photo */}
                  <div className="pt-8 pb-4 text-center bg-gray-50">
                    {attorney.photoUrl && !attorney.photoUrl.includes('placeholder') ? (
                      <img 
                        src={attorney.photoUrl} 
                        alt={attorney.name}
                        className="w-40 h-40 rounded-full mx-auto object-cover shadow-md border-4 border-white"
                        onError={(e) => {
                          e.currentTarget.onerror = null; 
                          e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + attorney.name.replace(' ', '+') + '&background=102a43&color=c5a059';
                        }}
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-full mx-auto bg-navy-800 flex items-center justify-center shadow-md border-4 border-white text-gold-500">
                        <span className="text-3xl font-serif font-bold">{attorney.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Attorney Info */}
                  <div className="p-6">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-serif font-bold text-navy-900 mb-1">{attorney.name}</h3>
                        <p className="text-md text-gold-600 font-medium uppercase tracking-wide">{attorney.title}</p>
                    </div>

                    {/* Bio */}
                    {attorney.bio && (
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-4 border-b border-gray-100 pb-6">
                        {attorney.bio}
                        </p>
                    )}

                    {/* Practice Areas */}
                    {attorney.practiceAreas && (() => {
                        try {
                        const practiceAreas = typeof attorney.practiceAreas === 'string' ? JSON.parse(attorney.practiceAreas) : attorney.practiceAreas
                        return (
                            <div className="mb-4">
                            <h4 className="font-bold text-navy-900 mb-2 text-xs uppercase tracking-wider">Practice Areas</h4>
                            <div className="flex flex-wrap gap-2">
                                {Array.isArray(practiceAreas) && practiceAreas.slice(0, 3).map((area: string, index: number) => (
                                <span
                                    key={index}
                                    className="inline-block bg-navy-50 text-navy-700 text-xs px-2 py-1 rounded border border-navy-100"
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

                    {/* Contact Info */}
                    <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                        {attorney.email && (
                        <a 
                            href={`mailto:${attorney.email}`} 
                            className="flex items-center text-sm text-gray-600 hover:text-gold-600 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-3 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {attorney.email}
                        </a>
                        )}
                        {attorney.phone && (
                        <a 
                            href={`tel:${attorney.phone}`} 
                            className="flex items-center text-sm text-gray-600 hover:text-gold-600 transition-colors"
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
              ))}
            </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Ready to Work with Our Team?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto font-light">
            Our experienced attorneys are here to help you navigate your immigration journey. 
            Contact us today to schedule a consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-bold uppercase tracking-wider rounded-sm text-navy-900 bg-gold-500 hover:bg-gold-400 shadow-lg"
            >
              Schedule Consultation
            </a>
            <a 
              href="tel:(410) 783-1888"
              className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-sm text-white hover:bg-white hover:text-navy-900 transition-colors"
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