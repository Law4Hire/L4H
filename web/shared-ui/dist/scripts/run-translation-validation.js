#!/usr/bin/env node
import { TranslationCompletenessValidator } from './translation-completeness-validator';
import { TranslationConsistencyChecker } from './translation-consistency-checker';
import { InterpolationValidator } from './interpolation-validator';
import * as fs from 'fs';
import * as path from 'path';
class TranslationValidationRunner {
    constructor(workspaceRoot = process.cwd()) {
        Object.defineProperty(this, "workspaceRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Run all validation checks
     */
    async runAllValidations() {
        console.log('🚀 Starting comprehensive translation validation suite...');
        console.log('='.repeat(70));
        const results = {
            completeness: null,
            consistency: null,
            interpolation: null
        };
        try {
            // Run completeness validation
            console.log('\n1️⃣  Running completeness validation...');
            const completenessValidator = new TranslationCompletenessValidator(this.workspaceRoot);
            results.completeness = await completenessValidator.validateAll();
            console.log(`   ✅ Completeness check complete: ${results.completeness.summary.averageCompleteness}% average completeness`);
            // Run consistency validation
            console.log('\n2️⃣  Running consistency validation...');
            const consistencyChecker = new TranslationConsistencyChecker(this.workspaceRoot);
            results.consistency = await consistencyChecker.checkConsistency();
            console.log(`   ✅ Consistency check complete: ${results.consistency.summary.totalIssues} issues found`);
            // Run interpolation validation
            console.log('\n3️⃣  Running interpolation validation...');
            const interpolationValidator = new InterpolationValidator(this.workspaceRoot);
            results.interpolation = await interpolationValidator.validateInterpolation();
            console.log(`   ✅ Interpolation check complete: ${results.interpolation.summary.totalIssues} issues found`);
        }
        catch (error) {
            console.error('❌ Validation suite failed:', error);
            throw error;
        }
        return this.generateCombinedReport(results);
    }
    /**
     * Generate a combined report from all validation results
     */
    generateCombinedReport(results) {
        const totalIssues = (results.consistency?.summary.totalIssues || 0) +
            (results.interpolation?.summary.totalIssues || 0) +
            (results.completeness?.results?.filter((r) => r.completeness < 100).length || 0);
        const criticalIssues = (results.consistency?.summary.criticalIssues || 0) +
            (results.interpolation?.summary.criticalIssues || 0) +
            (results.completeness?.results?.filter((r) => r.completeness < 50).length || 0);
        // Calculate scores (0-100)
        const completenessScore = results.completeness?.summary.averageCompleteness || 0;
        const consistencyScore = this.calculateConsistencyScore(results.consistency);
        const interpolationScore = this.calculateInterpolationScore(results.interpolation);
        const overallScore = (completenessScore + consistencyScore + interpolationScore) / 3;
        // Determine health status
        const healthStatus = this.determineHealthStatus(overallScore, criticalIssues);
        // Generate prioritized actions
        const prioritizedActions = this.generatePrioritizedActions(results, criticalIssues);
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues,
                criticalIssues,
                overallScore: Math.round(overallScore * 100) / 100,
                completenessScore: Math.round(completenessScore * 100) / 100,
                consistencyScore: Math.round(consistencyScore * 100) / 100,
                interpolationScore: Math.round(interpolationScore * 100) / 100
            },
            reports: results,
            prioritizedActions,
            healthStatus
        };
    }
    /**
     * Calculate consistency score based on issues
     */
    calculateConsistencyScore(consistencyReport) {
        if (!consistencyReport)
            return 0;
        const totalPossibleIssues = consistencyReport.summary.languagesChecked * consistencyReport.summary.namespacesChecked * 10; // Rough estimate
        const actualIssues = consistencyReport.summary.totalIssues;
        const criticalWeight = consistencyReport.summary.criticalIssues * 3;
        const highWeight = consistencyReport.summary.highIssues * 2;
        const weightedIssues = actualIssues + criticalWeight + highWeight;
        const score = Math.max(0, 100 - (weightedIssues / totalPossibleIssues * 100));
        return Math.min(100, score);
    }
    /**
     * Calculate interpolation score based on issues
     */
    calculateInterpolationScore(interpolationReport) {
        if (!interpolationReport)
            return 0;
        const totalKeys = interpolationReport.summary.keysChecked;
        if (totalKeys === 0)
            return 100;
        const criticalWeight = interpolationReport.summary.criticalIssues * 5;
        const highWeight = interpolationReport.summary.highIssues * 3;
        const mediumWeight = interpolationReport.summary.mediumIssues * 2;
        const lowWeight = interpolationReport.summary.lowIssues * 1;
        const weightedIssues = criticalWeight + highWeight + mediumWeight + lowWeight;
        const score = Math.max(0, 100 - (weightedIssues / totalKeys * 10));
        return Math.min(100, score);
    }
    /**
     * Determine overall health status
     */
    determineHealthStatus(overallScore, criticalIssues) {
        if (criticalIssues > 10)
            return 'critical';
        if (overallScore >= 90)
            return 'excellent';
        if (overallScore >= 75)
            return 'good';
        if (overallScore >= 60)
            return 'fair';
        if (overallScore >= 40)
            return 'poor';
        return 'critical';
    }
    /**
     * Generate prioritized action items
     */
    generatePrioritizedActions(results, criticalIssues) {
        const actions = [];
        // Critical issues first
        if (criticalIssues > 0) {
            actions.push(`🚨 URGENT: Address ${criticalIssues} critical issues immediately`);
        }
        // Interpolation critical issues
        if (results.interpolation?.summary.criticalIssues > 0) {
            actions.push(`🔧 Fix ${results.interpolation.summary.criticalIssues} critical interpolation errors (missing/malformed placeholders)`);
        }
        // Consistency critical issues
        if (results.consistency?.summary.criticalIssues > 0) {
            actions.push(`📝 Fix ${results.consistency.summary.criticalIssues} critical consistency issues (placeholder mismatches)`);
        }
        // Low completeness languages
        if (results.completeness?.results) {
            const incompleteLanguages = results.completeness.results
                .filter((r) => r.completeness < 80)
                .map((r) => r.language);
            const uniqueLanguages = [...new Set(incompleteLanguages)];
            if (uniqueLanguages.length > 0) {
                actions.push(`📚 Complete translations for languages below 80%: ${uniqueLanguages.slice(0, 5).join(', ')}`);
            }
        }
        // High-impact consistency issues
        if (results.consistency?.summary.highIssues > 10) {
            actions.push(`🔍 Review ${results.consistency.summary.highIssues} high-priority consistency issues`);
        }
        // Interpolation high issues
        if (results.interpolation?.summary.highIssues > 5) {
            actions.push(`⚙️  Fix ${results.interpolation.summary.highIssues} high-priority interpolation issues`);
        }
        // General recommendations
        if (results.completeness?.summary.averageCompleteness < 90) {
            actions.push(`📈 Improve overall translation completeness from ${results.completeness.summary.averageCompleteness}% to 95%+`);
        }
        // Add specific recommendations from individual reports
        if (results.completeness?.recommendations) {
            actions.push(...results.completeness.recommendations.slice(0, 2).map((r) => `📋 ${r}`));
        }
        if (results.consistency?.recommendations) {
            actions.push(...results.consistency.recommendations.slice(0, 2).map((r) => `🔄 ${r}`));
        }
        if (results.interpolation?.recommendations) {
            actions.push(...results.interpolation.recommendations.slice(0, 2).map((r) => `🛠️  ${r}`));
        }
        return actions.slice(0, 15); // Limit to top 15 actions
    }
    /**
     * Save combined report to file
     */
    async saveCombinedReport(report, outputPath) {
        const defaultPath = path.join(this.workspaceRoot, 'translation-validation-report.json');
        const filePath = outputPath || defaultPath;
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
        console.log(`\n📊 Combined report saved to: ${filePath}`);
        return filePath;
    }
    /**
     * Save individual reports
     */
    async saveIndividualReports(results) {
        const reportsDir = path.join(this.workspaceRoot, 'translation-reports');
        // Create reports directory if it doesn't exist
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        // Save individual reports
        if (results.completeness) {
            const completenessPath = path.join(reportsDir, 'completeness-report.json');
            fs.writeFileSync(completenessPath, JSON.stringify(results.completeness, null, 2));
            console.log(`   📋 Completeness report: ${completenessPath}`);
        }
        if (results.consistency) {
            const consistencyPath = path.join(reportsDir, 'consistency-report.json');
            fs.writeFileSync(consistencyPath, JSON.stringify(results.consistency, null, 2));
            console.log(`   🔍 Consistency report: ${consistencyPath}`);
        }
        if (results.interpolation) {
            const interpolationPath = path.join(reportsDir, 'interpolation-report.json');
            fs.writeFileSync(interpolationPath, JSON.stringify(results.interpolation, null, 2));
            console.log(`   🔧 Interpolation report: ${interpolationPath}`);
        }
    }
    /**
     * Print comprehensive summary
     */
    printSummary(report) {
        console.log('\n' + '='.repeat(70));
        console.log('🎯 COMPREHENSIVE TRANSLATION VALIDATION SUMMARY');
        console.log('='.repeat(70));
        // Health status with emoji
        const statusEmoji = {
            excellent: '🟢',
            good: '🟡',
            fair: '🟠',
            poor: '🔴',
            critical: '🚨'
        };
        console.log(`\n${statusEmoji[report.healthStatus]} Overall Health: ${report.healthStatus.toUpperCase()}`);
        console.log(`📊 Overall Score: ${report.summary.overallScore}/100`);
        console.log(`\n📈 Detailed Scores:`);
        console.log(`   Completeness: ${report.summary.completenessScore}/100`);
        console.log(`   Consistency: ${report.summary.consistencyScore}/100`);
        console.log(`   Interpolation: ${report.summary.interpolationScore}/100`);
        console.log(`\n⚠️  Issue Summary:`);
        console.log(`   Total Issues: ${report.summary.totalIssues}`);
        console.log(`   Critical Issues: ${report.summary.criticalIssues}`);
        // Show prioritized actions
        if (report.prioritizedActions.length > 0) {
            console.log(`\n🎯 Prioritized Actions (Top 10):`);
            report.prioritizedActions.slice(0, 10).forEach((action, index) => {
                console.log(`   ${index + 1}. ${action}`);
            });
        }
        // Show quick stats from individual reports
        if (report.reports.completeness) {
            console.log(`\n📚 Completeness Details:`);
            console.log(`   Languages: ${report.reports.completeness.summary.totalLanguages}`);
            console.log(`   Namespaces: ${report.reports.completeness.summary.totalNamespaces}`);
            console.log(`   Average Completeness: ${report.reports.completeness.summary.averageCompleteness}%`);
        }
        if (report.reports.consistency) {
            console.log(`\n🔍 Consistency Details:`);
            console.log(`   Total Issues: ${report.reports.consistency.summary.totalIssues}`);
            console.log(`   Critical: ${report.reports.consistency.summary.criticalIssues}`);
            console.log(`   High: ${report.reports.consistency.summary.highIssues}`);
        }
        if (report.reports.interpolation) {
            console.log(`\n🔧 Interpolation Details:`);
            console.log(`   Total Issues: ${report.reports.interpolation.summary.totalIssues}`);
            console.log(`   Critical: ${report.reports.interpolation.summary.criticalIssues}`);
            console.log(`   Keys Checked: ${report.reports.interpolation.summary.keysChecked}`);
        }
        console.log('\n' + '='.repeat(70));
        // Final recommendation based on health status
        switch (report.healthStatus) {
            case 'critical':
                console.log('🚨 IMMEDIATE ACTION REQUIRED: Critical translation issues detected!');
                break;
            case 'poor':
                console.log('🔴 HIGH PRIORITY: Significant translation improvements needed.');
                break;
            case 'fair':
                console.log('🟠 MODERATE PRIORITY: Several translation issues to address.');
                break;
            case 'good':
                console.log('🟡 LOW PRIORITY: Minor translation improvements recommended.');
                break;
            case 'excellent':
                console.log('🟢 EXCELLENT: Translation system is in great shape!');
                break;
        }
        console.log('='.repeat(70));
    }
}
// CLI execution
if (require.main === module) {
    const runner = new TranslationValidationRunner();
    runner.runAllValidations()
        .then(report => {
        runner.printSummary(report);
        return Promise.all([
            runner.saveCombinedReport(report),
            runner.saveIndividualReports(report.reports)
        ]);
    })
        .then(([combinedPath]) => {
        console.log(`\n✅ Comprehensive validation complete!`);
        console.log(`📊 Main report: ${combinedPath}`);
        console.log(`📁 Individual reports saved to: translation-reports/`);
        process.exit(0);
    })
        .catch(error => {
        console.error('❌ Validation suite failed:', error);
        process.exit(1);
    });
}
export { TranslationValidationRunner };
