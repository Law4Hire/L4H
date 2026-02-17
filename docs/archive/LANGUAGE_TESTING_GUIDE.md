# Language Testing Guide

This guide explains how to test the multilingual functionality of the L4H application system.

## Quick Start

### 1. Access the Language Test Page

Navigate to the language test page in your browser:
```
http://localhost:5173/language-test
```

### 2. Run Automated Tests

Click the "Run Full Test" button to automatically test all supported languages. The test will:
- Switch through all 21+ supported languages
- Verify translation loading
- Check RTL (Right-to-Left) language support
- Test navigation menu translations
- Measure loading performance
- Generate a comprehensive report

### 3. Manual Language Testing

Use the language selector in the top-right corner to manually switch between languages and observe:
- Text direction changes (LTR ↔ RTL)
- Navigation menu translations
- Page content translations
- Number and date formatting

## Supported Languages

The system supports 21+ languages including:

### Left-to-Right (LTR) Languages
- **English (US)** - `en-US` 🇺🇸
- **Spanish (Spain)** - `es-ES` 🇪🇸
- **French (France)** - `fr-FR` 🇫🇷
- **German (Germany)** - `de-DE` 🇩🇪
- **Italian (Italy)** - `it-IT` 🇮🇹
- **Portuguese (Brazil)** - `pt-BR` 🇧🇷
- **Russian (Russia)** - `ru-RU` 🇷🇺
- **Chinese (China)** - `zh-CN` 🇨🇳
- **Japanese (Japan)** - `ja-JP` 🇯🇵
- **Korean (South Korea)** - `ko-KR` 🇰🇷
- **Hindi (India)** - `hi-IN` 🇮🇳
- **Bengali (Bangladesh)** - `bn-BD` 🇧🇩
- **Marathi (India)** - `mr-IN` 🇮🇳
- **Tamil (India)** - `ta-IN` 🇮🇳
- **Telugu (India)** - `te-IN` 🇮🇳
- **Vietnamese (Vietnam)** - `vi-VN` 🇻🇳
- **Indonesian (Indonesia)** - `id-ID` 🇮🇩
- **Turkish (Turkey)** - `tr-TR` 🇹🇷
- **Polish (Poland)** - `pl-PL` 🇵🇱

### Right-to-Left (RTL) Languages
- **Arabic (Saudi Arabia)** - `ar-SA` 🇸🇦
- **Urdu (Pakistan)** - `ur-PK` 🇵🇰

## Test Features

### 1. Language Switching Test Component

The `LanguageSwitchingTest` component provides:
- **Automated Testing**: Tests all languages sequentially
- **Performance Monitoring**: Measures load times for each language
- **Error Detection**: Identifies missing translations and loading failures
- **RTL Validation**: Verifies proper right-to-left layout changes
- **Progress Tracking**: Real-time progress indicator during testing
- **Detailed Results**: Comprehensive test results with error details

### 2. Navigation Menu Testing

Tests translation of common navigation elements:
- Home, About, Services, Contact
- Login, Logout, Dashboard
- Profile, Settings, Help

### 3. Translation Monitoring

The system includes built-in monitoring for:
- **Error Tracking**: Missing keys, loading failures, fallback usage
- **Performance Metrics**: Load times, cache hit rates, language switch times
- **User Feedback**: Rating system for translation quality
- **Real-time Dashboard**: Administrative monitoring interface

## Command Line Testing

### Run Language Tests via CLI

```bash
# Test against local development server
cd web/shared-ui
npm run test:language-switching

# Test against specific URL
npm run test:language-switching http://localhost:3000

# Export results to file
npm run test:language-switching http://localhost:3000 results.json
```

### Test Output Example

```
🌐 Starting Language Switching Tests...
📍 Base URL: http://localhost:5173
🔢 Testing 21 languages

[5%] Testing en-US (English (United States))...
  ✅ Success (245ms)
[10%] Testing ar-SA (العربية (السعودية))...
  ✅ Success (312ms)
[15%] Testing bn-BD (বাংলা (বাংলাদেশ))...
  ✅ Success (298ms)
...

📊 Test Summary:
   Success Rate: 95.2% (20/21)
   Average Load Time: 287ms

🔄 RTL Languages: 2/2 successful
🎉 All critical language tests passed!
```

