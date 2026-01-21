import React, { useState } from 'react'
import { Card, Modal, Input, Button } from '@l4h/shared-ui'
import { useAttorneys } from '../../hooks/useAttorneys'
import PublicLayout from '../../components/PublicLayout'
import { Phone, Mail, AlertCircle, MessageSquare } from 'lucide-react'

const BioWithReadMore: React.FC<{ bio: string }> = ({ bio }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200; // Adjust length as needed

  if (bio.length <= maxLength) {
    return (
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed border-b border-gray-100 dark:border-navy-800 pb-6 font-light">
        {bio}
      </p>
    );
  }

  return (
    <div className="mb-6 border-b border-gray-100 dark:border-navy-800 pb-6 flex-grow">
      <div className={`text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-light ${isExpanded ? 'max-h-64 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
        {isExpanded ? bio : `${bio.substring(0, maxLength)}...`}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
        className="text-gold-600 dark:text-gold-500 text-xs font-bold uppercase tracking-wider mt-2 hover:underline focus:outline-none"
      >
        {isExpanded ? 'Show Less' : 'Read Full Bio'}
      </button>
    </div>
  );
};

const AttorneysPage: React.FC = () => {
  const { attorneys, isLoading, error } = useAttorneys()
  const [selectedAttorney, setSelectedAttorney] = useState<{ name: string } | null>(null)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Map attorney names to local image files
  // Only include attorneys who have actual photos on the original site
  const localPhotoMap: Record<string, string> = {
    'Denise S. Cann': '/images/attorneys/denise.jpg',
    'Angela Taylor': '/images/attorneys/angela.jpg',
    'Alex Shu': '/images/attorneys/alex.jpg',
    'Janice Lin': '/images/attorneys/janice.jpg',
    'Chika Okala': '/images/attorneys/chika.jpg'
    // John Charles, Wen Lee, and Katherine J. Wong don't have photos on original site
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAttorney) return

    setIsSending(true)
    setSendStatus('idle')

    try {
      const response = await fetch('/api/v1/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactForm,
          subject: `Inquiry for ${selectedAttorney.name}`
        })
      })

      if (response.ok) {
        setSendStatus('success')
        setTimeout(() => {
          setSelectedAttorney(null)
          setContactForm({ name: '', email: '', message: '' })
          setSendStatus('idle')
        }, 2000)
      } else {
        setSendStatus('error')
      }
    } catch (err) {
      setSendStatus('error')
    } finally {
      setIsSending(false)
    }
  }

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
          <div className="bg-red-50 dark:bg-red-950/20 p-8 rounded-lg max-w-2xl border border-red-100 dark:border-red-900">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-2">Unable to Load Team</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">We're having trouble retrieving our legal team information. This usually happens when the API is unavailable or returning an invalid response.</p>
            <div className="bg-white dark:bg-navy-900 p-3 rounded border border-red-200 dark:border-red-800 mb-6 text-left overflow-auto max-h-40">
              <code className="text-xs text-red-600 dark:text-red-400 break-all">{error}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-950 rounded font-bold hover:bg-navy-800 dark:hover:bg-gold-400 transition-colors uppercase tracking-wider text-sm"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-navy-900 dark:bg-navy-950 text-white py-20 relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-white">Our Legal Team</h1>
            <div className="w-24 h-1 bg-gold-500 mx-auto mb-8"></div>
            <p className="text-xl max-w-3xl mx-auto text-gray-300 font-light leading-relaxed">
              Experienced immigration professionals dedicated to providing comprehensive and compassionate representation since 2002.
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
                {attorneys.map((attorney) => {
                    const localPhoto = localPhotoMap[attorney.name];
                    const hasPhoto = (attorney.photoUrl && !attorney.photoUrl.includes('placeholder')) || localPhoto;
                    
                    return (
                    <div key={attorney.id} className="bg-white dark:bg-navy-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-gold-500 dark:border-navy-800 flex flex-col h-full group">
                    {/* Attorney Photo */}
                    <div className="pt-8 pb-4 text-center bg-gray-50 dark:bg-navy-800 transition-colors">
                        {hasPhoto ? (
                        <img 
                            src={attorney.photoUrl || localPhoto} 
                            alt={attorney.name}
                            className="w-40 h-40 rounded-full mx-auto object-cover shadow-md border-4 border-white dark:border-navy-700 grayscale group-hover:grayscale-0 transition-all duration-500"
                            onError={(e) => {
                                const target = e.currentTarget;
                                if (localPhoto && target.src !== window.location.origin + localPhoto) {
                                    target.src = localPhoto;
                                } else {
                                    target.onerror = null; 
                                    const initials = attorney.name.split(' ').map((n: string) => n[0]).join('');
                                    target.src = `https://ui-avatars.com/api/?name=${initials}&background=102a43&color=c5a059&size=256&font-size=0.35`;
                                }
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
                            <BioWithReadMore bio={attorney.bio} />
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
                                    {practiceAreas.map((area: string, index: number) => (
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

                        {/* Languages */}
                        {attorney.languages && (() => {
                            try {
                            const languages = typeof attorney.languages === 'string' ? JSON.parse(attorney.languages) : attorney.languages
                            if (!Array.isArray(languages) || languages.length === 0) return null

                            return (
                                <div className="mb-4">
                                <h4 className="font-bold text-navy-900 dark:text-white mb-3 text-[10px] uppercase tracking-widest">Languages</h4>
                                <div className="flex flex-wrap gap-2">
                                    {languages.map((language: string, index: number) => (
                                    <span
                                        key={index}
                                        className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase px-2 py-1 rounded-sm border border-blue-100 dark:border-blue-800 tracking-tight"
                                    >
                                        {language}
                                    </span>
                                    ))}
                                </div>
                                </div>
                            )
                            } catch {
                            return null
                            }
                        })()}

                        {/* Credentials */}
                        {attorney.credentials && (() => {
                            try {
                            const credentials = typeof attorney.credentials === 'string' ? JSON.parse(attorney.credentials) : attorney.credentials
                            if (!Array.isArray(credentials) || credentials.length === 0) return null

                            return (
                                <div className="mb-4">
                                <h4 className="font-bold text-navy-900 dark:text-white mb-3 text-[10px] uppercase tracking-widest">Credentials</h4>
                                <div className="flex flex-wrap gap-2">
                                    {credentials.map((credential: string, index: number) => (
                                    <span
                                        key={index}
                                        className="inline-block bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-400 text-[10px] font-bold uppercase px-2 py-1 rounded-sm border border-gold-200 dark:border-gold-800 tracking-tight"
                                    >
                                        {credential}
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
                                {/* Email hidden for security - replaced with contact button */}
                                <button
                                    onClick={() => setSelectedAttorney({ name: attorney.name })}
                                    className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-gold-600 dark:hover:text-gold-500 transition-colors tracking-wide w-full"
                                >
                                    <MessageSquare className="w-3.5 h-3.5 mr-3 text-gold-500" />
                                    Send Message
                                </button>

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
                );
                })}
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
              href="tel:(410) 988-0123"
              className="inline-flex items-center px-10 py-4 border border-white text-base font-medium rounded-sm text-white hover:bg-white hover:text-navy-900 transition-all"
            >
              Call Us
            </a>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      {selectedAttorney && (
        <Modal 
          open={!!selectedAttorney} 
          onClose={() => setSelectedAttorney(null)}
          title={`Contact ${selectedAttorney.name}`}
        >
          {sendStatus === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Thank you for contacting us. We will get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              {sendStatus === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                  Failed to send message. Please try again or call us directly.
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                <Input
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full Name"
                  className="dark:bg-navy-900 dark:border-navy-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Email</label>
                <Input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="dark:bg-navy-900 dark:border-navy-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-navy-700 rounded-md focus:ring-2 focus:ring-gold-500 dark:bg-navy-900 dark:text-white"
                  placeholder="How can we help you?"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setSelectedAttorney(null)}
                  disabled={isSending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  loading={isSending}
                  className="bg-gold-500 hover:bg-gold-600 text-navy-900"
                >
                  Send Message
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </PublicLayout>
  )
}

export default AttorneysPage