// Enhanced Translation Loading System
export { TranslationLoader, translationLoader } from './services/TranslationLoader'
export type { TranslationLoadOptions, LoadResult, TranslationCache } from './services/TranslationLoader'

export { useTranslationLoader } from './hooks/useTranslationLoader'
export type { UseTranslationLoaderOptions, TranslationLoaderState } from './hooks/useTranslationLoader'

// Enhanced Fallback System
export { TranslationErrorNotification } from './components/TranslationErrorNotification'
export type { TranslationErrorNotificationProps } from './components/TranslationErrorNotification'

export { useFallbackTranslation, withFallbackTranslation } from './hooks/useFallbackTranslation'
export type { FallbackTranslationOptions, FallbackTranslationState } from './hooks/useFallbackTranslation'

// Translation Validation and Monitoring
export { TranslationValidator, translationValidator } from './services/TranslationValidator'
export type { 
  ValidationResult, 
  ValidationError, 
  ValidationWarning, 
  CompletenessReport, 
  MissingKeysReport,
  TranslationData,
  ValidationOptions
} from './services/TranslationValidator'

export { TranslationMonitoringDashboard } from './components/TranslationMonitoringDashboard'

export { useTranslationValidation } from './hooks/useTranslationValidation'
export type { 
  UseTranslationValidationOptions, 
  TranslationValidationState 
} from './hooks/useTranslationValidation'

// Existing exports (for backward compatibility)
export { translationErrorHandler } from './translation-error-handler'
export type { 
  TranslationError, 
  TranslationLoadingState, 
  TranslationErrorHandlerOptions 
} from './translation-error-handler'

export { useTranslationErrorHandling } from './hooks/useTranslationErrorHandling'

// Re-export i18n configuration
export * from './i18n-config'