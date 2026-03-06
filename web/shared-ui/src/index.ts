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

// Theme
export { ThemeProvider, useTheme } from './ThemeProvider'

// Auth & Config
export { AuthProvider, useAuth } from './hooks/useAuth'
export type { User } from './hooks/useAuth'
export { useSiteConfig } from './hooks/useSiteConfig'
export type { SiteConfiguration } from './hooks/useSiteConfig'

// Route Guard
export { RouteGuard } from './RouteGuard'

// React Query
export { QueryProvider, queryClient } from './query-provider'
export { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Component exports
export { Button } from './components/Button'
export { Input } from './components/Input'
export { Spinner } from './components/Spinner'
export { SearchableSelect } from './components/SearchableSelect'
export type { SearchableSelectOption, SearchableSelectProps } from './components/SearchableSelect'
export { Modal } from './components/Modal'
export { Card } from './components/Card'
export { Layout } from './components/Layout'
export { VersionStamp } from './components/VersionStamp'
export { Container } from './components/Container'
export { EmptyState } from './components/EmptyState'
export { Toast, ToastContainer, useToast, ToastProvider } from './components/Toast'
export { TimeTracker } from './components/TimeTracker'
export { FastPathQuiz } from './components/FastPathQuiz'
export { NextSteps } from './components/NextSteps'

// Icons
export { Icon } from './Icon'
export * from './Icon'

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

// Pages
export { SettingsHub } from './pages/SettingsHub'
export { UnifiedDashboard } from './pages/UnifiedDashboard'
export { default as AdminWorkspace } from './pages/dashboards/AdminWorkspace'
export { default as ProfessionalWorkspace } from './pages/dashboards/ProfessionalWorkspace'

// I18n - removed singleton export, each app should create its own i18n instance
