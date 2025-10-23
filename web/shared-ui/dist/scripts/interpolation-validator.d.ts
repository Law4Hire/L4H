#!/usr/bin/env node
interface InterpolationIssue {
    type: 'missing_placeholder' | 'extra_placeholder' | 'invalid_syntax' | 'unused_placeholder' | 'malformed_placeholder';
    severity: 'low' | 'medium' | 'high' | 'critical';
    key: string;
    namespace: string;
    language: string;
    baseValue: string;
    targetValue: string;
    expectedPlaceholders: string[];
    foundPlaceholders: string[];
    description: string;
    suggestion: string;
}
interface InterpolationReport {
    timestamp: string;
    summary: {
        totalIssues: number;
        criticalIssues: number;
        highIssues: number;
        mediumIssues: number;
        lowIssues: number;
        keysChecked: number;
        languagesChecked: number;
    };
    issues: InterpolationIssue[];
    statistics: {
        byLanguage: Record<string, number>;
        byNamespace: Record<string, number>;
        byIssueType: Record<string, number>;
    };
    recommendations: string[];
}
declare class InterpolationValidator {
    private supportedLanguages;
    private baseLanguage;
    private workspaceRoot;
    private patterns;
    constructor(workspaceRoot?: string);
    /**
     * Validate interpolation across all applications
     */
    validateInterpolation(): Promise<InterpolationReport>;
    /**
     * Validate interpolation for a specific application
     */
    private validateApplicationInterpolation;
    /**
     * Get all JSON files (namespaces) in a directory
     */
    private getNamespaces;
    /**
     * Load all translation files for a language
     */
    private loadAllTranslations;
    /**
     * Validate interpolation for a specific language
     */
    private validateLanguageInterpolation;
    /**
     * Validate interpolation for a specific namespace
     */
    private validateNamespaceInterpolation;
    /**
     * Extract all types of placeholders from a string
     */
    private extractAllPlaceholders;
    /**
     * Validate placeholder consistency between base and target
     */
    private validatePlaceholders;
    /**
     * Validate interpolation syntax
     */
    private validateSyntax;
    /**
     * Flatten nested translation object to flat key-value pairs
     */
    private flattenTranslation;
    /**
     * Generate comprehensive interpolation report
     */
    private generateInterpolationReport;
    /**
     * Generate actionable recommendations
     */
    private generateRecommendations;
    /**
     * Save interpolation report to file
     */
    saveReport(report: InterpolationReport, outputPath?: string): Promise<string>;
    /**
     * Print summary to console
     */
    printSummary(report: InterpolationReport): void;
}
export { InterpolationValidator };
export type { InterpolationIssue, InterpolationReport };
