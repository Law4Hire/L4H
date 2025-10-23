# i18n System Troubleshooting Guide

This guide provides comprehensive troubleshooting information for the L4H platform's internationalization system.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Error Messages](#error-messages)
4. [Performance Issues](#performance-issues)
5. [RTL Language Issues](#rtl-language-issues)
6. [Development Issues](#development-issues)
7. [Testing Issues](#testing-issues)
8. [Debugging Tools](#debugging-tools)
9. [Support Resources](#support-resources)

## Quick Diagnostics

### System Health Check

Run this quick diagnostic to identify common issues:

```bash
# Check translation system health
npm run i18n:health-check

# Validate all translations
npm run validate-translations

# Test translation loading
npm run test-translation-loading

# Check RTL support
npm run test-rtl-support
```

### Browser Console Diagnostics

Open browser developer tools and check for these indicators:

```javascript
// Check i18n instance
console.log('i18n ready:', window.i18n?.isInitialized)
console.log('Current language:', window.i18n?.language)
console.log('Loaded namespaces:', window.i18n?.options?.ns)

// Check translation loading
console.log('Translation errors:', window.translationErrors)
console.log('Cache status:', window.translationCache?.getStats())
```

### Network Diagnostics

Check network requests in browser developer tools:

1. **Open Network Tab**: F12 → Network
2. **Filter by XHR**: Look for translation file requests
3. **Check Status Codes**: Ensure 200 OK responses
4. **Verify File Paths**: Confirm correct translation file URLs

## Common Issues

### 1. Translations Not Loading

#### Symptoms
- Components show translation keys instead of translated text
- Console errors about missing translation files
- Blank or untranslated content

#### Causes and Solutions

**Network Issues**
```bash
# Check network connectivity
curl -I https://your-domain.com/locales/es-ES/common.json

# Verify file accessibility
npm run verify-translation-files
```

**File Path Issues**
```typescript
// Check i18n configuration
import { i18n } from '@shared-ui/i18n-config'

console.log('Load path:', i18n.options.backend.loadPath)
console.log('Expected URL:', i18n.options.backend.loadPath
  .replace('{{lng}}', 'es-ES')
  .replace('{{ns}}', 'common'))
```

**CORS Issues**
```javascript
// Check CORS headers in network tab
// Ensure Access-Control-Allow-Origin is set correctly
```

**Cache Issues**
```bash
# Clear translation cache
npm run clear-translation-cache

# Force reload translations
npm run reload-translations
```

### 2. Partial Translation Display

#### Symptoms
- Some text translated, some remains in English
- Mixed language content on same page
- Inconsistent translation loading

#### Causes and Solutions

**Missing Translation Keys**
```bash
# Find missing keys
npm run find-missing-keys -- --language es-ES

# Generate missing keys report
npm run generate-missing-keys-report
```

**Namespace Loading Issues**
```typescript
// Check loaded namespaces
import { useTranslation } from 'react-i18next'

function DebugComponent() {
  const { i18n } = useTranslation()
  console.log('Loaded namespaces:', i18n.options.ns)
  console.log('Ready namespaces:', i18n.reportNamespaces.getUsedNamespaces())
  return null
}
```

**Interpolation Errors**
```bash
# Validate interpolation
npm run validate-interpolation

# Check for parameter mismatches
npm run check-interpolation-params
```

### 3. Language Switching Failures

#### Symptoms
- Language selector doesn't respond
- Language changes but content doesn't update
- Error messages during language switching

#### Causes and Solutions

**React State Issues**
```typescript
// Check component re-rendering
import { useTranslation } from 'react-i18next'

function DebugComponent() {
  const { i18n, ready } = useTranslation()
  
  useEffect(() => {
    console.log('Language changed:', i18n.language)
    console.log('i18n ready:', ready)
  }, [i18n.language, ready])
  
  return null
}
```

**Event Listener Issues**
```typescript
// Check i18n event listeners
import { i18n } from '@shared-ui/i18n-config'

i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng)
})

i18n.on('loaded', (loaded) => {
  console.log('Translations loaded:', loaded)
})
```

**Provider Issues**
```typescript
// Ensure proper provider wrapping
import { L4HI18nProvider } from '@shared-ui/providers/L4HI18nProvider'

// ✅ Correct
function App() {
  return (
    <L4HI18nProvider>
      <YourComponents />
    </L4HI18nProvider>
  )
}

// ❌ Incorrect - missing provider
function App() {
  return <YourComponents />
}
```

### 4. Performance Issues

#### Symptoms
- Slow language switching
- Long page load times
- High memory usage
- Frequent network requests

#### Causes and Solutions

**Large Translation Files**
```bash
# Analyze translation file sizes
npm run analyze-translation-sizes

# Compress translation files
npm run compress-translations

# Split large translation files
npm run split-translation-files
```

**Cache Inefficiency**
```typescript
// Check cache performance
import { TranslationCacheManager } from '@shared-ui/services/TranslationCacheManager'

const cacheManager = new TranslationCacheManager()
const stats = cacheManager.getCacheStats()

console.log('Cache hit rate:', stats.hitRate)
console.log('Cache size:', stats.size)
console.log('Memory usage:', stats.memoryUsage)
```

**Unnecessary Preloading**
```typescript
// Optimize preloading
import { translationLoader } from '@shared-ui/services/TranslationLoader'

// Only preload critical namespaces
await translationLoader.preloadNamespaces('es-ES', ['common', 'errors'])
```

## Error Messages

### Translation Loading Errors

#### "Failed to load translation file"

**Meaning**: Translation file couldn't be downloaded

**Solutions**:
```bash
# Check file existence
curl -I /locales/es-ES/common.json

# Verify server configuration
npm run verify-server-config

# Check file permissions
ls -la web/*/public/locales/
```

#### "Translation key not found"

**Meaning**: Requested translation key doesn't exist

**Solutions**:
```bash
# Find missing keys
npm run find-missing-keys -- --key "common.welcome"

# Add missing key
npm run add-translation-key -- --key "common.welcome" --value "Welcome"
```

#### "Interpolation parameter missing"

**Meaning**: Translation expects parameters that weren't provided

**Solutions**:
```typescript
// ❌ Incorrect - missing parameter
t('welcome.user', 'Welcome {{name}}')

// ✅ Correct - with parameter
t('welcome.user', 'Welcome {{name}}', { name: userName })
```

### Runtime Errors

#### "i18n instance not initialized"

**Meaning**: i18n system hasn't been properly set up

**Solutions**:
```typescript
// Check initialization
import { i18n } from '@shared-ui/i18n-config'

if (!i18n.isInitialized) {
  console.error('i18n not initialized')
  // Re-initialize if needed
  await i18n.init()
}
```

#### "Multiple i18n instances detected"

**Meaning**: Multiple i18n instances are conflicting

**Solutions**:
```bash
# Check for duplicate instances
npm run check-i18n-instances

# Ensure single instance usage
npm run fix-i18n-instances
```

### Network Errors

#### "CORS policy blocked translation request"

**Meaning**: Cross-origin request blocked by browser

**Solutions**:
```javascript
// Check server CORS configuration
// Ensure these headers are set:
// Access-Control-Allow-Origin: *
// Access-Control-Allow-Methods: GET
// Access-Control-Allow-Headers: Content-Type
```

#### "404 Not Found for translation file"

**Meaning**: Translation file doesn't exist at expected path

**Solutions**:
```bash
# Verify file structure
find web/*/public/locales -name "*.json" | head -20

# Check file naming convention
npm run verify-file-naming
```

## Performance Issues

### Slow Translation Loading

#### Diagnosis
```bash
# Measure loading performance
npm run measure-translation-performance

# Analyze network requests
npm run analyze-translation-requests

# Check bundle sizes
npm run analyze-translation-bundles
```

#### Solutions

**Enable Compression**
```bash
# Compress translation files
npm run compress-translations

# Enable gzip on server
# Add to server configuration:
# gzip_types application/json;
```

**Optimize Caching**
```typescript
// Configure cache settings
import { TranslationCacheManager } from '@shared-ui/services/TranslationCacheManager'

const cacheManager = new TranslationCacheManager({
  maxSize: 50, // MB
  ttl: 3600000, // 1 hour
  cleanupInterval: 300000 // 5 minutes
})
```

**Preload Critical Translations**
```typescript
// Preload essential namespaces
import { translationLoader } from '@shared-ui/services/TranslationLoader'

// On app initialization
await translationLoader.preloadNamespaces(
  navigator.language,
  ['common', 'errors', 'forms']
)
```

### Memory Issues

#### Diagnosis
```typescript
// Monitor memory usage
import { TranslationCacheManager } from '@shared-ui/services/TranslationCacheManager'

const cacheManager = new TranslationCacheManager()

setInterval(() => {
  const stats = cacheManager.getCacheStats()
  console.log('Memory usage:', stats.memoryUsage, 'MB')
  
  if (stats.memoryUsage > 100) {
    console.warn('High memory usage detected')
    cacheManager.cleanup()
  }
}, 30000)
```

#### Solutions

**Enable Automatic Cleanup**
```typescript
// Configure automatic cleanup
const cacheManager = new TranslationCacheManager({
  enableAutoCleanup: true,
  cleanupInterval: 300000, // 5 minutes
  maxMemoryUsage: 50 // MB
})
```

**Lazy Load Translations**
```typescript
// Load translations on demand
import { useTranslationLoader } from '@shared-ui/hooks/useTranslationLoader'

function LazyComponent() {
  const { loadTranslations } = useTranslationLoader({
    lazy: true,
    namespaces: ['specialized-content']
  })
  
  const handleShowSpecializedContent = async () => {
    await loadTranslations()
    // Show content after translations loaded
  }
  
  return <button onClick={handleShowSpecializedContent}>Load Content</button>
}
```

## RTL Language Issues

### Layout Problems

#### Symptoms
- Text flows left-to-right in RTL languages
- UI elements positioned incorrectly
- Scrollbars on wrong side

#### Solutions

**Check RTL Detection**
```typescript
import { useRTL } from '@shared-ui/hooks/useRTL'

function DebugRTL() {
  const { isRTL, direction, language } = useRTL()
  
  console.log('RTL Debug:', {
    isRTL,
    direction,
    language,
    documentDir: document.documentElement.dir
  })
  
  return null
}
```

**Verify CSS Loading**
```bash
# Check RTL CSS files
ls -la web/shared-ui/src/styles/rtl.css

# Verify CSS is loaded
# Check browser developer tools → Sources → CSS files
```

**Fix Layout Issues**
```css
/* Ensure RTL styles are applied */
[dir="rtl"] .component {
  text-align: right;
  margin-left: 0;
  margin-right: 1rem;
}

/* Use logical properties */
.component {
  margin-inline-start: 1rem;
  padding-inline-end: 0.5rem;
}
```

### Text Direction Issues

#### Symptoms
- Mixed text direction in RTL languages
- Numbers display incorrectly
- Punctuation positioning wrong

#### Solutions

**Check Unicode Bidi**
```css
/* Force text direction */
.rtl-text {
  direction: rtl;
  unicode-bidi: embed;
}

/* For mixed content */
.mixed-content {
  unicode-bidi: plaintext;
}
```

**Handle Numbers and Dates**
```typescript
// Format numbers for RTL
import { formatNumber } from '@shared-ui/utils/rtl-formatting'

function RTLNumber({ value, language }) {
  const formattedNumber = formatNumber(value, language)
  return <span dir="ltr">{formattedNumber}</span>
}
```

## Development Issues

### Build Errors

#### "Translation file not found during build"

**Solutions**:
```bash
# Verify build process includes translation files
npm run build -- --verbose

# Check build output
ls -la dist/locales/

# Ensure files are copied correctly
npm run copy-translations
```

#### "TypeScript errors in translation files"

**Solutions**:
```bash
# Validate JSON syntax
npm run validate-json

# Check TypeScript configuration
npx tsc --noEmit --project tsconfig.json
```

### Development Server Issues

#### "Hot reload not working with translations"

**Solutions**:
```javascript
// Configure Vite for translation hot reload
// vite.config.ts
export default defineConfig({
  server: {
    watch: {
      include: ['src/**', 'public/locales/**']
    }
  }
})
```

#### "Translation changes not reflected"

**Solutions**:
```bash
# Clear development cache
npm run dev:clear-cache

# Restart development server
npm run dev:restart

# Force reload translations
npm run dev:reload-translations
```

## Testing Issues

### Unit Test Failures

#### "Translation not found in tests"

**Solutions**:
```typescript
// Mock translations in tests
import { renderWithI18n } from '@shared-ui/test-utils'

test('renders with translations', () => {
  const mockTranslations = {
    'common.welcome': 'Welcome'
  }
  
  renderWithI18n(<Component />, {
    translations: mockTranslations
  })
})
```

#### "i18n not initialized in tests"

**Solutions**:
```typescript
// Setup i18n for tests
// test-setup.ts
import { setupI18nForTesting } from '@shared-ui/test-utils'

beforeAll(async () => {
  await setupI18nForTesting()
})
```

### E2E Test Failures

#### "Language switching not working in tests"

**Solutions**:
```typescript
// Wait for language change in tests
await page.selectOption('[data-testid="language-selector"]', 'es-ES')
await page.waitForSelector('[data-testid="content"][lang="es-ES"]')
```

#### "RTL tests failing"

**Solutions**:
```typescript
// Configure browser for RTL testing
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'rtl-testing',
      use: {
        locale: 'ar-SA',
        extraHTTPHeaders: {
          'Accept-Language': 'ar-SA'
        }
      }
    }
  ]
})
```

## Debugging Tools

### Browser Developer Tools

#### Console Commands
```javascript
// Debug i18n state
window.debugI18n = () => {
  console.log('i18n instance:', window.i18n)
  console.log('Current language:', window.i18n.language)
  console.log('Loaded resources:', window.i18n.store.data)
  console.log('Options:', window.i18n.options)
}

// Test translation loading
window.testTranslationLoading = async (language, namespace) => {
  try {
    const result = await window.translationLoader.loadTranslation({
      language,
      namespace,
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    })
    console.log('Loading result:', result)
  } catch (error) {
    console.error('Loading failed:', error)
  }
}

// Check cache status
window.checkCache = () => {
  const stats = window.translationCache.getCacheStats()
  console.log('Cache stats:', stats)
}
```

#### Network Analysis
1. **Open Network Tab**: F12 → Network
2. **Filter by Fetch/XHR**: Look for translation requests
3. **Check Response**: Verify translation file content
4. **Monitor Timing**: Check request/response times

### Command Line Tools

#### Translation Validation
```bash
# Comprehensive validation
npm run validate-all

# Specific validations
npm run validate:completeness
npm run validate:interpolation
npm run validate:consistency
npm run validate:rtl

# Generate reports
npm run report:missing-keys
npm run report:performance
npm run report:errors
```

#### Performance Analysis
```bash
# Analyze performance
npm run analyze:performance
npm run analyze:bundle-size
npm run analyze:cache-efficiency

# Generate performance report
npm run report:performance -- --output performance-report.html
```

#### Debug Mode
```bash
# Enable debug mode
NODE_ENV=development DEBUG=i18n:* npm run dev

# Enable verbose logging
DEBUG_I18N=true npm run dev

# Enable performance monitoring
MONITOR_I18N_PERFORMANCE=true npm run dev
```

### Custom Debug Components

#### Translation Debug Panel
```typescript
import { TranslationDebugPanel } from '@shared-ui/debug/TranslationDebugPanel'

// Add to development builds only
function App() {
  return (
    <div>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <TranslationDebugPanel />
      )}
    </div>
  )
}
```

#### Performance Monitor
```typescript
import { TranslationPerformanceMonitor } from '@shared-ui/debug/TranslationPerformanceMonitor'

// Monitor translation performance
function App() {
  return (
    <div>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <TranslationPerformanceMonitor />
      )}
    </div>
  )
}
```

## Support Resources

### Documentation
- [Developer Guide](./I18N_DEVELOPER_GUIDE.md)
- [User Guide](./MULTILINGUAL_USER_GUIDE.md)
- [API Reference](./I18N_API_REFERENCE.md)
- [Testing Guide](../tests/ui.e2e/README-multilingual-testing.md)

### Tools and Scripts
```bash
# Health check
npm run i18n:health-check

# Validation suite
npm run i18n:validate-all

# Performance analysis
npm run i18n:analyze-performance

# Debug utilities
npm run i18n:debug

# Generate reports
npm run i18n:generate-reports
```

### Community Resources
- GitHub Issues: Report bugs and feature requests
- Community Forum: Get help from other developers
- Stack Overflow: Search for common solutions
- Documentation Wiki: Community-maintained guides

### Professional Support
- Technical Support: Contact for complex issues
- Consulting Services: Professional implementation help
- Training Programs: Learn best practices
- Custom Development: Tailored solutions

### Emergency Procedures

#### Critical Translation Failure
1. **Immediate Action**: Switch to English fallback
2. **Identify Scope**: Determine affected languages/features
3. **Implement Workaround**: Use cached translations if available
4. **Contact Support**: Report critical issue immediately
5. **Monitor Recovery**: Track system restoration

#### Performance Degradation
1. **Monitor Metrics**: Check performance dashboards
2. **Identify Bottleneck**: Use profiling tools
3. **Implement Quick Fix**: Clear cache, restart services
4. **Scale Resources**: Increase server capacity if needed
5. **Plan Long-term Fix**: Address root cause

#### Security Incident
1. **Assess Impact**: Determine if translations are compromised
2. **Isolate System**: Prevent further damage
3. **Restore from Backup**: Use clean translation files
4. **Update Security**: Patch vulnerabilities
5. **Monitor Activity**: Watch for suspicious behavior

---

For additional support, contact the development team or refer to the comprehensive documentation suite.