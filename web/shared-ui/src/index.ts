// API client
export { 
  auth, 
  cases, 
  pricing, 
  appointments, 
  messages, 
  uploads, 
  invoices, 
  interview,
  professional,
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
export { RTLNumber } from './components/RTLNumber'

// Icons
export { Icon } from './Icon'
export * from './Icon'

// Theme
export { ThemeProvider, useTheme } from './ThemeProvider'

// Route Guard
export { RouteGuard } from './RouteGuard'

// React Query
export { QueryProvider, queryClient } from './query-provider'
export { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Hooks
export { useRTL } from './hooks/useRTL'

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

// I18n - removed singleton export, each app should create its own i18n instance