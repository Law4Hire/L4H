# Translation Audit Guide

This guide explains how to use the automated translation audit tools to detect English text in non-English translation files.

## 🎯 Purpose

The translation audit tools help you:
- Detect untranslated English text in foreign language files
- Identify copy-paste errors where English wasn't properly translated
- Find suspicious patterns that indicate translation issues
- Generate comprehensive reports for quality assurance

## 🚀 Quick Start

### Option 1: Node.js Script (Recommended)
```bash
# Run the audit
node scripts/translation-audit.js

# The script will:
# - Scan all translation files in web/l4h, web/cannlaw, and web/shared-ui
# - Skip en-US files (these should contain English)
# - Generate console report and JSON file
```

### Option 2: PowerShell Script (Windows)
```powershell
# Basic audit
.\scripts\translation-audit.ps1

# Detailed report
.\scripts\translation-audit.ps1 -Detailed

# Export to JSON
.\scripts\translation-audit.ps1 -OutputFormat json

# Export to CSV
.\scripts\translation-audit.ps1 -OutputFormat csv
```

## 📊 What Gets Detected

### High Severity Issues
- **Suspicious English Phrases**: Common English phrases like "please enter", "click here", "contact us"
- **File Parsing Errors**: JSON syntax errors that prevent file reading

### Medium Severity Issues
- **English Words**: Common English words that shouldn't appear in other languages
- **English Patterns**: Sentence structures typical of English grammar

### Detection Examples

❌ **Issues that will be flagged:**
```json
{
  "welcome": "Welcome to our application",  // English in Spanish file
  "submit": "Please click the submit button",  // English phrase pattern
  "error": "An error occurred"  // Common English words
}
```

✅ **Content that won't be flagged:**
```json
{
  "welcome": "Bienvenido a nuestra aplicación",  // Proper Spanish
  "submit": "Haga clic en el botón enviar",  // Proper Spanish
  "error": "Se produjo un error"  // Proper Spanish
}
```

## 📁 Files Scanned

The audit covers these directories:
- `web/l4h/public/locales/` - L4H application translations
- `web/cannlaw/public/locales/` - Cannlaw application translations  
- `web/shared-ui/public/locales/` - Shared UI component translations

**Excluded:** All `en-US` and `en-CA` directories (these should contain English)

## 📋 Report Output

### Console Report
- Summary statistics (files scanned, languages, issues found)
- Issues grouped by severity level
- Detailed breakdown by file
- Actionable recommendations

### JSON Report (`translation-audit-report.json`)
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "filesScanned": 45,
    "languagesAudited": ["es-ES", "fr-FR", "de-DE", "ar-SA"],
    "totalIssues": 12
  },
  "issues": [
    {
      "file": "web/l4h/public/locales/es-ES/common.json",
      "type": "ENGLISH_WORDS",
      "severity": "MEDIUM",
      "key": "navigation.home",
      "value": "Home",
      "details": "Contains English words: home"
    }
  ]
}
```

## 🔧 Customization

### Adding Custom Detection Rules

Edit the scripts to add your own detection patterns:

**English Words** - Add to `ENGLISH_INDICATORS` array:
```javascript
// Add application-specific terms
'attorney', 'legal', 'immigration', 'visa', 'citizenship'
```

**English Phrases** - Add to `ENGLISH_PATTERNS` array:
```javascript
// Add regex patterns for your domain
/\b(immigration|visa)\s+(application|process)/i
```

### Language-Specific Exclusions

To exclude certain languages from audit:
```javascript
// Skip specific language codes
if (langCode === 'en-GB' || langCode === 'en-AU') {
  return; // Skip other English variants
}
```

## 🎯 Best Practices

### 1. Regular Audits
- Run audits before releases
- Include in CI/CD pipeline
- Schedule weekly quality checks

### 2. Prioritize Issues
1. **HIGH severity first** - Likely untranslated content
2. **MEDIUM severity** - Potential translation problems  
3. **LOW severity** - Minor inconsistencies

### 3. Manual Review
- Audit tools detect patterns, but human review is essential
- Consider cultural context and local expressions
- Verify technical terms are appropriately localized

### 4. Integration with Workflow
```bash
# Add to package.json scripts
"scripts": {
  "audit:translations": "node scripts/translation-audit.js",
  "test:i18n": "npm run audit:translations && npm run test:translations"
}
```

## 🚨 Common Issues Found

### Copy-Paste Errors
```json
// Spanish file with English content
{
  "login": "Login",  // Should be "Iniciar sesión"
  "password": "Password"  // Should be "Contraseña"
}
```

### Partial Translations
```json
// Mixed language content
{
  "message": "Bienvenido! Please complete your profile"  // Mixed Spanish/English
}
```

### Technical Terms
```json
// Consider if these should be translated
{
  "api": "API",  // May be acceptable
  "email": "Email"  // Could be "Correo electrónico"
}
```

## 📞 Next Steps

After running the audit:

1. **Review the report** - Focus on HIGH severity issues first
2. **Fix critical issues** - Update translation files with proper translations
3. **Validate fixes** - Re-run audit to confirm issues are resolved
4. **Implement prevention** - Add audit to your development workflow

## 🔗 Related Tools

- `web/shared-ui/src/scripts/translation-completeness-validator.ts` - Checks for missing translations
- `web/shared-ui/src/scripts/translation-consistency-checker.ts` - Validates translation consistency
- `web/shared-ui/src/scripts/run-translation-validation.ts` - Comprehensive validation suite