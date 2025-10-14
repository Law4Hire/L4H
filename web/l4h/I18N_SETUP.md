# i18next Configuration with Namespace Support

This document describes the enhanced i18next configuration implemented for the L4H application, which provides comprehensive internationalization support with namespace organization, lazy loading, RTL language support, and robust fallback mechanisms.

## Overview

The new i18n system addresses the requirements from task 2.1:
- ✅ Multiple namespace support (common, interview, errors)
- ✅ Lazy loading strategy for translation files
- ✅ Proper fallback mechanisms when translations fail to load
- ✅ RTL language detection and automatic layout switching

## Architecture

### Configuration Files

1. **`web/shared-ui/src/i18n-config.ts`** - Main i18n configuration
2. **`web/shared-ui/src/i18n-provider.tsx`** - React provider with enhanced features
3. **`web/shared-ui/src/styles/rtl.css`** - RTL layout support styles
4. **`web/l4h/public/locales/`** - Translation files organized by language and namespace

### Namespace Organization

The system uses three main namespaces:

- **`common`** - General UI elements, navigation, authentication, dashboard
- **`interview`** - Interview-specific content, questions, progress indicators
- **`errors`** - Error messages, validation messages, network errors

### Supported Languages

The system supports 21 languages as defined in `SUPPORTED_LANGUAGES`:
- `ar-SA` (Arabic - Saudi Arabia) - RTL
- `bn-BD` (Bengali - Bangladesh)
- `de-DE` (German - Germany)
- `en-US` (English - United States) - Default/Fallback
- `es-ES` (Spanish - Spain)
- `fr-FR` (French - France)
- `hi-IN` (Hindi - India)
- `id-ID` (Indonesian - Indonesia)
- `it-IT` (Italian - Italy)
- `ja-JP` (Japanese - Japan)
- `ko-KR` (Korean - South Korea)
- `mr-IN` (Marathi - India)
- `pl-PL` (Polish - Poland)
- `pt-BR` (Portuguese - Brazil)
- `ru-RU` (Russian - Russia)
- `ta-IN` (Tamil - India)
- `te-IN` (Telugu - India)
- `tr-TR` (Turkish - Turkey)
- `ur-PK` (Urdu - Pakistan) - RTL
- `vi-VN` (Vietnamese - Vietnam)
- `zh-CN` (Chinese - China)

## File Structure

```
web/l4h/public/locales/
├── en-US/
│   ├── common.json
│   ├── interview.json
│   └── errors.json
├── es-ES/
│   ├── common.json
│   ├── interview.json
│   └── errors.json
├── fr-FR/
│   ├── common.json
│   ├── interview.json
│   └── errors.json
├── ar-SA/
│   ├── common.json
│   ├── interview.json
│   └── errors.json
└── [other languages...]
```

## Key Features

### 1. Lazy Loading

Translation files are loaded on-demand using i18next-http-backend:

```typescript
backend: {
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  
  customLoad: (language: string, namespace: string, callback) => {
    // Custom loading with fallback handling
    fetch(`/locales/${language}/${namespace}.json`)
      .then(response => response.json())
      .then(data => callback(null, data))
      .catch(error => {
        // Fallback to English if loading fails
        if (language !== FALLBACK_LANGUAGE) {
          fetch(`/locales/${FALLBACK_LANGUAGE}/${namespace}.json`)
            .then(response => response.json())
            .then(data => callback(null, data))
            .catch(() => callback(null, {}))
        }
      })
  }
}
```

### 2. RTL Language Support

Automatic RTL detection and layout switching:

```typescript
// RTL languages
const RTL_LANGUAGES = ['ar-SA', 'ur-PK', 'ar', 'ur']

// Automatic direction setting
export function setRTLDirection(language: string): void {
  if (typeof document !== 'undefined') {
    const isRTL = RTL_LANGUAGES.includes(language)
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = language
    
    if (isRTL) {
      document.documentElement.classList.add('rtl')
    } else {
      document.documentElement.classList.remove('rtl')
    }
  }
}
```

### 3. Fallback Mechanisms

Multiple levels of fallback:

1. **Namespace fallback**: Falls back to `common` namespace if specific namespace fails
2. **Language fallback**: Falls back to English (`en-US`) if target language fails
3. **Key fallback**: Returns the key itself if translation is missing
4. **Empty object fallback**: Returns empty object to prevent complete failure

### 4. Enhanced Provider

The `I18nProvider` provides additional context:

```typescript
interface I18nContextType {
  cultures: Culture[]
  currentCulture: string
  setCurrentCulture: (culture: string) => Promise<void>
  isLoading: boolean
  isRTL: boolean
  supportedLanguages: string[]
}
```

## Usage Examples

### Basic Translation Usage

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  // Default namespace (common)
  const { t } = useTranslation()
  
  // Specific namespace
  const { t: tInterview } = useTranslation('interview')
  const { t: tErrors } = useTranslation('errors')
  
  return (
    <div>
      <h1>{t('nav.dashboard')}</h1>
      <p>{tInterview('title')}</p>
      <span>{tErrors('network.timeout')}</span>
    </div>
  )
}
```

### Using the Enhanced Provider

```typescript
import { useI18n } from '@l4h/shared-ui'

