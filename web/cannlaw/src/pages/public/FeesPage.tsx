import React from 'react'
import { Card } from '@l4h/shared-ui'
import { useServices } from '../../hooks/useServices'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import PublicLayout from '../../components/PublicLayout'

const FeesPage: React.FC = () => {
  const { serviceCategories, isLoading: servicesLoading } = useServices()
  const { siteConfig, isLoading: configLoading } = useSiteConfig()

  if (servicesLoading || configLoading) {
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
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 dark:from-navy-900 dark:to-navy-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Legal Fees & Pricing</h1>
            <p className="text-xl max-w-3xl mx-auto text-blue-100 dark:text-gray-300">
              Transparent, competitive pricing for comprehensive immigration legal services
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Philosophy */}
      <section className="py-16 bg-white dark:bg-navy-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Pricing Philosophy</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We believe in transparent, fair pricing that reflects the complexity and value of our legal services. 
              Every case is unique, and we provide personalized quotes based on your specific needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-6 text-center bg-white dark:bg-navy-800 border dark:border-navy-700">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Transparent Pricing</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No hidden fees or surprise charges. You'll know exactly what you're paying for.
              </p>
            </Card>

            <Card className="p-6 text-center bg-white dark:bg-navy-800 border dark:border-navy-700">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Competitive Rates</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Fair pricing that reflects our experience and the value we provide.
              </p>
            </Card>

            <Card className="p-6 text-center bg-white dark:bg-navy-800 border dark:border-navy-700">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Flexible Payment</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Payment plans and options available to make legal services accessible.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Categories Pricing */}
      <section className="py-16 bg-gray-50 dark:bg-navy-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Service Categories</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Pricing varies based on case complexity and specific requirements
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {serviceCategories.map((category) => (
              <Card key={category.id} className="p-6 bg-white dark:bg-navy-800 border dark:border-navy-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{category.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{category.description}</p>
                
                <div className="space-y-3 mb-6">
                  {category.services?.slice(0, 4).map((service) => (
                    <div key={service.id} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {service.name}
                    </div>
                  ))}
                </div>

                <div className="border-t dark:border-navy-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Starting from:</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-gold-500 mb-4">Contact for Quote</p>
                  <a 
                    href="/contact" 
                    className="block w-full text-center px-4 py-2 bg-blue-600 dark:bg-gold-600 text-white dark:text-navy-900 font-bold rounded-lg hover:bg-blue-700 dark:hover:bg-gold-500 transition-colors"
                  >
                    Get Quote
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation Information */}
      <section className="py-16 bg-white dark:bg-navy-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Free Initial Consultation</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                We offer a complimentary initial consultation to discuss your case, understand your needs, 
                and provide you with a clear understanding of the legal process and associated costs.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Case Assessment</h4>
                    <p className="text-gray-600 dark:text-gray-400">Comprehensive review of your immigration situation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Strategy Discussion</h4>
                    <p className="text-gray-600 dark:text-gray-400">Detailed explanation of available options and recommended approach</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Cost Estimate</h4>
                    <p className="text-gray-600 dark:text-gray-400">Transparent pricing based on your specific case requirements</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-gold-600 dark:hover:bg-gold-500 dark:text-navy-900"
                >
                  Schedule Free Consultation
                </a>
                <a 
                  href={`tel:${siteConfig?.primaryPhone || '(410) 988-0123'}`}
                  className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 dark:border-gold-500 text-base font-medium rounded-md text-blue-600 dark:text-gold-500 bg-white dark:bg-transparent hover:bg-blue-50 dark:hover:bg-navy-800"
                >
                  Call {siteConfig?.primaryPhone || '(410) 988-0123'}
                </a>
              </div>
            </div>

            <Card className="p-8 bg-blue-50 dark:bg-navy-800 border-blue-200 dark:border-navy-700">
              <h3 className="text-2xl font-semibold text-blue-900 dark:text-white mb-4">What's Included</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-gold-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 dark:text-gray-300">Complete case preparation and filing</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-gold-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 dark:text-gray-300">Document review and preparation</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-gold-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 dark:text-gray-300">Regular case status updates</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-gold-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 dark:text-gray-300">Direct attorney communication</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-gold-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 dark:text-gray-300">24/7 support for urgent matters</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-16 bg-gray-50 dark:bg-navy-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Payment Options</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              We offer flexible payment arrangements to make legal services accessible
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center bg-white dark:bg-navy-800 border dark:border-navy-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Flat Fees</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Predictable pricing for standard cases</p>
            </Card>

            <Card className="p-6 text-center bg-white dark:bg-navy-800 border dark:border-navy-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Payment Plans</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Spread costs over manageable installments</p>
            </Card>

            <Card className="p-6 text-center bg-white dark:bg-navy-800 border dark:border-navy-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Multiple Methods</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cash, check, credit card, wire transfer</p>
            </Card>

            <Card className="p-6 text-center bg-white dark:bg-navy-800 border dark:border-navy-700">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">All payments processed securely</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-gray-100 dark:bg-navy-900 border-t dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Important:</strong> Government filing fees are separate from attorney fees and vary by case type. 
              All quotes are estimates based on standard cases and may vary depending on complexity. 
              Final fees will be confirmed during your consultation.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default FeesPage
