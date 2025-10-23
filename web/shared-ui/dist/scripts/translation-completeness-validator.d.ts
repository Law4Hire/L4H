#!/usr/bin/env node
interface ValidationResult {
    language: string;
    namespace: string;
    filePath: string;
    completeness: number;
    missingKeys: string[];
    extraKeys: string[];
    interpolationErrors: string[];
    totalKeys: number;
    validKeys: number;
}
interface CompletenessReport {
    timestamp: string;
    summary: {
        totalLanguages: number;
        totalNamespaces: number;
        averageCompleteness: number;
        criticalIssues: number;
    };
    results: ValidationResult[];
    recommendations: string[];
}
declare class TranslationCompletenessValidator {
    private supportedLanguages;
    private baseLanguage;
    private interpolationPattern;
    private workspaceRoot;
    constructor(workspaceRoot?: string);
    /**
     * Validate translation completeness across all applications
     */
    validateAll(): Promise<CompletenessReport>;
    /**
     * Validate translations for a specific application
     */
    private validateApplication;
    /**
     * Get all available namespaces (JSON files) in a directory
     */
    private getNamespaces;
    /**
     * Load all namespace translations for a language
     */
    private loadNamespaceTranslations;
    /**
     * Validate a specific namespace for a language
     */
    private validateNamespace;
    /**
     * Flatten nested translation object to array of dot-notation keys
     */
    private flattenKeys;
    /**
     * Validate interpolation placeholders match between base and target translations
     */
    private validateInterpolation;
    /**
     * Flatten nested translation object to flat key-value pairs
     */
    private flattenTranslation;
    /**
     * Generate comprehensive validation report
     */
    private generateReport;
    /**
     * Generate actionable recommendations based on validation results
     */
    private generateRecommendations;
    /**
     * Save validation report to file
     */
    saveReport(report: CompletenessReport, outputPath?: string): Promise<string>;
    /**
     * Print summary to console
     */
    printSummary(report: CompletenessReport): void;
}
export { TranslationCompletenessValidator };
export type { ValidationResult, CompletenessReport };
