import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Minimal English-only i18n configuration for Cannlaw
const resources = {
  'en-US': {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      search: 'Search',
      contact: 'Contact',
      learnMore: 'Learn More',
      getStarted: 'Get Started',
    },
    nav: {
      home: 'Home',
      about: 'About',
      services: 'Services',
      contact: 'Contact',
      blog: 'Blog',
    },
  },
}

// Initialize i18next for Cannlaw
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en-US',
    fallbackLng: 'en-US',
    defaultNS: 'common',
    ns: ['common', 'nav'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    debug: false,
    returnEmptyString: false,
    returnNull: false,
    keySeparator: '.',
    nsSeparator: ':',
  })

export default i18n
