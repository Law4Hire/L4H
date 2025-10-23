import React from 'react';
interface TestResult {
    language: string;
    success: boolean;
    loadTime: number;
    errors: string[];
    translationSamples: Record<string, string>;
    rtlDetected: boolean;
    directionApplied: boolean;
}
interface LanguageSwitchingTestProps {
    onTestComplete?: (results: TestResult[]) => void;
    autoTest?: boolean;
    testDelay?: number;
    className?: string;
}
export declare const LanguageSwitchingTest: React.FC<LanguageSwitchingTestProps>;
export default LanguageSwitchingTest;
