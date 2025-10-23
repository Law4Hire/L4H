export class TranslationValidator {
    constructor() {
        Object.defineProperty(this, "defaultOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                checkInterpolation: true,
                checkCompleteness: true,
                checkConsistency: true,
                maxTextLength: 500,
                requiredKeys: ['common.loading', 'common.error', 'common.retry'],
                allowedInterpolationParams: ['count', 'name', 'value', 'date', 'time']
            }
        });
    }
    /**
     * Validate translation completeness against a reference language
     */
    validateCompleteness(targetTranslations, referenceTranslations, language, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const errors = [];
        const warnings = [];
        const referenceKeys = this.flattenTranslationKeys(referenceTranslations);
        const targetKeys = this.flattenTranslationKeys(targetTranslations);
        const missingKeys = referenceKeys.filter(key => !targetKeys.includes(key));
        const extraKeys = targetKeys.filter(key => !referenceKeys.includes(key));
        // Check for missing keys
        missingKeys.forEach(key => {
            const isRequired = opts.requiredKeys?.includes(key);
            errors.push({
                type: 'missing_key',
                key,
                message: `Missing translation for key: ${key}`,
                severity: isRequired ? 'error' : 'warning'
            });
        });
        // Check for empty values
        const emptyKeys = this.findEmptyKeys(targetTranslations);
        emptyKeys.forEach(key => {
            errors.push({
                type: 'empty_value',
                key,
                message: `Empty translation value for key: ${key}`,
                severity: 'warning'
            });
        });
        // Check interpolation if enabled
        if (opts.checkInterpolation) {
            const interpolationErrors = this.validateInterpolation(targetTranslations, referenceTranslations, opts.allowedInterpolationParams || []);
            errors.push(...interpolationErrors);
        }
        // Check consistency if enabled
        if (opts.checkConsistency) {
            const consistencyWarnings = this.validateConsistency(targetTranslations, opts);
            warnings.push(...consistencyWarnings);
        }
        const completeness = referenceKeys.length > 0
            ? ((referenceKeys.length - missingKeys.length) / referenceKeys.length) * 100
            : 100;
        return {
            isValid: errors.filter(e => e.severity === 'error').length === 0,
            errors,
            warnings,
            completeness,
            missingKeys,
            extraKeys
        };
    }
    /**
     * Generate completeness report for a language
     */
    generateCompletenessReport(translations, referenceTranslations, language) {
        const referenceKeys = this.flattenTranslationKeys(referenceTranslations);
        const translationKeys = this.flattenTranslationKeys(translations);
        const emptyKeys = this.findEmptyKeys(translations);
        const missingKeys = referenceKeys.filter(key => !translationKeys.includes(key));
        const translatedKeys = referenceKeys.length - missingKeys.length - emptyKeys.length;
        const completeness = referenceKeys.length > 0
            ? (translatedKeys / referenceKeys.length) * 100
            : 100;
        return {
            language,
            totalKeys: referenceKeys.length,
            translatedKeys,
            missingKeys,
            emptyKeys,
            completeness,
            lastUpdated: new Date()
        };
    }
    /**
     * Generate missing keys report across multiple languages
     */
    generateMissingKeysReport(translationsByLanguage, referenceLanguage = 'en-US') {
        const referenceTranslations = translationsByLanguage[referenceLanguage];
        if (!referenceTranslations) {
            throw new Error(`Reference language ${referenceLanguage} not found`);
        }
        const referenceKeys = this.flattenTranslationKeys(referenceTranslations);
        const report = {};
        Object.entries(translationsByLanguage).forEach(([language, translations]) => {
            if (language === referenceLanguage)
                return;
            const translationKeys = this.flattenTranslationKeys(translations);
            const missingKeys = referenceKeys.filter(key => !translationKeys.includes(key));
            report[language] = {
                missingKeys,
                count: missingKeys.length,
                percentage: referenceKeys.length > 0
                    ? (missingKeys.length / referenceKeys.length) * 100
                    : 0
            };
        });
        return report;
    }
    /**
     * Validate interpolation parameters
     */
    validateInterpolation(translations, referenceTranslations, allowedParams) {
        const errors = [];
        const flatTranslations = this.flattenTranslations(translations);
        const flatReference = this.flattenTranslations(referenceTranslations);
        Object.entries(flatTranslations).forEach(([key, value]) => {
            if (typeof value !== 'string')
                return;
            // Find interpolation parameters in the translation
            const translationParams = this.extractInterpolationParams(value);
            const referenceValue = flatReference[key];
            const referenceParams = referenceValue && typeof referenceValue === 'string'
                ? this.extractInterpolationParams(referenceValue)
                : [];
            // Check for missing parameters
            referenceParams.forEach(param => {
                if (!translationParams.includes(param)) {
                    errors.push({
                        type: 'invalid_interpolation',
                        key,
                        message: `Missing interpolation parameter: {{${param}}}`,
                        severity: 'error'
                    });
                }
            });
            // Check for extra parameters
            translationParams.forEach(param => {
                if (!referenceParams.includes(param) && !allowedParams.includes(param)) {
                    errors.push({
                        type: 'invalid_interpolation',
                        key,
                        message: `Unknown interpolation parameter: {{${param}}}`,
                        severity: 'warning'
                    });
                }
            });
        });
        return errors;
    }
    /**
     * Validate translation consistency
     */
    validateConsistency(translations, options) {
        const warnings = [];
        const flatTranslations = this.flattenTranslations(translations);
        Object.entries(flatTranslations).forEach(([key, value]) => {
            if (typeof value !== 'string')
                return;
            // Check text length
            if (options.maxTextLength && value.length > options.maxTextLength) {
                warnings.push({
                    type: 'long_text',
                    key,
                    message: `Text is too long (${value.length} > ${options.maxTextLength} characters)`,
                    suggestion: 'Consider shortening the text or splitting into multiple keys'
                });
            }
            // Check for inconsistent casing in keys
            if (this.hasInconsistentCasing(key)) {
                warnings.push({
                    type: 'inconsistent_casing',
                    key,
                    message: 'Key uses inconsistent casing convention',
                    suggestion: 'Use consistent camelCase or snake_case'
                });
            }
            // Check for special characters that might cause issues
            if (this.hasProblematicCharacters(value)) {
                warnings.push({
                    type: 'special_characters',
                    key,
                    message: 'Translation contains potentially problematic characters',
                    suggestion: 'Review special characters for compatibility'
                });
            }
        });
        return warnings;
    }
    /**
     * Check if translation key exists and is not empty
     */
    hasValidTranslation(translations, key) {
        const value = this.getNestedValue(translations, key);
        return value !== undefined && value !== null && value !== '';
    }
    /**
     * Get translation statistics
     */
    getTranslationStats(translations) {
        const flatTranslations = this.flattenTranslations(translations);
        const values = Object.values(flatTranslations).filter(v => typeof v === 'string');
        const keys = Object.keys(flatTranslations);
        const emptyKeys = values.filter(v => v === '').length;
        const averageLength = values.length > 0
            ? values.reduce((sum, v) => sum + v.length, 0) / values.length
            : 0;
        const longestKey = keys.reduce((longest, key) => flatTranslations[key] && typeof flatTranslations[key] === 'string' &&
            flatTranslations[key].length > (flatTranslations[longest] || '').length
            ? key
            : longest, keys[0] || '');
        const shortestKey = keys.reduce((shortest, key) => flatTranslations[key] && typeof flatTranslations[key] === 'string' &&
            flatTranslations[key].length < (flatTranslations[shortest] || 'x'.repeat(1000)).length
            ? key
            : shortest, keys[0] || '');
        return {
            totalKeys: keys.length,
            emptyKeys,
            averageLength,
            longestKey,
            shortestKey
        };
    }
    flattenTranslationKeys(obj, prefix = '') {
        const keys = [];
        Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                keys.push(...this.flattenTranslationKeys(value, fullKey));
            }
            else {
                keys.push(fullKey);
            }
        });
        return keys;
    }
    flattenTranslations(obj, prefix = '') {
        const flattened = {};
        Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                Object.assign(flattened, this.flattenTranslations(value, fullKey));
            }
            else {
                flattened[fullKey] = value;
            }
        });
        return flattened;
    }
    findEmptyKeys(obj, prefix = '') {
        const emptyKeys = [];
        Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                emptyKeys.push(...this.findEmptyKeys(value, fullKey));
            }
            else if (value === '' || value === null || value === undefined) {
                emptyKeys.push(fullKey);
            }
        });
        return emptyKeys;
    }
    extractInterpolationParams(text) {
        const matches = text.match(/\{\{([^}]+)\}\}/g);
        if (!matches)
            return [];
        return matches.map(match => {
            const param = match.replace(/\{\{|\}\}/g, '').trim();
            // Handle complex interpolation like {{count, number}} -> count
            return param.split(',')[0].trim();
        });
    }
    getNestedValue(obj, key) {
        return key.split('.').reduce((current, part) => {
            return current && typeof current === 'object' ? current[part] : undefined;
        }, obj);
    }
    hasInconsistentCasing(key) {
        const parts = key.split('.');
        const hasCamelCase = parts.some(part => /[a-z][A-Z]/.test(part));
        const hasSnakeCase = parts.some(part => part.includes('_'));
        const hasKebabCase = parts.some(part => part.includes('-'));
        // Inconsistent if using multiple casing styles
        return [hasCamelCase, hasSnakeCase, hasKebabCase].filter(Boolean).length > 1;
    }
    hasProblematicCharacters(text) {
        // Check for characters that might cause issues in different contexts
        const problematicChars = /[<>{}[\]\\`]/;
        return problematicChars.test(text);
    }
}
// Global instance for use across the application
export const translationValidator = new TranslationValidator();