function LanguageSwitcher() {
  const { cultures, currentCulture, setCurrentCulture, isRTL } = useI18n()
  
  return (
    <div className={isRTL ? 'text-right' : 'text-left'}>
      <select 
        value={currentCulture} 
        onChange={(e) => setCurrentCulture(e.target.value)}
      >
        {cultures.map(culture => (
          <option key={culture.code} value={culture.code}>
            {culture.displayName}
          </option>
        ))}
      </select>
    </div>
  )
}
```

### Interpolation

```typescript
// In translation file
{
  "progress": {
    "stats": "Question {{current}} | {{remaining}} visa types remaining"
  }
}

// In component
const progressText = t('interview:progress.stats', { 
  current: 3, 
  remaining: 12 
})
// Result: "Question 3 | 12 visa types remaining"
```

## RTL Styling

The system includes comprehensive RTL CSS support in `web/shared-ui/src/styles/rtl.css`:

### Automatic Layout Adjustments

```css
/* Text alignment */
html[dir="rtl"] .text-left {
  text-align: right;
}

html[dir="rtl"] .text-right {
  text-align: left;
}

/* Margins and padding */
html[dir="rtl"] .ml-auto {
  margin-left: unset;
  margin-right: auto;
}

/* Flexbox direction */
html[dir="rtl"] .flex-row {
  flex-direction: row-reverse;
}
```

### Component-Specific RTL Support

```css
/* Interview components */
html[dir="rtl"] .interview-question {
  text-align: right;
}

html[dir="rtl"] .interview-navigation {
  flex-direction: row-reverse;
}

/* Form elements */
html[dir="rtl"] .form-input {
  text-align: right;
}

html[dir="rtl"] .form-input[type="number"] {
  text-align: left; /* Numbers remain LTR */
}
```

## Error Handling

### Translation Loading Errors

```typescript
i18n.on('failedLoading', (lng, ns, msg) => {
  console.warn(`Failed loading translation: ${lng}/${ns}`, msg)
})

// Missing key handler
missingKeyHandler: (lng, ns, key) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`)
  }
}
```

### Graceful Degradation

1. If a specific translation fails to load, the system falls back to English
2. If English also fails, an empty object is returned to prevent crashes
3. Missing keys return the key name itself as a fallback
4. The UI remains functional even with missing translations

## Performance Considerations

### Lazy Loading Benefits

- Reduces initial bundle size
- Only loads translations for the current language
- Loads namespaces on-demand
- Caches loaded translations

### Optimization Features

- Translation file compression
- Browser caching with appropriate headers
- Preloading of fallback language
- Efficient namespace organization

## Development Guidelines

### Adding New Languages

1. Create language directory: `web/l4h/public/locales/[lang-code]/`
2. Add translation files for each namespace
3. Update `CULTURE_NAMES` in `i18n-config.ts`
4. Add to `SUPPORTED_LANGUAGES` array
5. If RTL, add to `RTL_LANGUAGES` array

### Adding New Translation Keys

1. Add key to appropriate namespace file in English
2. Add translations for all supported languages
3. Use consistent key naming: `section.subsection.key`
4. Include interpolation placeholders where needed

### Testing Translations

```typescript
// Test component for verifying translations
import { I18nTest } from '../components/I18nTest'

// Temporarily add to any page for testing
<I18nTest />
```

## Migration from Old System

The new system replaces the old hardcoded translation approach:

### Before (Old System)
```typescript
// Hardcoded in components
const resources = {
  'en-US': {
    common: {
      loading: 'Loading...',
      // ... thousands of lines
    }
  }
}
```

### After (New System)
```typescript
// Organized in separate files
// web/l4h/public/locales/en-US/common.json
{
  "loading": "Loading...",
  "nav": {
    "dashboard": "Dashboard"
  }
}
```

## Troubleshooting

### Common Issues

1. **Translation not loading**: Check file path and network requests
2. **RTL not working**: Ensure RTL CSS is imported
3. **Missing keys**: Check console for missing key warnings
4. **Fallback not working**: Verify fallback language files exist

### Debug Mode

Enable debug mode in development:

```typescript
debug: process.env.NODE_ENV === 'development'
```

This will log translation loading and missing keys to the console.

## Future Enhancements

1. **Translation Management**: Integration with translation management services
2. **Pluralization**: Enhanced plural form support for complex languages
3. **Context-aware translations**: Different translations based on context
4. **Performance monitoring**: Track translation loading performance
5. **A/B testing**: Support for translation A/B testing

## Conclusion

The new i18n system provides a robust, scalable foundation for internationalization that meets all the requirements from the specification. It supports multiple namespaces, lazy loading, RTL languages, and comprehensive fallback mechanisms while maintaining excellent performance and developer experience.