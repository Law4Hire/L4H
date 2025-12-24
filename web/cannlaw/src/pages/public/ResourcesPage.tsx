import React, { useState } from 'react'
import { Card, Button, Modal } from '@l4h/shared-ui'
import PublicLayout from '../../components/PublicLayout'

interface VisaInfo {
  id: string
  title: string
  shortDesc: string
  fullContent: string
}

const visaTypes: VisaInfo[] = [
  {
    id: 'k1',
    title: 'K-1 Fiancé(e) Visa',
    shortDesc: 'For foreign-citizen fiancé(e)s of U.S. citizens.',
    fullContent: `
      <h3 class="text-xl font-bold mb-4">K-1 Fiancé(e) Visa</h3>
      <p class="mb-4">The K-1 nonimmigrant visa is for the foreign-citizen fiancé(e) of a United States (U.S.) citizen. The K-1 visa permits the foreign-citizen fiancé(e) to travel to the United States and marry his or her U.S. citizen sponsor within 90 days of arrival.</p>
      <h4 class="font-bold mb-2">Requirements:</h4>
      <ul class="list-disc pl-5 mb-4 space-y-2">
        <li>The sponsoring petitioner must be a U.S. citizen.</li>
        <li>Both parties must be free to marry (single, divorced, or widowed).</li>
        <li>The couple must have met in person within the last two years (some exceptions apply).</li>
        <li>Marriage must take place within 90 days of the fiancé(e)'s entry into the U.S.</li>
      </ul>
      <p>After marriage, the foreign citizen will apply for adjustment of status to a permanent resident (LPR) with the Department of Homeland Security (DHS), U.S. Citizenship and Immigration Services (USCIS).</p>
    `
  },
  {
    id: 'h1b',
    title: 'H-1B Specialty Occupations',
    shortDesc: 'For workers in specialty occupations.',
    fullContent: `
      <h3 class="text-xl font-bold mb-4">H-1B Visa for Specialty Occupations</h3>
      <p class="mb-4">The H-1B program allows companies in the United States to temporarily employ foreign workers in occupations that require the theoretical and practical application of a body of highly specialized knowledge and a bachelor's degree or higher in the specific specialty, or its equivalent.</p>
      <h4 class="font-bold mb-2">Key Features:</h4>
      <ul class="list-disc pl-5 mb-4 space-y-2">
        <li>Requires a specific job offer from a U.S. employer.</li>
        <li>The position must qualify as a "specialty occupation".</li>
        <li>Subject to an annual numerical cap (cap-subject) unless exempt.</li>
        <li>Initial stay of up to 3 years, extendable to 6 years (with exceptions).</li>
      </ul>
    `
  },
  {
    id: 'l1',
    title: 'L-1 Intracompany Transferee',
    shortDesc: 'For transferring employees within the same company.',
    fullContent: `
      <h3 class="text-xl font-bold mb-4">L-1 Intracompany Transferee Visa</h3>
      <p class="mb-4">The L-1 visa enables a U.S. employer to transfer an executive or manager from one of its affiliated foreign offices to one of its offices in the United States. It also enables a foreign company which does not yet have an affiliated U.S. office to send an executive or manager to the United States with the purpose of establishing one.</p>
      <h4 class="font-bold mb-2">Categories:</h4>
      <ul class="list-disc pl-5 mb-4 space-y-2">
        <li><strong>L-1A:</strong> For Intracompany Transferees in Managerial or Executive Positions.</li>
        <li><strong>L-1B:</strong> For Intracompany Transferees with Specialized Knowledge.</li>
      </ul>
    `
  },
  {
    id: 'e2',
    title: 'E-2 Treaty Investor',
    shortDesc: 'For investors from treaty countries.',
    fullContent: `
      <h3 class="text-xl font-bold mb-4">E-2 Treaty Investor Visa</h3>
      <p class="mb-4">The E-2 nonimmigrant classification allows a national of a treaty country (a country with which the United States maintains a treaty of commerce and navigation) to be admitted to the United States when investing a substantial amount of capital in a U.S. business.</p>
      <h4 class="font-bold mb-2">Qualifications:</h4>
      <ul class="list-disc pl-5 mb-4 space-y-2">
        <li>Be a national of a country with which the United States maintains a treaty of commerce and navigation.</li>
        <li>Have invested, or be actively in the process of investing, a substantial amount of capital in a bona fide enterprise in the United States.</li>
        <li>Be seeking to enter the United States solely to develop and direct the investment enterprise.</li>
      </ul>
    `
  },
  {
    id: 'family',
    title: 'Family-Based Immigration',
    shortDesc: 'Immediate relatives and family preference categories.',
    fullContent: `
      <h3 class="text-xl font-bold mb-4">Family-Based Immigration</h3>
      <p class="mb-4">U.S. citizens and Lawful Permanent Residents (LPRs) can petition for certain family members to immigrate to the United States.</p>
      <h4 class="font-bold mb-2">Immediate Relatives of U.S. Citizens (No numerical limit):</h4>
      <ul class="list-disc pl-5 mb-4 space-y-2">
        <li>Spouses of U.S. citizens.</li>
        <li>Unmarried children under 21 years of age of U.S. citizens.</li>
        <li>Parents of U.S. citizens (if the U.S. citizen is 21 years of age or older).</li>
      </ul>
      <h4 class="font-bold mb-2">Family Preference Categories (Limited number of visas):</h4>
      <ul class="list-disc pl-5 mb-4 space-y-2">
        <li>Unmarried sons and daughters of U.S. citizens.</li>
        <li>Spouses, children, and unmarried sons and daughters of permanent residents.</li>
        <li>Married sons and daughters of U.S. citizens.</li>
        <li>Brothers and sisters of adult U.S. citizens.</li>
      </ul>
    `
  },
  {
    id: 'naturalization',
    title: 'Naturalization',
    shortDesc: 'The process of becoming a U.S. citizen.',
    fullContent: `
      <h3 class="text-xl font-bold mb-4">Naturalization</h3>
      <p class="mb-4">Naturalization is the process by which U.S. citizenship is granted to a foreign citizen or national after he or she fulfills the requirements established by Congress in the Immigration and Nationality Act (INA).</p>
      <h4 class="font-bold mb-2">General Requirements:</h4>
      <ul class="list-disc pl-5 mb-4 space-y-2">
        <li>Be at least 18 years old.</li>
        <li>Have been a permanent resident (green card holder) for at least 5 years (or 3 years if married to a U.S. citizen).</li>
        <li>Demonstrate continuous residence and physical presence in the U.S.</li>
        <li>Have good moral character.</li>
        <li>Demonstrate an attachment to the principles of the U.S. Constitution.</li>
        <li>Be able to read, write, and speak basic English.</li>
        <li>Pass a test on U.S. history and government.</li>
      </ul>
    `
  }
]

