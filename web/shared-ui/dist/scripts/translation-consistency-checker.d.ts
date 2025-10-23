#!/usr/bin/env node
interface ConsistencyIssue {
    type: 'missing_key' | 'empty_value' | 'placeholder_mismatch' | 'length_variance' | 'format_inconsistency';
    severity: 'low' | 'medium' | 'high' | 'critical';
    key: string;
    namespace: string;
    language: string;
    description: string;
    suggestion?: string;
}
interface ConsistencyReport {
    timestamp: string;
    summary: {
        totalIssues: number;
        criticalIssues: number;
        highIssues: number;
        mediumIssues: number;
        lowIssues: number;
        languagesChecked: number;
        namespacesChecked: number;
    };
    issues: ConsistencyIssue[];
    languageStats: Record<string, {
        totalIssues: number;
        criticalIssues: number;
        completeness: number;
    }>;
    recommendations: string[];
}
declare class TranslationConsistencyChecker {
    private supportedLanguages;
    private baseLanguage;
    private workspaceRoot;
    private interpolationPattern;
    private rtlLanguages;
    constructor(workspaceRoot?: string);
    /**
     * Check consistency across all applications and languages
     */
    checkConsistency(): Promise<ConsistencyReport>;
    /**
     * Check consistency for a specific application
     */
    private checkApplicationConsistency;
    /**
     * Get all JSON files (namespaces) in a directory
     */
    private getNamespaces;
    /**
     * Load all translation files for a language
     */
    private loadAllTranslations;
    /**
     * Compare translations between base language and target language
     */
    private compareTranslations;
    /**
     * Compare a specific namespace between base and target language
     */
    private compareNamespace;
    /**
     * Check if interpolation placeholders match between base and target
     */
    private checkPlaceholderConsistency;
    /**
     * Check for significant length differences that might indicate issues
     */
    private checkLengthVariance;
    /**
     * Check for format consistency (capitalization, punctuation, etc.)
     */
    private checkFormatConsistency;
    /**
     * Flatten nested translation object to flat key-value pairs
     */
    private flattenTranslation;
    /**
     * Generate comprehensive consistency report
     */
    private generateConsistencyReport;
    /**
     * Generate actionable recommendations
     */
    private generateRecommendations;
    /**
     * Save consistency report to file
     */
    saveReport(report: ConsistencyReport, outputPath?: string): Promise<string>;
    /**
     * Print summary to console
     */
    printSummary(report: ConsistencyReport): void;
}
export { TranslationConsistencyChecker };
export type { ConsistencyIssue, ConsistencyReport };
