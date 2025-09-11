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
      
      // Navigation
      'nav.schedule': 'Schedule',
      'nav.cases': 'Cases',
      
      // Admin
      'admin.title': 'Administration',
      'admin.pricing': 'Pricing Editor',
      'admin.workflows': 'Workflow Review',
      'admin.timeEntries': 'Time Entries',
      'admin.reports': 'Reports',
      'admin.settings': 'Settings',
      'admin.addPricing': 'Add Pricing',
      'admin.visaType': 'Visa Type',
      'admin.packageType': 'Package Type',
      'admin.country': 'Country',
      'admin.price': 'Price',
      'admin.saveAllChanges': 'Save All Changes',
      'admin.pendingApprovals': 'Pending Approvals',
      'admin.totalHours': 'Total Hours',
      'admin.hours': 'hours',
      'admin.submitted': 'Submitted',
      'admin.totalEntries': 'Total Entries',
      'admin.approvedEntries': 'Approved Entries',
      'admin.pendingEntries': 'Pending Entries',
      'admin.noTimeEntries': 'No Time Entries',
      'admin.noTimeEntriesDescription': 'No time entries have been submitted yet.',
      'admin.noWorkflows': 'No Workflows',
      'admin.noWorkflowsDescription': 'No workflows are pending approval.',
      'admin.added': 'Added',
      'admin.removed': 'Removed',
      'admin.modified': 'Modified',
      'admin.changes': 'Changes',
      'admin.approve': 'Approve',
      'admin.reject': 'Reject',
      'admin.exportExcel': 'Export Excel',
      'admin.exportPdf': 'Export PDF',
      'admin.totalCases': 'Total Cases',
      'admin.totalRevenue': 'Total Revenue',
      'admin.activeUsers': 'Active Users',
      'admin.monthlyGrowth': 'Monthly Growth',
      'admin.revenueGrowth': 'Revenue Growth',
      'admin.topCases': 'Top Cases',
      'admin.noData': 'No data available',
      'admin.revenueByMonth': 'Revenue by Month',
      
      // Auth
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.remember': 'Remember me',
      'auth.login': 'Login',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.view': 'View',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.close': 'Close',
      'common.add': 'Add',
      'common.actions': 'Actions'
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
      
      // Navigation
      'nav.schedule': 'Horario',
      'nav.cases': 'Casos',
      
      // Admin
      'admin.title': 'Administración',
      'admin.pricing': 'Editor de Precios',
      'admin.workflows': 'Revisión de Flujos',
      'admin.timeEntries': 'Entradas de Tiempo',
      'admin.reports': 'Reportes',
      'admin.settings': 'Configuración',
      'admin.addPricing': 'Agregar Precio',
      'admin.visaType': 'Tipo de Visa',
      'admin.packageType': 'Tipo de Paquete',
      'admin.country': 'País',
      'admin.price': 'Precio',
      'admin.saveAllChanges': 'Guardar Todos los Cambios',
      'admin.pendingApprovals': 'Aprobaciones Pendientes',
      'admin.totalHours': 'Total de Horas',
      'admin.hours': 'horas',
      'admin.submitted': 'Enviado',
      'admin.totalEntries': 'Total de Entradas',
      'admin.approvedEntries': 'Entradas Aprobadas',
      'admin.pendingEntries': 'Entradas Pendientes',
      'admin.noTimeEntries': 'Sin Entradas de Tiempo',
      'admin.noTimeEntriesDescription': 'No se han enviado entradas de tiempo aún.',
      'admin.noWorkflows': 'Sin Flujos de Trabajo',
      'admin.noWorkflowsDescription': 'No hay flujos de trabajo pendientes de aprobación.',
      'admin.added': 'Agregado',
      'admin.removed': 'Eliminado',
      'admin.modified': 'Modificado',
      'admin.changes': 'Cambios',
      'admin.approve': 'Aprobar',
      'admin.reject': 'Rechazar',
      'admin.exportExcel': 'Exportar Excel',
      'admin.exportPdf': 'Exportar PDF',
      'admin.totalCases': 'Total de Casos',
      'admin.totalRevenue': 'Ingresos Totales',
      'admin.activeUsers': 'Usuarios Activos',
      'admin.monthlyGrowth': 'Crecimiento Mensual',
      'admin.revenueGrowth': 'Crecimiento de Ingresos',
      'admin.topCases': 'Casos Principales',
      'admin.noData': 'No hay datos disponibles',
      'admin.revenueByMonth': 'Ingresos por Mes',
      
      // Auth
      'auth.email': 'Correo Electrónico',
      'auth.password': 'Contraseña',
      'auth.remember': 'Recordarme',
      'auth.login': 'Iniciar Sesión',
      
      // Common
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.success': 'Éxito',
      'common.view': 'Ver',
      'common.edit': 'Editar',
      'common.delete': 'Eliminar',
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.close': 'Cerrar',
      'common.add': 'Agregar',
      'common.actions': 'Acciones'
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