const ResourcesPage: React.FC = () => {
  const [selectedVisa, setSelectedVisa] = useState<VisaInfo | null>(null)

  return (
    <PublicLayout>
      <div className="bg-gray-50 dark:bg-navy-950 min-h-screen py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold-600 font-bold tracking-widest uppercase text-sm mb-2 block">Knowledge Base</span>
            <h1 className="text-4xl font-serif font-bold text-navy-900 dark:text-white mb-6">Immigration Law Library</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
              Explore our comprehensive guides to understanding various visa types and immigration processes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visaTypes.map((visa) => (
              <div 
                key={visa.id} 
                className="bg-white dark:bg-navy-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-t-4 border-navy-900 dark:border-gold-500 flex flex-col h-full group cursor-pointer"
                onClick={() => setSelectedVisa(visa)}
              >
                <div className="p-8 flex-grow">
                  <div className="w-12 h-12 bg-navy-50 dark:bg-navy-700 rounded-lg flex items-center justify-center mb-6 text-gold-500 group-hover:bg-navy-900 dark:group-hover:bg-gold-500 dark:group-hover:text-navy-900 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-navy-900 dark:text-white mb-3 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">{visa.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">{visa.shortDesc}</p>
                </div>
                <div className="px-8 pb-8 bg-gray-50 dark:bg-navy-700 border-t border-gray-100 dark:border-navy-600 mt-auto pt-4">
                  <span className="text-navy-600 dark:text-gold-500 font-bold uppercase text-xs tracking-wider group-hover:text-gold-600 dark:group-hover:text-white transition-colors flex items-center">
                    Read Details
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visa Detail Modal */}
      {selectedVisa && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-navy-900 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setSelectedVisa(null)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-navy-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-navy-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-2xl leading-6 font-serif font-bold text-navy-900 dark:text-white mb-6" id="modal-title">
                      {selectedVisa.title}
                    </h3>
                    <div className="mt-2 text-gray-600 dark:text-gray-300 prose dark:prose-invert max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedVisa.fullContent }}>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-navy-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button 
                  variant="primary" 
                  className="w-full sm:w-auto sm:ml-3 bg-navy-900 hover:bg-navy-800 dark:bg-gold-600 dark:hover:bg-gold-500 dark:text-navy-900 font-bold"
                  onClick={() => window.location.href = '/contact'}
                >
                  Schedule Consultation
                </Button>
                <Button 
                  variant="outline" 
                  className="mt-3 w-full sm:w-auto sm:mt-0 dark:bg-transparent dark:text-gray-300 dark:border-gray-600 dark:hover:bg-navy-600"
                  onClick={() => setSelectedVisa(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  )
}

export default ResourcesPage
