#!/usr/bin/env node
interface ValidationSuite {
    completeness: any;
    consistency: any;
    interpolation: any;
}
interface CombinedReport {
    timestamp: string;
    summary: {
        totalIssues: number;
        criticalIssues: number;
        overallScore: number;
        completenessScore: number;
        consistencyScore: number;
        interpolationScore: number;
    };
    reports: ValidationSuite;
    prioritizedActions: string[];
    healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}
declare class TranslationValidationRunner {
    private workspaceRoot;
    constructor(workspaceRoot?: string);
    /**
     * Run all validation checks
     */
    runAllValidations(): Promise<CombinedReport>;
    /**
     * Generate a combined report from all validation results
     */
    private generateCombinedReport;
    /**
     * Calculate consistency score based on issues
     */
    private calculateConsistencyScore;
    /**
     * Calculate interpolation score based on issues
     */
    private calculateInterpolationScore;
    /**
     * Determine overall health status
     */
    private determineHealthStatus;
    /**
     * Generate prioritized action items
     */
    private generatePrioritizedActions;
    /**
     * Save combined report to file
     */
    saveCombinedReport(report: CombinedReport, outputPath?: string): Promise<string>;
    /**
     * Save individual reports
     */
    saveIndividualReports(results: ValidationSuite): Promise<void>;
    /**
     * Print comprehensive summary
     */
    printSummary(report: CombinedReport): void;
}
export { TranslationValidationRunner };
export type { CombinedReport };