## What to Look For

### ✅ Successful Language Switch
- Text changes to the selected language
- Layout direction changes for RTL languages (Arabic, Urdu)
- Navigation menu updates
- Numbers and dates format correctly
- No console errors
- Smooth transitions

### ❌ Common Issues to Watch For
- **Missing Translations**: Text remains in English or shows translation keys
- **RTL Layout Issues**: Text direction doesn't change for Arabic/Urdu
- **Loading Failures**: Network errors or 404s for translation files
- **Performance Issues**: Slow loading times (>3 seconds)
- **Console Errors**: JavaScript errors during language switching
- **Broken Formatting**: Numbers, dates, or currency display incorrectly

## RTL (Right-to-Left) Testing

Special attention should be paid to RTL languages:

### Arabic (ar-SA) and Urdu (ur-PK)
- **Text Direction**: Should flow right-to-left
- **Layout Mirroring**: Menus, buttons, and navigation should mirror
- **Number Formatting**: Numbers should use Latin numerals for consistency
- **Mixed Content**: English text within RTL content should maintain proper direction

### Visual Indicators
- Page layout flips horizontally
- Text alignment changes to right-aligned
- Navigation menus appear on the right side
- Scroll bars appear on the left side
- CSS `dir="rtl"` attribute is applied to `<html>` element

## Performance Benchmarks

### Expected Load Times
- **Fast**: < 500ms (cached translations)
- **Acceptable**: 500ms - 2s (first load)
- **Slow**: 2s - 5s (network issues)
- **Critical**: > 5s (requires investigation)

### Performance Factors
- **Network Speed**: Affects initial translation file loading
- **Cache Status**: Subsequent loads should be much faster
- **Bundle Size**: Larger translation files take longer to load
- **Server Response**: API response times for translation files

## Troubleshooting

### Translation Files Not Loading
1. Check network tab for 404 errors
2. Verify translation files exist in `/public/locales/`
3. Check file permissions and server configuration
4. Validate JSON syntax in translation files

### RTL Layout Not Working
1. Verify CSS includes RTL styles
2. Check `dir` attribute on HTML element
3. Ensure RTL-specific CSS custom properties are applied
4. Test with browser developer tools

### Performance Issues
1. Check network conditions
2. Verify translation file sizes
3. Test caching behavior
4. Monitor browser console for errors

### Missing Translations
1. Check translation key spelling
2. Verify namespace configuration
3. Ensure fallback translations exist
4. Check i18next configuration

## Integration with CI/CD

The language testing can be integrated into your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Test Language Switching
  run: |
    npm run build
    npm start &
    sleep 10
    npm run test:language-switching http://localhost:3000
```

## Monitoring and Analytics

The system provides comprehensive monitoring:

### Error Tracking
- Missing translation keys
- Loading failures
- Fallback usage
- Performance issues

### User Feedback
- Translation quality ratings
- Cultural appropriateness feedback
- Technical issue reports
- Improvement suggestions

### Performance Metrics
- Language switch times
- Translation load times
- Cache hit rates
- Error rates by language

## Best Practices

### For Developers
1. **Test Early**: Test language switching during development
2. **Monitor Performance**: Keep translation files optimized
3. **Handle Errors**: Implement proper fallback mechanisms
4. **Validate RTL**: Always test Arabic and Urdu layouts
5. **Use Monitoring**: Leverage built-in error tracking

### For QA Teams
1. **Comprehensive Testing**: Test all supported languages
2. **Cross-Browser Testing**: Verify RTL support across browsers
3. **Performance Testing**: Monitor load times and responsiveness
4. **User Experience**: Evaluate translation quality and cultural appropriateness
5. **Edge Cases**: Test with poor network conditions and missing files

### For Content Teams
1. **Translation Quality**: Ensure accurate and culturally appropriate translations
2. **Consistency**: Maintain consistent terminology across languages
3. **Completeness**: Verify all keys have translations
4. **Context**: Provide context for translators when needed
5. **Feedback**: Monitor user feedback and improve translations

## Support

For issues or questions about language testing:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Test with the automated test suite
4. Check the monitoring dashboard for insights
5. Contact the development team with specific error details

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintainer**: L4H Development Team
