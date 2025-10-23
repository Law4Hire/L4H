#!/usr/bin/env node
/**
 * Language Switching Test Script
 *
 * This script can be run to test language switching functionality
 * from the command line or integrated into CI/CD pipelines.
 */
import { SUPPORTED_LANGUAGES, CULTURE_NAMES } from '../i18n-config';
class LanguageSwitchingTestRunner {
    constructor(baseUrl = 'http://localhost:5173') {
        Object.defineProperty(this, "results", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.baseUrl = baseUrl;
    }
    async runTests() {
        console.log('🌐 Starting Language Switching Tests...');
        console.log(`📍 Base URL: ${this.baseUrl}`);
        console.log(`🔢 Testing ${SUPPORTED_LANGUAGES.length} languages`);
        console.log('');
        for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
            const language = SUPPORTED_LANGUAGES[i];
            const progress = Math.round(((i + 1) / SUPPORTED_LANGUAGES.length) * 100);
            console.log(`[${progress}%] Testing ${language} (${CULTURE_NAMES[language] || language})...`);
            const result = await this.testLanguage(language);
            this.results.push(result);
            if (result.success) {
                console.log(`  ✅ Success (${result.loadTime}ms)`);
            }
            else {
                console.log(`  ❌ Failed (${result.loadTime}ms)`);
                result.errors.forEach(error => console.log(`     - ${error}`));
            }
        }
        console.log('');
        this.printSummary();
        return this.results;
    }
    async testLanguage(language) {
        const startTime = Date.now();
        const errors = [];
        const translationSamples = {};
        try {
            // Test translation file loading
            const testPaths = [
                `/locales/shared/${language}/common.json`,
                `/locales/shared/${language}/errors.json`,
                `/locales/l4h/${language}/interview.json`,
                `/locales/cannlaw/${language}/legal.json`,
            ];
            for (const path of testPaths) {
                try {
                    const response = await fetch(`${this.baseUrl}${path}`);
                    if (!response.ok) {
                        if (response.status === 404) {
                            errors.push(`Translation file not found: ${path}`);
                        }
                        else {
                            errors.push(`Failed to load ${path}: HTTP ${response.status}`);
                        }
                        continue;
                    }
                    const data = await response.json();
                    // Sample some translations
                    if (path.includes('common.json')) {
                        if (data.welcome)
                            translationSamples['common.welcome'] = data.welcome;
                        if (data.loading)
                            translationSamples['common.loading'] = data.loading;
                        if (data.error)
                            translationSamples['common.error'] = data.error;
                    }
                    if (path.includes('errors.json')) {
                        if (data.network_error)
                            translationSamples['errors.network_error'] = data.network_error;
                    }
                }
                catch (error) {
                    errors.push(`Error loading ${path}: ${error}`);
                }
            }
            // Test language-specific formatting
            try {
                const testNumber = 1234.56;
                const testDate = new Date('2024-01-15');
                // Test number formatting
                const numberFormatter = new Intl.NumberFormat(language);
                translationSamples['format.number'] = numberFormatter.format(testNumber);
                // Test date formatting
                const dateFormatter = new Intl.DateTimeFormat(language);
                translationSamples['format.date'] = dateFormatter.format(testDate);
                // Test currency formatting
                const currencyFormatter = new Intl.NumberFormat(language, {
                    style: 'currency',
                    currency: 'USD'
                });
                translationSamples['format.currency'] = currencyFormatter.format(testNumber);
            }
            catch (error) {
                errors.push(`Formatting error: ${error}`);
            }
            const loadTime = Date.now() - startTime;
            return {
                language,
                success: errors.length === 0,
                loadTime,
                errors,
                translationSamples,
            };
        }
        catch (error) {
            const loadTime = Date.now() - startTime;
            return {
                language,
                success: false,
                loadTime,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                translationSamples: {},
            };
        }
    }
    printSummary() {
        const successCount = this.results.filter(r => r.success).length;
        const totalCount = this.results.length;
        const successRate = totalCount > 0 ? (successCount / totalCount * 100).toFixed(1) : '0';
        const averageLoadTime = totalCount > 0
            ? Math.round(this.results.reduce((sum, r) => sum + r.loadTime, 0) / totalCount)
            : 0;
        console.log('📊 Test Summary:');
        console.log(`   Success Rate: ${successRate}% (${successCount}/${totalCount})`);
        console.log(`   Average Load Time: ${averageLoadTime}ms`);
        console.log('');
        const failedLanguages = this.results.filter(r => !r.success);
        if (failedLanguages.length > 0) {
            console.log('❌ Failed Languages:');
            failedLanguages.forEach(result => {
                console.log(`   ${result.language}: ${result.errors.join(', ')}`);
            });
            console.log('');
        }
        const slowLanguages = this.results.filter(r => r.loadTime > 3000);
        if (slowLanguages.length > 0) {
            console.log('🐌 Slow Loading Languages (>3s):');
            slowLanguages.forEach(result => {
                console.log(`   ${result.language}: ${result.loadTime}ms`);
            });
            console.log('');
        }
        // RTL languages summary
        const rtlLanguages = ['ar-SA', 'ur-PK'];
        const rtlResults = this.results.filter(r => rtlLanguages.includes(r.language));
        const rtlSuccess = rtlResults.filter(r => r.success).length;
        console.log(`🔄 RTL Languages: ${rtlSuccess}/${rtlResults.length} successful`);
        console.log('');
        if (successCount === totalCount) {
            console.log('🎉 All language tests passed!');
        }
        else {
            console.log(`⚠️  ${totalCount - successCount} language tests failed.`);
        }
    }
    exportResults(filename) {
        const fs = require('fs');
        const path = require('path');
        const exportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalLanguages: this.results.length,
                successfulLanguages: this.results.filter(r => r.success).length,
                averageLoadTime: this.results.length > 0
                    ? Math.round(this.results.reduce((sum, r) => sum + r.loadTime, 0) / this.results.length)
                    : 0,
            },
            results: this.results,
        };
        const outputFile = filename || `language-test-results-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
        console.log(`📄 Results exported to: ${outputFile}`);
    }
}
// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const baseUrl = args[0] || 'http://localhost:5173';
    const exportFile = args[1];
    const runner = new LanguageSwitchingTestRunner(baseUrl);
    runner.runTests()
        .then(results => {
        if (exportFile) {
            runner.exportResults(exportFile);
        }
        const successCount = results.filter(r => r.success).length;
        const exitCode = successCount === results.length ? 0 : 1;
        process.exit(exitCode);
    })
        .catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}
export { LanguageSwitchingTestRunner };
