// Core exports
export { default as i18n, loadSupportedCultures, setCulture, setRTLDirection, isRTL } from './i18n'
export type { Culture } from './i18n'

export { AuthClient, authClient } from './AuthClient'
export { ApiClient, apiClient } from './Api'
export type { 
  ApiResponse, 
  Case, 
  Appointment, 
  Message, 
  Upload, 
  Pricing 
} from './Api'

// Component exports
export { Button } from './components/Button'
export { Input } from './components/Input'
export { Modal } from './components/Modal'
export { Card } from './components/Card'
export { Layout } from './components/Layout'

// Icons
export { Icon } from './Icon'
export * from './Icon'

// Theme
export { ThemeProvider, useTheme } from './ThemeProvider'

// i18n
export { LanguageSwitcher } from './LanguageSwitcher'
export { RouteGuard } from './RouteGuard'

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

// CSS
import './index.css'
