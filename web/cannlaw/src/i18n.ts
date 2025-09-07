import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Cannlaw-specific resources
const resources = {
  en: {
    translation: {
      // App-specific
      'app.title': 'Cannlaw Admin',
      'app.tagline': 'Staff & Admin Portal',
      
      // Login
      'login.title': 'Staff Login',
      'login.subtitle': 'Access the staff portal',
      'login.invalidCredentials': 'Invalid email or password',
      'login.loginFailed': 'Login failed. Please try again.',
      
      // Schedule
      'schedule.title': 'Schedule',
      'schedule.upcoming': 'Upcoming Appointments',
      'schedule.noAppointments': 'No upcoming appointments',
      'schedule.client': 'Client',
      'schedule.time': 'Time',
      'schedule.type': 'Type',
      'schedule.status': 'Status',
      
      // Cases
      'cases.title': 'Cases',
      'cases.assigned': 'Assigned Cases',
      'cases.caseNumber': 'Case #',
      'cases.client': 'Client',
      'cases.status': 'Status',
      'cases.lastActivity': 'Last Activity',
      'cases.actions': 'Actions',
      'cases.noCases': 'No assigned cases',
      
      // Admin
      'admin.title': 'Administration',
      'admin.pricing': 'Pricing Editor',
      'admin.workflows': 'Workflow Review',
      'admin.settings': 'Settings',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.view': 'View',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.save': 'Save',
      'common.cancel': 'Cancel'
    }
  },
  es: {
    translation: {
      // App-specific
      'app.title': 'Cannlaw Admin',
      'app.tagline': 'Portal de Personal y Administración',
      
      // Login
      'login.title': 'Inicio de Sesión del Personal',
      'login.subtitle': 'Accede al portal del personal',
      'login.invalidCredentials': 'Email o contraseña inválidos',
      'login.loginFailed': 'Error al iniciar sesión. Inténtalo de nuevo.',
      
      // Schedule
      'schedule.title': 'Horario',
      'schedule.upcoming': 'Citas Próximas',
      'schedule.noAppointments': 'No hay citas próximas',
      'schedule.client': 'Cliente',
      'schedule.time': 'Hora',
      'schedule.type': 'Tipo',
      'schedule.status': 'Estado',
      
      // Cases
      'cases.title': 'Casos',
      'cases.assigned': 'Casos Asignados',
      'cases.caseNumber': 'Caso #',
      'cases.client': 'Cliente',
      'cases.status': 'Estado',
      'cases.lastActivity': 'Última Actividad',
      'cases.actions': 'Acciones',
      'cases.noCases': 'No hay casos asignados',
      
      // Admin
      'admin.title': 'Administración',
      'admin.pricing': 'Editor de Precios',
      'admin.workflows': 'Revisión de Flujos',
      'admin.settings': 'Configuración',
      
      // Common
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.view': 'Ver',
      'common.edit': 'Editar',
      'common.delete': 'Eliminar',
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar'
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
