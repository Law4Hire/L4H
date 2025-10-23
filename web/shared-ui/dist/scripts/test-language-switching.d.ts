#!/usr/bin/env node
/**
 * Language Switching Test Script
 *
 * This script can be run to test language switching functionality
 * from the command line or integrated into CI/CD pipelines.
 */
interface TestResult {
    language: string;
    success: boolean;
    loadTime: number;
    errors: string[];
    translationSamples: Record<string, string>;
}
declare class LanguageSwitchingTestRunner {
    private results;
    private baseUrl;
    constructor(baseUrl?: string);
    runTests(): Promise<TestResult[]>;
    private testLanguage;
    private printSummary;
    exportResults(filename?: string): void;
}
export { LanguageSwitchingTestRunner };
export type { TestResult };
