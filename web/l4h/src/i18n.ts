import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// L4H-specific resources
const resources = {
  en: {
    translation: {
      // App-specific
      'app.title': 'Law4Hire',
      'app.tagline': 'Your Immigration Legal Partner',
      
      // Dashboard
      'dashboard.title': 'Dashboard',
      'dashboard.welcome': 'Welcome back!',
      'dashboard.caseStatus': 'Case Status',
      'dashboard.quickLinks': 'Quick Links',
      'dashboard.interview': 'Start Interview',
      'dashboard.pricing': 'View Pricing',
      'dashboard.appointments': 'My Appointments',
      'dashboard.messages': 'Messages',
      'dashboard.uploads': 'Upload Documents',
      
      // Login
      'login.title': 'Sign In to Law4Hire',
      'login.subtitle': 'Access your immigration case portal',
      'login.invalidCredentials': 'Invalid email or password',
      'login.loginFailed': 'Login failed. Please try again.',
      
      // Case status
      'case.status.active': 'Active',
      'case.status.pending': 'Pending Review',
      'case.status.completed': 'Completed',
      'case.status.closed': 'Closed',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.retry': 'Retry',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous'
    }
  },
  es: {
    translation: {
      // App-specific
      'app.title': 'Law4Hire',
      'app.tagline': 'Su Socio Legal de Inmigración',
      
      // Dashboard
      'dashboard.title': 'Panel de Control',
      'dashboard.welcome': '¡Bienvenido de nuevo!',
      'dashboard.caseStatus': 'Estado del Caso',
      'dashboard.quickLinks': 'Enlaces Rápidos',
      'dashboard.interview': 'Iniciar Entrevista',
      'dashboard.pricing': 'Ver Precios',
      'dashboard.appointments': 'Mis Citas',
      'dashboard.messages': 'Mensajes',
      'dashboard.uploads': 'Subir Documentos',
      
      // Login
      'login.title': 'Iniciar Sesión en Law4Hire',
      'login.subtitle': 'Accede a tu portal de casos de inmigración',
      'login.invalidCredentials': 'Email o contraseña inválidos',
      'login.loginFailed': 'Error al iniciar sesión. Inténtalo de nuevo.',
      
      // Case status
      'case.status.active': 'Activo',
      'case.status.pending': 'Pendiente de Revisión',
      'case.status.completed': 'Completado',
      'case.status.closed': 'Cerrado',
      
      // Common
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.retry': 'Reintentar',
      'common.back': 'Atrás',
      'common.next': 'Siguiente',
      'common.previous': 'Anterior'
    }
  }
}

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
