export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    completeness: number;
    missingKeys: string[];
    extraKeys: string[];
}
export interface ValidationError {
    type: 'missing_key' | 'invalid_interpolation' | 'empty_value' | 'invalid_format';
    key: string;
    message: string;
    severity: 'error' | 'warning';
}
export interface ValidationWarning {
    type: 'unused_key' | 'inconsistent_casing' | 'long_text' | 'special_characters';
    key: string;
    message: string;
    suggestion?: string;
}
export interface TranslationData {
    [key: string]: string | TranslationData;
}
export interface ValidationOptions {
    checkInterpolation?: boolean;
    checkCompleteness?: boolean;
    checkConsistency?: boolean;
    maxTextLength?: number;
    requiredKeys?: string[];
    allowedInterpolationParams?: string[];
}
export interface CompletenessReport {
    language: string;
    totalKeys: number;
    translatedKeys: number;
    missingKeys: string[];
    emptyKeys: string[];
    completeness: number;
    lastUpdated: Date;
}
export interface MissingKeysReport {
    [language: string]: {
        missingKeys: string[];
        count: number;
        percentage: number;
    };
}
export declare class TranslationValidator {
    private readonly defaultOptions;
    /**
     * Validate translation completeness against a reference language
     */
    validateCompleteness(targetTranslations: TranslationData, referenceTranslations: TranslationData, language: string, options?: Partial<ValidationOptions>): ValidationResult;
    /**
     * Generate completeness report for a language
     */
    generateCompletenessReport(translations: TranslationData, referenceTranslations: TranslationData, language: string): CompletenessReport;
    /**
     * Generate missing keys report across multiple languages
     */
    generateMissingKeysReport(translationsByLanguage: {
        [language: string]: TranslationData;
    }, referenceLanguage?: string): MissingKeysReport;
    /**
     * Validate interpolation parameters
     */
    validateInterpolation(translations: TranslationData, referenceTranslations: TranslationData, allowedParams: string[]): ValidationError[];
    /**
     * Validate translation consistency
     */
    validateConsistency(translations: TranslationData, options: Partial<ValidationOptions>): ValidationWarning[];
    /**
     * Check if translation key exists and is not empty
     */
    hasValidTranslation(translations: TranslationData, key: string): boolean;
    /**
     * Get translation statistics
     */
    getTranslationStats(translations: TranslationData): {
        totalKeys: number;
        emptyKeys: number;
        averageLength: number;
        longestKey: string;
        shortestKey: string;
    };
    private flattenTranslationKeys;
    private flattenTranslations;
    private findEmptyKeys;
    private extractInterpolationParams;
    private getNestedValue;
    private hasInconsistentCasing;
    private hasProblematicCharacters;
}
export declare const translationValidator: TranslationValidator;
