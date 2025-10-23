#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
class InterpolationValidator {
    constructor(workspaceRoot = process.cwd()) {
        Object.defineProperty(this, "supportedLanguages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                'ar-SA', 'bn-BD', 'de-DE', 'en-US', 'es-ES', 'fr-FR', 'hi-IN',
                'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR',
                'ru-RU', 'ta-IN', 'te-IN', 'tl-PH', 'tr-TR', 'ur-PK', 'vi-VN', 'zh-CN'
            ]
        });
        Object.defineProperty(this, "baseLanguage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'en-US'
        });
        Object.defineProperty(this, "workspaceRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Different interpolation patterns supported by i18next
        Object.defineProperty(this, "patterns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                standard: /\{\{([^}]+)\}\}/g, // {{variable}}
                nesting: /\$t\(([^)]+)\)/g, // $t(key)
                formatting: /\{\{([^}]+),\s*([^}]+)\}\}/g, // {{variable, format}}
                plural: /\{\{([^}]+)_\d+\}\}/g, // {{variable_0}}, {{variable_1}}
                context: /\{\{([^}]+)_[^}]+\}\}/g // {{variable_context}}
            }
        });
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Validate interpolation across all applications
     */
    async validateInterpolation() {
        console.log('🔍 Starting interpolation validation...');
        const issues = [];
        const applications = [
            { name: 'shared-ui', path: 'web/shared-ui/public/locales/shared' },
            { name: 'l4h', path: 'web/l4h/public/locales/l4h' },
            { name: 'cannlaw', path: 'web/cannlaw/public/locales/cannlaw' }
        ];
        for (const app of applications) {
            console.log(`\n📁 Validating ${app.name} interpolation...`);
            const appIssues = await this.validateApplicationInterpolation(app.path, app.name);
            issues.push(...appIssues);
        }
        return this.generateInterpolationReport(issues);
    }
    /**
     * Validate interpolation for a specific application
     */
    async validateApplicationInterpolation(localesPath, appName) {
        const fullPath = path.join(this.workspaceRoot, localesPath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️  Locales path not found: ${fullPath}`);
            return [];
        }
        const issues = [];
        const baseLanguagePath = path.join(fullPath, this.baseLanguage);
        if (!fs.existsSync(baseLanguagePath)) {
            console.error(`❌ Base language (${this.baseLanguage}) not found in ${fullPath}`);
            return [];
        }
        // Get all namespaces
        const namespaces = this.getNamespaces(baseLanguagePath);
        console.log(`   Found ${namespaces.length} namespaces: ${namespaces.join(', ')}`);
        // Load base translations
        const baseTranslations = this.loadAllTranslations(baseLanguagePath, namespaces);
        // Validate each language
        for (const language of this.supportedLanguages) {
            const languagePath = path.join(fullPath, language);
            if (!fs.existsSync(languagePath)) {
                continue;
            }
            const languageTranslations = this.loadAllTranslations(languagePath, namespaces);
            const languageIssues = this.validateLanguageInterpolation(baseTranslations, languageTranslations, language, appName);
            issues.push(...languageIssues);
        }
        return issues;
    }
    /**
     * Get all JSON files (namespaces) in a directory
     */
    getNamespaces(languagePath) {
        try {
            const files = fs.readdirSync(languagePath);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''));
        }
        catch (error) {
            console.error(`Error reading namespaces from ${languagePath}:`, error);
            return [];
        }
    }
    /**
     * Load all translation files for a language
     */
    loadAllTranslations(languagePath, namespaces) {
        const translations = {};
        for (const namespace of namespaces) {
            const filePath = path.join(languagePath, `${namespace}.json`);
            try {
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    translations[namespace] = JSON.parse(content);
                }
                else {
                    translations[namespace] = {};
                }
            }
            catch (error) {
                console.error(`Error loading ${filePath}:`, error);
                translations[namespace] = {};
            }
        }
        return translations;
    }
    /**
     * Validate interpolation for a specific language
     */
    validateLanguageInterpolation(baseTranslations, targetTranslations, language, appName) {
        const issues = [];
        for (const [namespace, baseTranslation] of Object.entries(baseTranslations)) {
            const targetTranslation = targetTranslations[namespace] || {};
            const namespaceIssues = this.validateNamespaceInterpolation(baseTranslation, targetTranslation, namespace, language, appName);
            issues.push(...namespaceIssues);
        }
        return issues;
    }
    /**
     * Validate interpolation for a specific namespace
     */
    validateNamespaceInterpolation(baseTranslation, targetTranslation, namespace, language, appName) {
        const issues = [];
        const baseFlat = this.flattenTranslation(baseTranslation);
        const targetFlat = this.flattenTranslation(targetTranslation);
        for (const [key, baseValue] of Object.entries(baseFlat)) {
            const targetValue = targetFlat[key];
            const fullNamespace = `${appName}:${namespace}`;
            // Skip if target value doesn't exist
            if (!targetValue)
                continue;
            // Extract all placeholders from base and target
            const basePlaceholders = this.extractAllPlaceholders(baseValue);
            const targetPlaceholders = this.extractAllPlaceholders(targetValue);
            // Validate placeholder consistency
            const placeholderIssues = this.validatePlaceholders(basePlaceholders, targetPlaceholders, key, fullNamespace, language, baseValue, targetValue);
            issues.push(...placeholderIssues);
            // Validate syntax
            const syntaxIssues = this.validateSyntax(targetValue, key, fullNamespace, language, baseValue);
            issues.push(...syntaxIssues);
        }
        return issues;
    }
    /**
     * Extract all types of placeholders from a string
     */
    extractAllPlaceholders(text) {
        const result = {
            standard: [],
            nesting: [],
            formatting: [],
            plural: [],
            context: [],
            all: []
        };
        // Extract standard placeholders {{variable}}
        let matches = text.match(this.patterns.standard);
        if (matches) {
            result.standard = matches.map(match => match.replace(/[{}]/g, ''));
            result.all.push(...result.standard);
        }
        // Extract nesting placeholders $t(key)
        matches = text.match(this.patterns.nesting);
        if (matches) {
            result.nesting = matches.map(match => match.replace(/\$t\(|\)/g, ''));
            result.all.push(...result.nesting);
        }
        // Extract formatting placeholders {{variable, format}}
        matches = text.match(this.patterns.formatting);
        if (matches) {
            result.formatting = matches.map(match => match.replace(/[{}]/g, ''));
            result.all.push(...result.formatting);
        }
        // Extract plural placeholders {{variable_0}}
        matches = text.match(this.patterns.plural);
        if (matches) {
            result.plural = matches.map(match => match.replace(/[{}]/g, ''));
            result.all.push(...result.plural);
        }
        // Extract context placeholders {{variable_context}}
        matches = text.match(this.patterns.context);
        if (matches) {
            result.context = matches.map(match => match.replace(/[{}]/g, ''));
            result.all.push(...result.context);
        }
        return result;
    }
    /**
     * Validate placeholder consistency between base and target
     */
    validatePlaceholders(basePlaceholders, targetPlaceholders, key, namespace, language, baseValue, targetValue) {
        const issues = [];
        // Check for missing placeholders
        const missingPlaceholders = basePlaceholders.all.filter(placeholder => !targetPlaceholders.all.includes(placeholder));
        if (missingPlaceholders.length > 0) {
            issues.push({
                type: 'missing_placeholder',
                severity: 'critical',
                key,
                namespace,
                language,
                baseValue,
                targetValue,
                expectedPlaceholders: basePlaceholders.all,
                foundPlaceholders: targetPlaceholders.all,
                description: `Missing placeholders: ${missingPlaceholders.join(', ')}`,
                suggestion: `Add missing placeholders: ${missingPlaceholders.join(', ')}`
            });
        }
        // Check for extra placeholders
        const extraPlaceholders = targetPlaceholders.all.filter(placeholder => !basePlaceholders.all.includes(placeholder));
        if (extraPlaceholders.length > 0) {
            issues.push({
                type: 'extra_placeholder',
                severity: 'high',
                key,
                namespace,
                language,
                baseValue,
                targetValue,
                expectedPlaceholders: basePlaceholders.all,
                foundPlaceholders: targetPlaceholders.all,
                description: `Extra placeholders found: ${extraPlaceholders.join(', ')}`,
                suggestion: `Remove extra placeholders: ${extraPlaceholders.join(', ')}`
            });
        }
        return issues;
    }
    /**
     * Validate interpolation syntax
     */
    validateSyntax(text, key, namespace, language, baseValue) {
        const issues = [];
        // Check for malformed brackets
        const openBrackets = (text.match(/\{/g) || []).length;
        const closeBrackets = (text.match(/\}/g) || []).length;
        if (openBrackets !== closeBrackets) {
            issues.push({
                type: 'malformed_placeholder',
                severity: 'critical',
                key,
                namespace,
                language,
                baseValue,
                targetValue: text,
                expectedPlaceholders: [],
                foundPlaceholders: [],
                description: `Mismatched brackets: ${openBrackets} opening, ${closeBrackets} closing`,
                suggestion: 'Fix bracket syntax in placeholders'
            });
        }
        // Check for invalid placeholder syntax
        const invalidPlaceholders = text.match(/\{[^{]|[^}]\}/g);
        if (invalidPlaceholders) {
            issues.push({
                type: 'invalid_syntax',
                severity: 'high',
                key,
                namespace,
                language,
                baseValue,
                targetValue: text,
                expectedPlaceholders: [],
                foundPlaceholders: invalidPlaceholders,
                description: `Invalid placeholder syntax: ${invalidPlaceholders.join(', ')}`,
                suggestion: 'Use double brackets for placeholders: {{variable}}'
            });
        }
        // Check for empty placeholders
        const emptyPlaceholders = text.match(/\{\{\s*\}\}/g);
        if (emptyPlaceholders) {
            issues.push({
                type: 'malformed_placeholder',
                severity: 'medium',
                key,
                namespace,
                language,
                baseValue,
                targetValue: text,
                expectedPlaceholders: [],
                foundPlaceholders: emptyPlaceholders,
                description: `Empty placeholders found: ${emptyPlaceholders.join(', ')}`,
                suggestion: 'Remove empty placeholders or add variable names'
            });
        }
        return issues;
    }
    /**
     * Flatten nested translation object to flat key-value pairs
     */
    flattenTranslation(obj, prefix = '') {
        const flattened = {};
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                Object.assign(flattened, this.flattenTranslation(value, fullKey));
            }
            else if (typeof value === 'string') {
                flattened[fullKey] = value;
            }
        }
        return flattened;
    }
    /**
     * Generate comprehensive interpolation report
     */
    generateInterpolationReport(issues) {
        const criticalIssues = issues.filter(i => i.severity === 'critical').length;
        const highIssues = issues.filter(i => i.severity === 'high').length;
        const mediumIssues = issues.filter(i => i.severity === 'medium').length;
        const lowIssues = issues.filter(i => i.severity === 'low').length;
        const keysChecked = new Set(issues.map(i => i.key)).size;
        const languagesChecked = new Set(issues.map(i => i.language)).size;
        // Calculate statistics
        const byLanguage = {};
        const byNamespace = {};
        const byIssueType = {};
        issues.forEach(issue => {
            byLanguage[issue.language] = (byLanguage[issue.language] || 0) + 1;
            byNamespace[issue.namespace] = (byNamespace[issue.namespace] || 0) + 1;
            byIssueType[issue.type] = (byIssueType[issue.type] || 0) + 1;
        });
        const recommendations = this.generateRecommendations(issues, byLanguage, byIssueType);
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues: issues.length,
                criticalIssues,
                highIssues,
                mediumIssues,
                lowIssues,
                keysChecked,
                languagesChecked
            },
            issues: issues.sort((a, b) => {
                const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            }),
            statistics: {
                byLanguage,
                byNamespace,
                byIssueType
            },
            recommendations
        };
    }
    /**
     * Generate actionable recommendations
     */
    generateRecommendations(issues, byLanguage, byIssueType) {
        const recommendations = [];
        // Critical issues first
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
            recommendations.push(`URGENT: Fix ${criticalIssues.length} critical interpolation issues immediately`);
        }
        // Most problematic issue types
        const topIssueTypes = Object.entries(byIssueType)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
        if (topIssueTypes.length > 0) {
            recommendations.push(`Focus on these issue types: ${topIssueTypes.map(([type, count]) => `${type} (${count})`).join(', ')}`);
        }
        // Languages with most issues
        const problematicLanguages = Object.entries(byLanguage)
            .filter(([, count]) => count > 5)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([lang]) => lang);
        if (problematicLanguages.length > 0) {
            recommendations.push(`Review interpolation in these languages: ${problematicLanguages.join(', ')}`);
        }
        // Specific recommendations based on issue types
        if (byIssueType.missing_placeholder > 0) {
            recommendations.push(`Add missing placeholders in ${byIssueType.missing_placeholder} translations`);
        }
        if (byIssueType.malformed_placeholder > 0) {
            recommendations.push(`Fix malformed placeholder syntax in ${byIssueType.malformed_placeholder} translations`);
        }
        if (byIssueType.invalid_syntax > 0) {
            recommendations.push(`Correct invalid interpolation syntax in ${byIssueType.invalid_syntax} translations`);
        }
        return recommendations;
    }
    /**
     * Save interpolation report to file
     */
    async saveReport(report, outputPath) {
        const defaultPath = path.join(this.workspaceRoot, 'interpolation-validation-report.json');
        const filePath = outputPath || defaultPath;
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
        console.log(`\n📊 Interpolation report saved to: ${filePath}`);
        return filePath;
    }
    /**
     * Print summary to console
     */
    printSummary(report) {
        console.log('\n' + '='.repeat(60));
        console.log('🔧 INTERPOLATION VALIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`\n📊 Issue Summary:`);
        console.log(`   Total Issues: ${report.summary.totalIssues}`);
        console.log(`   Critical: ${report.summary.criticalIssues}`);
        console.log(`   High: ${report.summary.highIssues}`);
        console.log(`   Medium: ${report.summary.mediumIssues}`);
        console.log(`   Low: ${report.summary.lowIssues}`);
        console.log(`   Keys Checked: ${report.summary.keysChecked}`);
        console.log(`   Languages Checked: ${report.summary.languagesChecked}`);
        // Show issue type breakdown
        console.log(`\n📈 Issue Types:`);
        Object.entries(report.statistics.byIssueType)
            .sort(([, a], [, b]) => b - a)
            .forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
        });
        // Show worst performing languages
        const worstLanguages = Object.entries(report.statistics.byLanguage)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
        if (worstLanguages.length > 0) {
            console.log(`\n⚠️  Languages with Most Issues:`);
            worstLanguages.forEach(([language, count]) => {
                console.log(`   ${language}: ${count} issues`);
            });
        }
        // Show critical issues
        const criticalIssues = report.issues.filter(i => i.severity === 'critical').slice(0, 5);
        if (criticalIssues.length > 0) {
            console.log(`\n🚨 Critical Issues (Top 5):`);
            criticalIssues.forEach(issue => {
                console.log(`   ${issue.language} - ${issue.namespace} - ${issue.key}: ${issue.description}`);
            });
        }
        // Show recommendations
        if (report.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            report.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        console.log('\n' + '='.repeat(60));
    }
}
// CLI execution
if (require.main === module) {
    const validator = new InterpolationValidator();
    validator.validateInterpolation()
        .then(report => {
        validator.printSummary(report);
        return validator.saveReport(report);
    })
        .then(filePath => {
        console.log(`\n✅ Interpolation validation complete! Report saved to: ${filePath}`);
        process.exit(0);
    })
        .catch(error => {
        console.error('❌ Interpolation validation failed:', error);
        process.exit(1);
    });
}
export { InterpolationValidator };
