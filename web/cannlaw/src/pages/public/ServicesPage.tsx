import React, { useMemo } from 'react'
import { Card } from '@l4h/shared-ui'
import { useServices } from '../../hooks/useServices'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import PublicLayout from '../../components/PublicLayout'

const ServicesPage: React.FC = () => {
  const { serviceCategories, isLoading } = useServices()
  const { siteConfig } = useSiteConfig()

  // Static fallback data for services if API returns empty
  const displayCategories = useMemo(() => {
    if (serviceCategories && serviceCategories.length > 0) {
      return serviceCategories;
    }

    return [
      {
        id: 'family',
        name: 'Family Immigration',
        description: 'Keeping families together is our priority. We assist with all aspects of family-based immigration.',
        services: [
          { id: 'marriage', name: 'Marriage Visas (CR-1/IR-1)', description: 'For spouses of U.S. citizens and permanent residents.' },
          { id: 'fiance', name: 'Fiancé(e) Visas (K-1)', description: 'Bring your fiancé(e) to the U.S. to get married.' },
          { id: 'relatives', name: 'Immediate Relative Petitions', description: 'Sponsoring parents, children, and siblings.' },
          { id: 'consular', name: 'Consular Processing', description: 'Guidance through the visa interview process abroad.' }
        ]
      },
      {
        id: 'employment',
        name: 'Employment Immigration',
        description: 'Helping businesses and professionals navigate the complex U.S. work visa system.',
        services: [
          { id: 'h1b', name: 'H-1B Specialty Occupations', description: 'For professionals in specialty occupations.' },
          { id: 'l1', name: 'L-1 Intracompany Transferees', description: 'Transferring executives and specialized knowledge employees.' },
          { id: 'eb', name: 'Employment-Based Green Cards', description: 'Permanent residence through employment (EB-1, EB-2, EB-3).' },
          { id: 'investor', name: 'Investor Visas (E-2, EB-5)', description: 'For investors and treaty traders.' }
        ]
      },
      {
        id: 'citizenship',
        name: 'Citizenship & Naturalization',
        description: 'The final step in your immigration journey. We help you become a U.S. citizen.',
        services: [
          { id: 'naturalization', name: 'Naturalization Applications (N-400)', description: 'Guiding permanent residents to citizenship.' },
          { id: 'certs', name: 'Citizenship Certificates', description: 'For those who acquired citizenship through parents.' }
        ]
      },
      {
        id: 'other',
        name: 'Other Services',
        description: 'Additional immigration legal services to meet your needs.',
        services: [
          { id: 'asylum', name: 'Asylum & Refugee Status', description: 'Protection for those fearing persecution.' },
          { id: 'waivers', name: 'Waivers of Inadmissibility', description: 'Overcoming barriers to entry.' },
          { id: 'daca', name: 'DACA Renewals', description: 'Deferred Action for Childhood Arrivals.' }
        ]
      }
    ];
  }, [serviceCategories]);

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
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 dark:from-gray-900 dark:to-gray-800 text-white py-16">
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
          {displayCategories.map((category: any, categoryIndex: number) => (
            <div key={category.id} className={`mb-16 bg-gray-50 dark:bg-navy-900 rounded-xl p-8 border border-gray-100 dark:border-navy-700 shadow-sm`}>
              {/* Category Header */}
              <div className="text-center mb-10 border-b border-gray-200 dark:border-navy-700 pb-6">
                <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-white mb-3">{category.name}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{category.description}</p>
              </div>

              {/* Services Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.services?.map((service: any) => (
                  <Card key={service.id} className="p-6 hover:shadow-lg transition-all bg-white dark:bg-navy-800 dark:border-navy-600 border-t-4 border-t-gold-500 dark:border-t-gold-500 h-full flex flex-col">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gold-100 dark:bg-gold-900/50 rounded-full flex items-center justify-center">
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
          <div className="mt-16 bg-navy-50 dark:bg-navy-800 rounded-lg p-10 text-center transition-colors border border-navy-100 dark:border-navy-700 shadow-inner">
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