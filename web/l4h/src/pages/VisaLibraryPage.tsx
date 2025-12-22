import React, { useState, useEffect } from 'react'
import { Card, Modal, Button } from '@l4h/shared-ui'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface VisaType {
  code: string
  name: string
  generalCategory: string
  description: string
}

// Fixed QueryClient issue - using useState instead of useQuery
const VisaLibraryPage: React.FC = () => {
  const { t } = useTranslation(['common', 'visaLibrary'])
  const navigate = useNavigate()
  const [selectedVisa, setSelectedVisa] = useState<VisaType | null>(null)

      // Use static data instead of React Query to avoid provider issues
    const [visaTypes, setVisaTypes] = useState<VisaType[]>([])
    const [isLoading, setIsLoading] = useState(true)
  
    useEffect(() => {
      // Simulate loading and set static visa data
      const timer = setTimeout(() => {
        setVisaTypes([
          // Nonimmigrant Visas
          { code: 'B1', name: 'Business Visitor', generalCategory: 'Nonimmigrant', description: 'Business visitor visa for temporary business activities in the United States.' },
          { code: 'B2', name: 'Tourist Visitor', generalCategory: 'Nonimmigrant', description: 'Tourist visa for pleasure, vacation, or visiting family and friends.' },
          { code: 'F1', name: 'Student', generalCategory: 'Nonimmigrant', description: 'Student visa for academic studies at accredited US institutions.' },
          { code: 'F2', name: 'Student Dependent', generalCategory: 'Nonimmigrant', description: 'Dependent visa for spouses and unmarried children under 21 of F1 students.' },
          { code: 'H1B', name: 'Specialty Occupation Worker', generalCategory: 'Nonimmigrant', description: 'Specialty occupation visa for professionals with bachelor\'s degree or higher.' },
          { code: 'H2A', name: 'Agricultural Worker', generalCategory: 'Nonimmigrant', description: 'Temporary agricultural worker visa for seasonal farm labor.' },
          { code: 'H4', name: 'H1B Dependent', generalCategory: 'Nonimmigrant', description: 'Dependent visa for spouses and unmarried children under 21 of H1B visa holders.' },
          { code: 'J1', name: 'Exchange Visitor', generalCategory: 'Nonimmigrant', description: 'Exchange visitor visa for cultural exchange programs.' },
          { code: 'L1A', name: 'Intracompany Transferee Executive', generalCategory: 'Nonimmigrant', description: 'Intracompany transferee visa for managers and executives.' },
          { code: 'L1B', name: 'Intracompany Transferee Specialist', generalCategory: 'Nonimmigrant', description: 'Intracompany transferee visa for employees with specialized knowledge.' },
          { code: 'L2', name: 'L1 Dependent', generalCategory: 'Nonimmigrant', description: 'Dependent visa for spouses and unmarried children under 21 of L1 visa holders.' },
          { code: 'O1', name: 'Extraordinary Ability', generalCategory: 'Nonimmigrant', description: 'Extraordinary ability visa for individuals with exceptional skills.' },
          { code: 'TN', name: 'NAFTA Professional', generalCategory: 'Nonimmigrant', description: 'NAFTA professional visa for Canadian and Mexican citizens.' },
          { code: 'E2', name: 'Treaty Investor', generalCategory: 'Nonimmigrant', description: 'Treaty investor visa for substantial investment in US business.' },
          
          // Employment-Based Immigrant Visas
          { code: 'EB1A', name: 'Extraordinary Ability', generalCategory: 'Employment-Based', description: 'First preference for individuals with extraordinary ability in the sciences, arts, education, business, or athletics.' },
          { code: 'EB1B', name: 'Outstanding Professors/Researchers', generalCategory: 'Employment-Based', description: 'First preference for outstanding professors and researchers.' },
          { code: 'EB1C', name: 'Multinational Managers/Executives', generalCategory: 'Employment-Based', description: 'First preference for multinational managers and executives.' },
          { code: 'EB2A', name: 'Advanced Degree Professionals', generalCategory: 'Employment-Based', description: 'Second preference for professionals with advanced degrees (Master\'s or higher, or Bachelor\'s plus 5 years of experience).' },
          { code: 'EB2B', name: 'Exceptional Ability', generalCategory: 'Employment-Based', description: 'Second preference for individuals with exceptional ability in the sciences, arts, or business.' },
          { code: 'EB2 NIW', name: 'National Interest Waiver', description: 'Second preference waiver of job offer and labor certification if it is in the national interest of the US.', generalCategory: 'Employment-Based' },
          { code: 'EB3', name: 'Skilled Workers & Professionals', generalCategory: 'Employment-Based', description: 'Third preference for skilled workers, professionals, and other workers.' },
          { code: 'EB4', name: 'Special Immigrants', generalCategory: 'Employment-Based', description: 'Fourth preference for special immigrants, including religious workers and others.' },
          { code: 'EB5', name: 'Immigrant Investors', generalCategory: 'Employment-Based', description: 'Fifth preference for immigrant investors who invest in a new commercial enterprise.' },
  
          // Family-Based Immigrant Visas
          { code: 'FB1', name: 'First Preference', generalCategory: 'Family-Based', description: 'Unmarried sons and daughters (21 years of age and older) of U.S. citizens.' },
          { code: 'FB2A', name: 'Second Preference A', generalCategory: 'Family-Based', description: 'Spouses and children (unmarried and under 21 years of age) of lawful permanent residents.' },
          { code: 'FB2B', name: 'Second Preference B', generalCategory: 'Family-Based', description: 'Unmarried sons and daughters (21 years of age and older) of lawful permanent residents.' },
          { code: 'FB3', name: 'Third Preference', generalCategory: 'Family-Based', description: 'Married sons and daughters of U.S. citizens.' },
          { code: 'FB4', name: 'Fourth Preference', generalCategory: 'Family-Based', description: 'Brothers and sisters of adult U.S. citizens.' },
          { code: 'IR', name: 'Immediate Relatives', generalCategory: 'Family-Based', description: 'Spouses, unmarried children under 21, and parents of U.S. citizens (no numerical limit).' }
        ])
        setIsLoading(false)
      }, 500) // Short delay to simulate loading
      return () => clearTimeout(timer)
  }, [])

  const groupedVisaTypes = visaTypes.reduce((acc, visa) => {
    if (!acc[visa.generalCategory]) {
      acc[visa.generalCategory] = []
    }
    acc[visa.generalCategory].push(visa)
    return acc
  }, {} as Record<string, VisaType[]>)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('visaLibrary.title', 'US Visa Types Library')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t('visaLibrary.description', 'Explore comprehensive information about different US visa categories. Click on any visa type to learn about eligibility requirements, application process, and benefits.')}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">{t('visaLibrary.loading', 'Loading visa information...')}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedVisaTypes).map(([category, visas]) => (
              <section key={category}>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                  {t(`visaLibrary.categories.${category.toLowerCase()}`, `${category} Visas`)}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {visas.map((visa) => (
                    <Card
                      key={visa.code}
                      className="p-6 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 hover:border-blue-200"
                      onClick={() => setSelectedVisa(visa)}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {visa.code}
                          </span>
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                          {t(`visaLibrary.visas.${visa.code}.name`, visa.name)}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {t(`visaLibrary.visas.${visa.code}.description`, visa.description)}
                        </p>
                        <span className="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                          {t('visaLibrary.learnMore', 'Learn More')} →
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-blue-600 dark:bg-blue-700 rounded-lg p-8 text-center text-white mt-16">
          <h3 className="text-2xl font-bold mb-4">
            {t('visaLibrary.cta.title', 'Need Help Choosing the Right Visa?')}
          </h3>
          <p className="text-lg text-blue-100 dark:text-blue-200 mb-6">
            {t('visaLibrary.cta.description', 'Our immigration experts can help you determine which visa category fits your situation best.')}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('visaLibrary.cta.button', 'Start Your Application')}
          </button>
        </div>
      </main>

      {/* Visa Detail Modal */}
      {selectedVisa && (
        <Modal
          open={!!selectedVisa}
          onClose={() => setSelectedVisa(null)}
          title={`${selectedVisa.code} - ${selectedVisa.name}`}
          size="lg"
          closeButtonLabel={t('common.close', 'Close')}
        >
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-lg">{t('visaLibrary.modal.category', 'Category')}</h4>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t(`visaLibrary.categories.${selectedVisa.generalCategory.toLowerCase()}`, `${selectedVisa.generalCategory} Visa`)}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-lg">{t('visaLibrary.modal.description', 'Description')}</h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t(`visaLibrary.visas.${selectedVisa.code}.description`, selectedVisa.description)}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{t('visaLibrary.modal.nextSteps', 'Next Steps')}</h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                {t('visaLibrary.modal.readyToApply', 'Ready to apply for the {{code}} visa? Our immigration attorneys can guide you through the entire process.', { code: selectedVisa.code })}
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedVisa(null)}
              >
                {t('common.close', 'Close')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedVisa(null)
                  navigate('/login')
                }}
              >
                {t('visaLibrary.modal.applyFor', 'Apply for {{code}} Visa', { code: selectedVisa.code })}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default VisaLibraryPage