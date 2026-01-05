import React, { useState } from 'react'
import { Card, Button, Input } from '@l4h/shared-ui'
import { useSiteConfig } from '../../hooks/useSiteConfig'
import PublicLayout from '../../components/PublicLayout'

const ContactPage: React.FC = () => {
  const { siteConfig, isLoading } = useSiteConfig()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    consultationType: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/v1/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          consultationType: 'general'
        })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

  const locations = safeJsonParse(siteConfig?.locations, [])
  const socialMediaPlatforms = safeJsonParse(siteConfig?.socialMediaPlatforms, [])

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 dark:from-navy-900 dark:to-navy-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl max-w-3xl mx-auto text-blue-100 dark:text-gray-300">
              Ready to start your immigration journey? Get in touch for a consultation.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-16 bg-gray-50 dark:bg-navy-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card className="p-8 bg-white dark:bg-navy-800 border dark:border-navy-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact us</h2>
                
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-400">
                      Thank you for your message! We'll get back to you within 24 hours.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-400">
                      There was an error sending your message. Please try again or call us directly.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className="dark:bg-navy-900 dark:border-navy-600 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className="dark:bg-navy-900 dark:border-navy-600 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      className="dark:bg-navy-900 dark:border-navy-600 dark:text-white dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="consultationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Consultation Type
                    </label>
                    <select
                      id="consultationType"
                      name="consultationType"
                      value={formData.consultationType}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-navy-900 text-gray-900 dark:text-white"
                    >
                      <option value="general">General Consultation</option>
                      <option value="family">Family-Based Immigration</option>
                      <option value="employment">Employment & Investment</option>
                      <option value="waivers">Waivers & Criminal Issues</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief description of your case"
                      className="dark:bg-navy-900 dark:border-navy-600 dark:text-white dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please describe your immigration needs and any specific questions you have..."
                      className="w-full p-3 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-navy-900 text-gray-900 dark:text-white dark:placeholder-gray-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                    className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 dark:bg-gold-600 dark:hover:bg-gold-500 dark:text-navy-900 font-bold"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>

                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    * Required fields. We'll respond within 24 hours.
                  </p>
                </form>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Primary Contact */}
              <Card className="p-6 bg-white dark:bg-navy-800 border dark:border-navy-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-gold-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Phone</p>
                      <a href={`tel:${siteConfig?.corporatePhone || siteConfig?.primaryPhone || '(410) 988-0123'}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                        {siteConfig?.corporatePhone || siteConfig?.primaryPhone || '(410) 988-0123'}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-gold-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email</p>
                      <a href={`mailto:${siteConfig?.email || 'information@cannlaw.com'}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                        {siteConfig?.email || 'information@cannlaw.com'}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-gold-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Response Time</p>
                      <p className="text-gray-600 dark:text-gray-400">Within 24 hours</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Office Locations */}
              <Card className="p-6 bg-white dark:bg-navy-800 border dark:border-navy-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Office Locations</h3>
                <div className="space-y-4">
                  {locations.map((location: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-600 dark:border-gold-500 pl-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">{location.type}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{location.city}</p>
                      {location.address && <p className="text-gray-600 dark:text-gray-400">{location.address}</p>}
                      {location.zip && <p className="text-gray-600 dark:text-gray-400">{location.zip}</p>}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Social Media & Communication */}
              {socialMediaPlatforms.length > 0 && (
                <Card className="p-6 bg-white dark:bg-navy-800 border dark:border-navy-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Connect With Us</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {socialMediaPlatforms.map((platformStr: string, index: number) => {
                       const parts = platformStr.includes(':') ? platformStr.split(':') : [platformStr]
                       const rawName = parts[0].trim()
                       const value = parts.length > 1 ? parts.slice(1).join(':').trim() : ''
                       const normalizedName = rawName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
                       
                       let url = value || '#'
                       // Default URLs if only name is provided
                       if (url === '#') {
                          if (normalizedName === 'facebook') url = 'https://facebook.com/cannlegalgroup'
                          if (normalizedName === 'twitter') url = 'https://twitter.com/cannlegalgroup'
                          if (normalizedName === 'whatsapp') url = 'https://wa.me/14109880123'
                          if (normalizedName === 'skype') url = 'skype:information@cannlaw.com?chat'
                       }
                       
                       if (normalizedName === 'skype' && value && !value.startsWith('skype:')) {
                           url = `skype:${value}?chat`
                       }

                       return (
                        <a 
                          key={index} 
                          href={url}
                          target={url.startsWith('http') ? "_blank" : undefined}
                          rel={url.startsWith('http') ? "noopener noreferrer" : undefined}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-navy-900 hover:bg-blue-50 dark:hover:bg-navy-700 transition-colors border border-gray-100 dark:border-navy-600 group"
                        >
                          {/* Facebook */}
                          {normalizedName === 'facebook' && (
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                            </svg>
                          )}
                          
                          {/* Twitter */}
                          {normalizedName === 'twitter' && (
                             <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                               <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                             </svg>
                          )}

                          {/* WhatsApp */}
                          {normalizedName === 'whatsapp' && (
                             <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                               <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                             </svg>
                          )}

                          {/* LINE */}
                          {normalizedName === 'line' && (
                             <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                               <path d="M21.5 12a9 9 0 01-9 9c-1.39 0-2.7-.3-3.88-.83L4 21.5l2.25-4.25A9 9 0 1121.5 12z" />
                               <path d="M12 10a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1zm-4 0a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1zm8 0a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z" fill="white" />
                             </svg>
                          )}
                          
                          {/* Skype */}
                          {normalizedName === 'skype' && (
                             <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                               <path d="M23.09 16.92c-.4.82-1.07 1.53-1.92 1.95a6.04 6.04 0 01-2.09.58 11.97 11.97 0 01-7.08-1.07 11.89 11.89 0 01-4.72-4.72C5.9 11.33 5.56 8.87 6.27 6.53c.1-.33.02-.7-.22-.96L4.8 4.33c-.35-.35-.91-.38-1.28-.06C2.28 5.37 1.48 6.94 1.14 8.65c-.44 2.22-.05 4.54 1.11 6.55 1.57 2.7 4.09 4.75 7.15 5.76 2.05.67 4.25.61 6.29-.16 1.63-.61 3.08-1.63 4.19-2.94.27-.32.26-.81-.04-1.12l-1.3-1.31c-.3-.3-1.14-.14-1.45.19zM19 12h2a9 9 0 00-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z"/>
                             </svg>
                          )}

                          {/* Fallback */}
                          {!['facebook', 'twitter', 'whatsapp', 'line', 'skype'].includes(normalizedName) && (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          )}

                          <span className="font-medium text-gray-900 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-gold-400">
                             {rawName}
                          </span>
                        </a>
                       )
                    })}
                  </div>
                </Card>
              )}

              {/* Emergency Contact */}
              <Card className="p-6 bg-blue-50 dark:bg-navy-800 border-blue-200 dark:border-navy-700">
                <h3 className="text-xl font-semibold text-blue-900 dark:text-white mb-2">24/7 Support</h3>
                <p className="text-blue-800 dark:text-gray-300 mb-4">
                  We provide round-the-clock support for urgent immigration matters.
                </p>
                <a 
                  href={`tel:${siteConfig?.corporatePhone || siteConfig?.primaryPhone || '(410) 988-0123'}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-gold-600 text-white dark:text-navy-900 font-bold rounded-lg hover:bg-blue-700 dark:hover:bg-gold-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Now
                </a>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default ContactPage
