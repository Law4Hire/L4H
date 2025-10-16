// Core exports
export { default as i18n, CULTURE_NAMES, RTL_LANGUAGES, SUPPORTED_LANGUAGES, setRTLDirection, isRTL, i18nReady, getTextDirection, getTextAlign, formatNumber as formatNumberRTL, formatDate as formatDateRTL } from './i18n-config'
export type { Namespace } from './i18n-config'

// RTL Hooks
export { useRTL, useRTLClasses, useRTLStyles } from './hooks/useRTL'
export type { RTLUtils } from './hooks/useRTL'

// API client
export { 
  auth, 
  i18n as i18nApi, 
  cases, 
  pricing, 
  appointments, 
  messages, 
  uploads, 
  invoices, 
  interview,
  admin,
  fetchJson, 
  ApiError,
  setJwtToken,
  getJwtToken,
  clearTokens
} from './api-client'

// API types and client
export { apiClient, ApiClient } from './Api'
export type { Case, Appointment, Message, Upload, Pricing, ApiResponse } from './Api'
export { authClient, AuthClient } from './AuthClient'

// Component exports
export { Button } from './components/Button'
export { Input } from './components/Input'
export { SearchableSelect } from './components/SearchableSelect'
export type { SearchableSelectOption, SearchableSelectProps } from './components/SearchableSelect'
export { Modal } from './components/Modal'
export { Card } from './components/Card'
export { Layout } from './components/Layout'
export { Container } from './components/Container'
export { EmptyState } from './components/EmptyState'
export { Toast, ToastContainer, useToast } from './components/Toast'

// RTL Components
export { RTLNumber, RTLDate } from './components/RTLNumber'
export type { RTLNumberProps, RTLDateProps } from './components/RTLNumber'
export { RTLDemo } from './components/RTLDemo'

// Icons
export { Icon } from './Icon'
export * from './Icon'

// Theme
export { ThemeProvider, useTheme } from './ThemeProvider'

// i18n
export { LanguageSwitcher } from './LanguageSwitcher'
export { I18nProvider, useI18n, useT, useTranslation } from './i18n-provider'
export type { Culture } from './i18n-provider'

// Route Guard
export { RouteGuard } from './RouteGuard'

// React Query
export { QueryProvider, queryClient } from './query-provider'

// Formatters
export {
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  formatFileSize,
  formatPercentage,
  formatList,
} from './formatters'

// CSS - RTL styles should be imported by consuming apps
// import './styles/rtl.css'
