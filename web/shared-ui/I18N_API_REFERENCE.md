# i18n System API Reference

Complete API reference for the L4H platform's internationalization system.

## Table of Contents

1. [Core Hooks](#core-hooks)
2. [Services](#services)
3. [Components](#components)
4. [Providers](#providers)
5. [Utilities](#utilities)
6. [Types and Interfaces](#types-and-interfaces)
7. [Configuration](#configuration)

## Core Hooks

### useTranslation

Standard react-i18next hook with enhanced error handling.

```typescript
import { useTranslation } from 'react-i18next'

const { t, i18n, ready } = useTranslation(namespace?, options?)
```

**Parameters:**
- `namespace` (string | string[], optional): Translation namespace(s)
- `options` (UseTranslationOptions, optional): Hook options

**Returns:**
- `t`: Translation function
- `i18n`: i18next instance
- `ready`: Boolean indicating if translations are loaded

**Example:**
```typescript
function MyComponent() {
  const { t, i18n, ready } = useTranslation(['common', 'forms'])
  
  if (!ready) return <div>Loading...</div>
  
  return (
    <div>
      <h1>{t('common.welcome', 'Welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('es-ES')}>
        {t('common.switchLanguage', 'Switch Language')}
      </button>
    </div>
  )
}
```

### useFallbackTranslation

Enhanced translation hook with guaranteed string return and fallback handling.

```typescript
import { useFallbackTranslation } from '@shared-ui/hooks/useFallbackTranslation'

const {
  safeT,
  isUsingFallback,
  fallbackState,
  getMultipleTranslations
} = useFallbackTranslation(options?)
```

**Parameters:**
- `options` (UseFallbackTranslationOptions, optional): Configuration options

**Returns:**
- `safeT`: Safe translation function that always returns a string
- `isUsingFallback`: Boolean indicating if fallback is active
- `fallbackState`: Current fallback state information
- `getMultipleTranslations`: Function to get multiple translations safely

**Example:**
```typescript
function CriticalComponent() {
  const { safeT, isUsingFallback } = useFallbackTranslation({
    fallbackLanguage: 'en-US',
    enableGracefulDegradation: true
  })
  
  return (
    <div>
      {isUsingFallback && <div className="fallback-notice">Using fallback</div>}
      <h1>{safeT('common.title', 'Default Title')}</h1>
    </div>
  )
}
```

### useTranslationLoader

Hook for dynamic translation loading with progress tracking.

```typescript
import { useTranslationLoader } from '@shared-ui/hooks/useTranslationLoader'

const {
  isLoading,
  hasError,
  loadedNamespaces,
  failedNamespaces,
  loadTranslations,
  retryFailedNamespaces,
  loadProgress
} = useTranslationLoader(options)
```

**Parameters:**
- `options` (UseTranslationLoaderOptions): Loader configuration

**Returns:**
- `isLoading`: Boolean indicating loading state
- `hasError`: Boolean indicating error state
- `loadedNamespaces`: Array of successfully loaded namespaces
- `failedNamespaces`: Array of failed namespaces
- `loadTranslations`: Function to trigger loading
- `retryFailedNamespaces`: Function to retry failed loads
- `loadProgress`: Number (0-1) indicating loading progress

**Example:**
```typescript
function DynamicContent() {
  const {
    isLoading,
    hasError,
    loadTranslations,
    retryFailedNamespaces,
    loadProgress
  } = useTranslationLoader({
    language: 'es-ES',
    namespaces: ['dynamic-content'],
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    preloadCritical: true
  })
  
  if (isLoading) {
    return <div>Loading: {Math.round(loadProgress * 100)}%</div>
  }
  
  if (hasError) {
    return <button onClick={retryFailedNamespaces}>Retry</button>
  }
  
  return <div>Content loaded</div>
}
```

### useTranslationErrorHandling

Hook for handling translation errors and fallback states.

```typescript
import { useTranslationErrorHandling } from '@shared-ui/hooks/useTranslationErrorHandling'

const {
  hasErrors,
  isFallbackActive,
  retry,
  showNotification,
  dismissNotification,
  errorDetails
} = useTranslationErrorHandling(language, namespace, options?)
```

**Parameters:**
- `language` (string): Target language code
- `namespace` (string): Translation namespace
- `options` (UseTranslationErrorHandlingOptions, optional): Configuration options

**Returns:**
- `hasErrors`: Boolean indicating error state
- `isFallbackActive`: Boolean indicating fallback state
- `retry`: Function to retry failed translations
- `showNotification`: Boolean indicating notification visibility
- `dismissNotification`: Function to dismiss notifications
- `errorDetails`: Detailed error information

**Example:**
```typescript
function ErrorAwareComponent() {
  const {
    hasErrors,
    isFallbackActive,
    retry,
    showNotification,
    dismissNotification
  } = useTranslationErrorHandling('es-ES', 'interview')
  
  return (
    <div>
      {showNotification && (
        <div className="error-notification">
          <p>Translation error occurred</p>
          <button onClick={retry}>Retry</button>
          <button onClick={dismissNotification}>Dismiss</button>
        </div>
      )}
      <YourContent />
    </div>
  )
}
```

### useRTL

Hook for RTL language detection and layout management.

```typescript
import { useRTL } from '@shared-ui/hooks/useRTL'

const {
  isRTL,
  direction,
  language,
  setDirection
} = useRTL()
```

**Returns:**
- `isRTL`: Boolean indicating RTL language
- `direction`: String ('ltr' | 'rtl')
- `language`: Current language code
- `setDirection`: Function to manually set direction

**Example:**
```typescript
function RTLAwareComponent() {
  const { isRTL, direction } = useRTL()
  
  return (
    <div 
      dir={direction} 
      className={`layout ${isRTL ? 'rtl-layout' : 'ltr-layout'}`}
    >
      <p>Content with proper direction</p>
    </div>
  )
}
```

### useTranslationValidation

Hook for validating translation completeness and quality.

```typescript
import { useTranslationValidation } from '@shared-ui/hooks/useTranslationValidation'

const {
  isValidating,
  validationResults,
  completenessReports,
  hasErrors,
  hasWarnings,
  validateTranslations,
  validateLanguage,
  validationSummary
} = useTranslationValidation(options)
```

**Parameters:**
- `options` (UseTranslationValidationOptions): Validation configuration

**Returns:**
- `isValidating`: Boolean indicating validation state
- `validationResults`: Validation results by language
- `completenessReports`: Completeness reports
- `hasErrors`: Boolean indicating validation errors
- `hasWarnings`: Boolean indicating validation warnings
- `validateTranslations`: Function to validate all translations
- `validateLanguage`: Function to validate specific language
- `validationSummary`: Overall validation summary

## Services

### TranslationLoader

Service for loading translations with retry logic and caching.

```typescript
import { translationLoader } from '@shared-ui/services/TranslationLoader'

// Load single translation
const result = await translationLoader.loadTranslation(options)

// Preload namespaces
const results = await translationLoader.preloadNamespaces(language, namespaces, loadPath)

// Load multiple translations
const results = await translationLoader.loadMultipleTranslations(requests, priorityNamespaces?)
```

**Methods:**

#### loadTranslation(options)
```typescript
interface LoadTranslationOptions {
  language: string
  namespace: string
  loadPath: string
  cache?: boolean
  maxRetries?: number
  retryDelay?: number
  timeout?: number
}

interface LoadTranslationResult {
  success: boolean
  data?: any
  error?: Error
  fromCache?: boolean
  loadTime?: number
}
```

#### preloadNamespaces(language, namespaces, loadPath)
```typescript
const results = await translationLoader.preloadNamespaces(
  'es-ES',
  ['common', 'errors'],
  '/locales/{{lng}}/{{ns}}.json'
)
```

#### loadMultipleTranslations(requests, priorityNamespaces?)
```typescript
const requests = [
  { language: 'es-ES', namespace: 'common', loadPath: '/locales/{{lng}}/{{ns}}.json' },
  { language: 'es-ES', namespace: 'forms', loadPath: '/locales/{{lng}}/{{ns}}.json' }
]

const results = await translationLoader.loadMultipleTranslations(
  requests,
  ['common'] // Priority namespaces load first
)
```

### TranslationValidator

Service for validating translation completeness and quality.

```typescript
import { translationValidator } from '@shared-ui/services/TranslationValidator'

// Validate completeness
const result = translationValidator.validateCompleteness(translations, reference, language)

// Validate interpolation
const isValid = translationValidator.validateInterpolation(key, params)

// Generate reports
const report = translationValidator.generateCompletenessReport(translations, reference, language)
```

**Methods:**

#### validateCompleteness(translations, reference, language)
```typescript
interface ValidationResult {
  isValid: boolean
  completeness: number
  missingKeys: string[]
  emptyValues: string[]
  errors: ValidationError[]
  warnings: ValidationWarning[]
}
```

#### validateInterpolation(key, params)
```typescript
const isValid = translationValidator.validateInterpolation(
  'welcome.user',
  { name: 'John' }
)
```

#### generateCompletenessReport(translations, reference, language)
```typescript
interface CompletenessReport {
  language: string
  totalKeys: number
  translatedKeys: number
  missingKeys: string[]
  emptyKeys: string[]
  completeness: number
  lastUpdated: Date
}
```

### TranslationCacheManager

Service for managing translation caching.

```typescript
import { TranslationCacheManager } from '@shared-ui/services/TranslationCacheManager'

const cacheManager = new TranslationCacheManager(options?)

// Cache operations
cacheManager.set(key, value, ttl?)
const value = cacheManager.get(key)
cacheManager.delete(key)
cacheManager.clear()

// Statistics
const stats = cacheManager.getCacheStats()
```

**Constructor Options:**
```typescript
interface CacheManagerOptions {
  maxSize?: number        // Maximum cache size in MB
  ttl?: number           // Time to live in milliseconds
  cleanupInterval?: number // Cleanup interval in milliseconds
  enableAutoCleanup?: boolean
  maxMemoryUsage?: number // Maximum memory usage in MB
}
```

**Methods:**

#### getCacheStats()
```typescript
interface CacheStats {
  size: number           // Current cache size
  hitRate: number        // Cache hit rate percentage
  memoryUsage: number    // Memory usage in MB
  totalRequests: number  // Total cache requests
  hits: number          // Cache hits
  misses: number        // Cache misses
}
```

### TranslationPerformanceMonitor

Service for monitoring translation performance.

```typescript
import { TranslationPerformanceMonitor } from '@shared-ui/services/TranslationPerformanceMonitor'

const monitor = new TranslationPerformanceMonitor()

// Start monitoring
monitor.startMonitoring()

// Record metrics
monitor.recordLoadTime(language, namespace, loadTime)
monitor.recordCacheHit(language, namespace)
monitor.recordError(language, namespace, error)

// Get metrics
const metrics = monitor.getMetrics()
const report = monitor.generatePerformanceReport()
```

## Components

### TranslationErrorNotification

Component for displaying translation error notifications.

```typescript
import { TranslationErrorNotification } from '@shared-ui/components/TranslationErrorNotification'

<TranslationErrorNotification
  language={string}
  namespaces={string[]}
  autoRetry={boolean}
  maxAutoRetries={number}
  showFallbackOptions={boolean}
  position="top-right" | "top-left" | "bottom-right" | "bottom-left"
  onRetry={(lang, namespaces) => Promise<void>}
  onLanguageSwitch={(newLang) => void}
  onDismiss={() => void}
/>
```

**Props:**
- `language`: Current language code
- `namespaces`: Array of namespaces to monitor
- `autoRetry`: Enable automatic retry
- `maxAutoRetries`: Maximum automatic retry attempts
- `showFallbackOptions`: Show language switching options
- `position`: Notification position
- `onRetry`: Callback for retry action
- `onLanguageSwitch`: Callback for language switching
- `onDismiss`: Callback for dismissing notification

### TranslationMonitoringDashboard

Administrative dashboard for monitoring translation health.

```typescript
import { TranslationMonitoringDashboard } from '@shared-ui/components/TranslationMonitoringDashboard'

<TranslationMonitoringDashboard
  languages={string[]}
  namespaces={string[]}
  refreshInterval={number}
  showDetailedErrors={boolean}
  onLanguageSelect={(language) => void}
  onNamespaceSelect={(namespace) => void}
  onErrorSelect={(error) => void}
/>
```

**Props:**
- `languages`: Array of languages to monitor
- `namespaces`: Array of namespaces to monitor
- `refreshInterval`: Auto-refresh interval in milliseconds
- `showDetailedErrors`: Show detailed error information
- `onLanguageSelect`: Callback for language selection
- `onNamespaceSelect`: Callback for namespace selection
- `onErrorSelect`: Callback for error selection

### AccessibleContent

Wrapper component for accessible multilingual content.

```typescript
import { AccessibleContent } from '@shared-ui/components/AccessibleContent'

<AccessibleContent
  language={string}
  namespace={string}
  announceChanges={boolean}
  role={string}
  ariaLabel={string}
>
  {children}
</AccessibleContent>
```

**Props:**
- `language`: Content language
- `namespace`: Translation namespace
- `announceChanges`: Announce language changes to screen readers
- `role`: ARIA role
- `ariaLabel`: ARIA label
- `children`: Child components

## Providers

### L4HI18nProvider

i18n provider for L4H application.

```typescript
import { L4HI18nProvider } from '@shared-ui/providers/L4HI18nProvider'

<L4HI18nProvider
  additionalNamespaces={string[]}
  preloadNamespaces={string[]}
  fallbackLanguage={string}
  enableErrorHandling={boolean}
>
  {children}
</L4HI18nProvider>
```

**Props:**
- `additionalNamespaces`: Additional namespaces to load
- `preloadNamespaces`: Namespaces to preload
- `fallbackLanguage`: Fallback language code
- `enableErrorHandling`: Enable error handling
- `children`: Child components

### CannlawI18nProvider

i18n provider for Cannlaw application.

```typescript
import { CannlawI18nProvider } from '@shared-ui/providers/CannlawI18nProvider'

<CannlawI18nProvider
  additionalNamespaces={string[]}
  preloadNamespaces={string[]}
  fallbackLanguage={string}
  enableErrorHandling={boolean}
>
  {children}
</CannlawI18nProvider>
```

**Props:**
- `additionalNamespaces`: Additional namespaces to load
- `preloadNamespaces`: Namespaces to preload
- `fallbackLanguage`: Fallback language code
- `enableErrorHandling`: Enable error handling
- `children`: Child components

## Utilities

### Translation Utilities

```typescript
import {
  formatTranslationKey,
  extractTranslationKeys,
  validateTranslationStructure,
  mergeTranslations
} from '@shared-ui/utils/translation-utils'

// Format translation key
const key = formatTranslationKey('common', 'welcome', 'user')
// Result: 'common.welcome.user'

// Extract keys from translation object
const keys = extractTranslationKeys(translations)

// Validate translation structure
const isValid = validateTranslationStructure(translations)

// Merge translation objects
const merged = mergeTranslations(baseTranslations, overrideTranslations)
```

### RTL Utilities

```typescript
import {
  isRTLLanguage,
  getRTLDirection,
  formatRTLText,
  formatRTLNumber
} from '@shared-ui/utils/rtl-utils'

// Check if language is RTL
const isRTL = isRTLLanguage('ar-SA') // true

// Get text direction
const direction = getRTLDirection('ar-SA') // 'rtl'

// Format text for RTL
const formattedText = formatRTLText(text, 'ar-SA')

// Format numbers for RTL
const formattedNumber = formatRTLNumber(1234.56, 'ar-SA')
```

### Performance Utilities

```typescript
import {
  measureTranslationLoadTime,
  optimizeTranslationBundle,
  compressTranslations
} from '@shared-ui/utils/performance-utils'

// Measure load time
const loadTime = await measureTranslationLoadTime(async () => {
  return await loadTranslation('es-ES', 'common')
})

// Optimize bundle
const optimized = optimizeTranslationBundle(translations)

// Compress translations
const compressed = compressTranslations(translations)
```

## Types and Interfaces

### Core Types

```typescript
// Language and namespace types
type LanguageCode = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ar-SA' | 'ur-PK' | 'zh-CN' | 'hi-IN' | 'ja-JP' | 'ko-KR' | 'ru-RU' | 'pt-BR' | 'it-IT' | 'pl-PL' | 'id-ID' | 'bn-BD' | 'ta-IN' | 'te-IN' | 'mr-IN' | 'tr-TR' | 'vi-VN'

type Namespace = 'common' | 'errors' | 'forms' | 'auth' | 'interview' | 'dashboard' | 'visa-library' | 'pricing' | 'legal' | 'billing' | 'clients' | 'cases'

type TextDirection = 'ltr' | 'rtl'

// Translation interfaces
interface TranslationFile {
  [key: string]: string | TranslationFile
}

interface TranslationMetadata {
  version: string
  lastUpdated: string
  completeness: number
  validator: string
}

interface LanguageBundle {
  translations: TranslationFile
  metadata: TranslationMetadata
  rtlSupport: boolean
}
```

### Hook Options

```typescript
interface UseTranslationOptions {
  bindI18n?: string
  bindI18nStore?: string
  keyPrefix?: string
  nsMode?: 'default' | 'fallback'
  useSuspense?: boolean
}

interface UseFallbackTranslationOptions {
  fallbackLanguage?: LanguageCode
  enableGracefulDegradation?: boolean
  logMissingKeys?: boolean
  maxFallbackAttempts?: number
}

interface UseTranslationLoaderOptions {
  language: LanguageCode
  namespaces: Namespace[]
  loadPath: string
  preloadCritical?: boolean
  criticalNamespaces?: Namespace[]
  lazy?: boolean
  cache?: boolean
  maxRetries?: number
  retryDelay?: number
}

interface UseTranslationErrorHandlingOptions {
  enableNotifications?: boolean
  enableAutoRetry?: boolean
  maxAutoRetries?: number
  retryDelay?: number
  fallbackLanguage?: LanguageCode
}

interface UseTranslationValidationOptions {
  languages: LanguageCode[]
  namespaces: Namespace[]
  autoValidate?: boolean
  validationInterval?: number
  enableInterpolationValidation?: boolean
  enableConsistencyChecking?: boolean
}
```

### Service Options

```typescript
interface TranslationLoaderOptions {
  cache?: boolean
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  enableCompression?: boolean
  enableParallelLoading?: boolean
}

interface TranslationValidatorOptions {
  enableInterpolationValidation?: boolean
  enableConsistencyChecking?: boolean
  enableRTLValidation?: boolean
  strictMode?: boolean
}

interface CacheManagerOptions {
  maxSize?: number
  ttl?: number
  cleanupInterval?: number
  enableAutoCleanup?: boolean
  maxMemoryUsage?: number
  enableCompression?: boolean
}

interface PerformanceMonitorOptions {
  enableRealTimeMonitoring?: boolean
  sampleRate?: number
  enableMemoryTracking?: boolean
  enableNetworkTracking?: boolean
}
```

### Error Types

```typescript
interface TranslationError {
  id: string
  timestamp: Date
  language: LanguageCode
  namespace: Namespace
  key?: string
  errorType: 'missing_key' | 'loading_failed' | 'interpolation_error' | 'validation_error'
  message: string
  context?: string
  userAgent?: string
  resolved: boolean
}

interface ValidationError {
  type: 'missing_key' | 'empty_value' | 'invalid_interpolation' | 'inconsistent_format'
  key: string
  message: string
  severity: 'error' | 'warning'
  suggestions?: string[]
}

interface LoadingError extends Error {
  language: LanguageCode
  namespace: Namespace
  loadPath: string
  retryCount: number
  isRetryable: boolean
}
```

### Result Types

```typescript
interface LoadTranslationResult {
  success: boolean
  data?: TranslationFile
  error?: LoadingError
  fromCache?: boolean
  loadTime?: number
  retryCount?: number
}

interface ValidationResult {
  isValid: boolean
  completeness: number
  missingKeys: string[]
  emptyValues: string[]
  errors: ValidationError[]
  warnings: ValidationError[]
  interpolationErrors: string[]
  consistencyIssues: string[]
}

interface PerformanceMetrics {
  averageLoadTime: number
  cacheHitRate: number
  errorRate: number
  memoryUsage: number
  networkRequests: number
  totalTranslations: number
}
```

## Configuration

### i18n Configuration

```typescript
// i18n-config.ts
interface I18nConfig {
  supportedLanguages: LanguageCode[]
  defaultLanguage: LanguageCode
  fallbackLanguage: LanguageCode
  namespaces: {
    shared: Namespace[]
    l4h: Namespace[]
    cannlaw: Namespace[]
  }
  loadPath: string
  detection: {
    order: string[]
    caches: string[]
  }
  cache: {
    enabled: boolean
    ttl: number
    maxSize: number
  }
  errorHandling: {
    enabled: boolean
    maxRetries: number
    retryDelay: number
    fallbackEnabled: boolean
  }
  performance: {
    preloadCritical: boolean
    lazyLoading: boolean
    compression: boolean
  }
  rtl: {
    languages: LanguageCode[]
    autoDetection: boolean
  }
}
```

### Environment Configuration

```typescript
// Environment variables
interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  DEBUG_I18N?: boolean
  MONITOR_I18N_PERFORMANCE?: boolean
  I18N_CACHE_TTL?: number
  I18N_PRELOAD_CRITICAL?: boolean
  I18N_ENABLE_COMPRESSION?: boolean
  I18N_MAX_RETRIES?: number
  I18N_RETRY_DELAY?: number
}
```

### Build Configuration

```typescript
// Build-time configuration
interface BuildConfig {
  includeAllLanguages: boolean
  optimizeTranslations: boolean
  generateSourceMaps: boolean
  enableTreeShaking: boolean
  bundleSplitting: {
    enabled: boolean
    strategy: 'namespace' | 'language' | 'hybrid'
  }
  compression: {
    enabled: boolean
    algorithm: 'gzip' | 'brotli'
  }
}
```

---

This API reference provides complete documentation for all public APIs in the i18n system. For implementation examples and best practices, see the [Developer Guide](./I18N_DEVELOPER_GUIDE.md).