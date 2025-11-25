import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Minimal English-only i18n configuration
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
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
      retry: 'Retry',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      required: 'Required',
      optional: 'Optional',
      all: 'All',
      none: 'None',
      select: 'Select',
      clear: 'Clear',
      upload: 'Upload',
      download: 'Download',
      getStarted: 'Get Started',
    },
    nav: {
      dashboard: 'Dashboard',
      pricing: 'Pricing',
      appointments: 'Appointments',
      messages: 'Messages',
      uploads: 'Uploads',
      invoices: 'Invoices',
      visaLibrary: 'Visa Library',
      interview: 'Interview',
      results: 'Results',
      admin: 'Admin',
      hello: 'Hello',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
    },
  },
}

// Initialize i18next for this app
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en-US',
    fallbackLng: 'en-US',
    defaultNS: 'common',
    ns: ['common', 'nav', 'auth'],
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
