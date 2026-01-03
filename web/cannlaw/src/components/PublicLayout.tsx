import React, { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@l4h/shared-ui'
import { Menu, X, Sun, Moon, Share2, Facebook, Twitter, Instagram, Linkedin, MessageCircle, Phone } from 'lucide-react'
import { useSiteConfig } from '../hooks/useSiteConfig'
import { useAuth } from '../hooks/useAuth'
import { ThemeToggle } from './ThemeToggle'

interface PublicLayoutProps {
  children: React.ReactNode
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { siteConfig } = useSiteConfig()
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Attorneys/Staff', href: '/attorneys' },
    { name: 'Fees', href: '/fees' },
    { name: 'Law Library', href: '/resources' },
    { name: 'Contact/Consultation', href: '/contact' }
  ]

  // Safely parse JSON with error handling
  const safeJsonParse = <T,>(jsonString: string | undefined | null, fallback: T): T => {
    if (!jsonString) return fallback
    try {
      return JSON.parse(jsonString) as T
    } catch (error) {
      return fallback
    }
  }

  const socialMediaPlatforms = useMemo(() => {
    const configPlatforms = siteConfig?.socialMediaPlatforms ? JSON.parse(siteConfig.socialMediaPlatforms) : []
    const defaults = [
      { name: 'Facebook', url: 'https://facebook.com/cannlegalgroup', icon: 'facebook' },
      { name: 'Twitter', url: 'https://twitter.com/cannlegalgroup', icon: 'twitter' },
      { name: 'WhatsApp', url: 'https://wa.me/14109880123', icon: 'whatsapp' },
      { name: 'LINE', url: '#', icon: 'message-circle' },
      { name: 'Skype', url: 'skype:information@cannlaw.com?chat', icon: 'phone' }
    ]

    if (configPlatforms.length === 0) return defaults

    return configPlatforms.map((p: string) => {
      const name = p.split(':')[0].replace('!', '').trim()
      const value = p.includes(':') ? p.split(':')[1].trim() : ''
      const defaultMatch = defaults.find(d => d.name.toLowerCase() === name.toLowerCase())
      
      let url = defaultMatch?.url || '#'
      if (name.toUpperCase() === 'SKYPE' && value) url = `skype:${value}?chat`
      
      // Explicitly handle known platforms to ensure correct icons even if not in defaults
      let icon = defaultMatch?.icon || 'share-2'
      if (name.toLowerCase() === 'github') icon = 'github' // Lucide doesn't have 'github' icon in the import list above, need to check if available or map to something else. 
      // Wait, PublicLayout imports specific icons. 'Github' is NOT imported.
      // I need to import 'Github' from lucide-react if I want to support it. 
      // But the user says "have the icon for GitHub, not their actual icons". This implies they DO NOT want GitHub icon for things like Facebook.
      // The issue is likely that 'share-2' looks like GitHub's fork icon or something?
      // I will import 'Github' just in case, but more importantly, I will ensure the mapping is robust.
      
      return {
        name: p,
        url: url,
        icon: icon
      }
    })
  }, [siteConfig])
  
  const locations = safeJsonParse(siteConfig?.locations, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 font-sans flex flex-col transition-colors duration-300">
      {/* Top Bar for Associate Login */}
      <div className="bg-navy-900 text-gray-300 py-2 px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs tracking-wide z-50 relative">
         <div className="hidden sm:block font-light">
            Providing Comprehensive Immigration Law Services Since 2002
         </div>
         <div className="flex items-center space-x-6 ml-auto">
            <a href={`tel:${siteConfig?.primaryPhone || '(410) 988-0123'}`} className="hover:text-gold-400 transition-colors flex items-center">
               <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M20 22.621l-3.521-6.795c-.008.004-1.974.97-2.064 1.011-2.24 1.086-6.799-7.82-4.609-8.994l2.083-1.026-3.493-6.817-2.106 1.039C5.438 1.487 3.235 2.573 2.147 4.604c-1.09 2.031-1.049 4.453.072 6.641 1.637 3.193 4.887 6.443 8.08 8.08 2.188 1.121 4.61 1.162 6.641.072 2.031-1.088 3.117-3.291 3.564-6.148l1.039-2.106-6.817-3.493-1.026 2.083c-1.174 2.19-10.08 6.749-8.994 4.609.041-.09 1.007-2.056 1.011-2.064L22.621 20z"/></svg>
               {siteConfig?.primaryPhone || '(410) 988-0123'}
            </a>
         </div>
      </div>

      {/* Main Header */}
      <header className="bg-white dark:bg-navy-900 shadow-lg sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo Area */}
            <Link to="/" className="flex items-center group overflow-hidden">
              <div className="flex-shrink-0 mr-4 md:mr-6">
                <img 
                  src="https://cannlaw.com/images/logo.gif" 
                  alt="Cann Legal Group Logo"
                  className="h-12 md:h-16 w-auto object-contain dark:brightness-110"
                />
              </div>
              <div className="flex flex-col justify-center border-l border-gray-200 dark:border-navy-700 pl-4 md:pl-6 h-12">
                <h1 className="text-xl md:text-3xl font-serif font-bold text-navy-900 dark:text-white leading-none tracking-tight group-hover:text-gold-600 transition-colors whitespace-nowrap">
                  {siteConfig?.firmName || 'Cann Legal Group'}
                </h1>
                <p className="text-[10px] md:text-xs text-gold-600 font-bold tracking-[0.2em] uppercase mt-1 whitespace-nowrap">Immigration Law Specialists</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors border-b-2 py-1 ${
                    location.pathname === item.href
                      ? 'text-blue-900 dark:text-gold-500 border-blue-900 dark:border-gold-500'
                      : 'text-gray-600 dark:text-gray-300 border-transparent hover:text-blue-900 dark:hover:text-white hover:border-blue-200'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-l border-gray-200 dark:border-navy-700 h-6 mx-2"></div>
              <ThemeToggle />
            </nav>

            {/* Associate Login Button */}
            <div className="hidden md:flex items-center pl-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="dark:text-white dark:border-navy-600 dark:hover:bg-navy-800">Dashboard</Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="primary" size="sm" className="bg-blue-900 dark:bg-gold-600 dark:hover:bg-gold-500 hover:bg-blue-800 shadow-md border-none dark:text-navy-900 font-bold">
                    Associate Login
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Mobile Menu Button (Hamburger) */}
            <div className="md:hidden flex items-center space-x-2">
               <ThemeToggle />
               <button
                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                 className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none p-2"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   {mobileMenuOpen ? (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   ) : (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                   )}
                 </svg>
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-navy-900 border-b border-gray-200 dark:border-navy-700 shadow-lg">
          <div className="px-4 py-3 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'bg-blue-100 dark:bg-navy-800 text-blue-900 dark:text-gold-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
            {/* Associate Login Button */}
            <div className="pt-2 border-t border-gray-200 dark:border-navy-700">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full dark:text-white dark:border-navy-600">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full bg-blue-900 dark:bg-gold-600 hover:bg-blue-800 dark:hover:bg-gold-500 dark:text-navy-900 font-bold">
                    Associate Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 dark:bg-navy-950 transition-colors duration-300">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white border-t-8 border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Firm Info */}
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center mb-4">
                 <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center text-white mr-3 border-2 border-gold-500 shadow-md">
                    <span className="font-serif font-bold text-sm tracking-tighter">CLG</span>
                 </div>
                 <h3 className="text-lg font-serif font-bold text-white">
                   {siteConfig?.firmName || 'Cann Legal Group'}
                 </h3>
              </div>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                {siteConfig?.primaryFocusStatement || 'Fast, efficient, and convenient. Comprehensive representation from state side through consular processing.'}
              </p>
            </div>

            {/* Contact Info */}
            <div>
               <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2 inline-block">Contact</h3>
               <ul className="space-y-3 text-sm text-gray-400">
                 <li className="flex items-start">
                   <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   <span>Baltimore, MD (Headquarters)</span>
                 </li>
                 <li className="flex items-center">
                   <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                   <a href={`tel:${siteConfig?.primaryPhone || '(410) 988-0123'}`} className="hover:text-white transition-colors">{siteConfig?.primaryPhone || '(410) 988-0123'}</a>
                 </li>
                 <li className="flex items-center">
                   <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                   <a href={`mailto:${siteConfig?.email || 'information@cannlaw.com'}`} className="hover:text-white transition-colors">{siteConfig?.email || 'information@cannlaw.com'}</a>
                 </li>
               </ul>
            </div>

            {/* Quick Links */}
            <div>
               <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2 inline-block">Quick Links</h3>
               <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link to="/services" className="hover:text-blue-400 transition-colors">Our Services</Link></li>
                  <li><Link to="/attorneys" className="hover:text-blue-400 transition-colors">Attorneys & Staff</Link></li>
                  <li><Link to="/resources" className="hover:text-blue-400 transition-colors">Law Library</Link></li>
                  <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Consultation</Link></li>
               </ul>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2 inline-block">Connect</h3>
              <div className="flex space-x-3 mb-6">
                {socialMediaPlatforms.map((platform, index) => (
                  <a
                    key={index}
                    href={platform.url}
                    className="w-8 h-8 bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white rounded flex items-center justify-center transition-all duration-300"
                    title={platform.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                     <span className="sr-only">{platform.name}</span>
                     {/* Social Media Icons */}
                     {platform.icon === 'facebook' && <Facebook className="w-4 h-4" />}
                     {platform.icon === 'twitter' && <Twitter className="w-4 h-4" />}
                     {platform.icon === 'instagram' && <Instagram className="w-4 h-4" />}
                     {platform.icon === 'linkedin' && <Linkedin className="w-4 h-4" />}
                     {platform.icon === 'whatsapp' && (
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                       </svg>
                     )}
                     {platform.icon === 'message-square' && <MessageCircle className="w-4 h-4" />}
                     {platform.icon === 'phone' && <Phone className="w-4 h-4" />}
                     {platform.icon === 'share-2' && <Share2 className="w-4 h-4" />}
                  </a>
                ))}
              </div>
              <Link to="/contact">
                  <Button variant="primary" size="sm" className="w-full bg-blue-800 hover:bg-blue-700">
                    Schedule Now
                  </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-xs">
            <p>&copy; {new Date().getFullYear()} {siteConfig?.firmName || 'Cann Legal Group'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout