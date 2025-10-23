#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
class TranslationCompletenessValidator {
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
        Object.defineProperty(this, "interpolationPattern", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: /\{\{[^}]+\}\}/g
        });
        Object.defineProperty(this, "workspaceRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Validate translation completeness across all applications
     */
    async validateAll() {
        console.log('🔍 Starting comprehensive translation validation...');
        const results = [];
        const applications = [
            { name: 'shared-ui', path: 'web/shared-ui/public/locales/shared' },
            { name: 'l4h', path: 'web/l4h/public/locales/l4h' },
            { name: 'cannlaw', path: 'web/cannlaw/public/locales/cannlaw' }
        ];
        for (const app of applications) {
            console.log(`\n📁 Validating ${app.name} translations...`);
            const appResults = await this.validateApplication(app.path, app.name);
            results.push(...appResults);
        }
        return this.generateReport(results);
    }
    /**
     * Validate translations for a specific application
     */
    async validateApplication(localesPath, appName) {
        const fullPath = path.join(this.workspaceRoot, localesPath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️  Locales path not found: ${fullPath}`);
            return [];
        }
        const results = [];
        const baseLanguagePath = path.join(fullPath, this.baseLanguage);
        if (!fs.existsSync(baseLanguagePath)) {
            console.error(`❌ Base language (${this.baseLanguage}) not found in ${fullPath}`);
            return [];
        }
        // Get all namespaces from base language
        const namespaces = this.getNamespaces(baseLanguagePath);
        console.log(`   Found ${namespaces.length} namespaces: ${namespaces.join(', ')}`);
        // Load base language translations for comparison
        const baseTranslations = this.loadNamespaceTranslations(baseLanguagePath, namespaces);
        // Validate each language
        for (const language of this.supportedLanguages) {
            const languagePath = path.join(fullPath, language);
            if (!fs.existsSync(languagePath)) {
                console.warn(`   ⚠️  Language ${language} directory not found`);
                continue;
            }
            for (const namespace of namespaces) {
                const result = await this.validateNamespace(languagePath, namespace, baseTranslations[namespace] || {}, appName, language);
                results.push(result);
            }
        }
        return results;
    }
    /**
     * Get all available namespaces (JSON files) in a directory
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
     * Load all namespace translations for a language
     */
    loadNamespaceTranslations(languagePath, namespaces) {
        const translations = {};
        for (const namespace of namespaces) {
            const filePath = path.join(languagePath, `${namespace}.json`);
            try {
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    translations[namespace] = JSON.parse(content);
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
     * Validate a specific namespace for a language
     */
    async validateNamespace(languagePath, namespace, baseTranslation, appName, language) {
        const filePath = path.join(languagePath, `${namespace}.json`);
        const result = {
            language,
            namespace: `${appName}:${namespace}`,
            filePath: path.relative(this.workspaceRoot, filePath),
            completeness: 0,
            missingKeys: [],
            extraKeys: [],
            interpolationErrors: [],
            totalKeys: 0,
            validKeys: 0
        };
        // Get all keys from base translation
        const baseKeys = this.flattenKeys(baseTranslation);
        result.totalKeys = baseKeys.length;
        if (!fs.existsSync(filePath)) {
            result.missingKeys = baseKeys;
            return result;
        }
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const translation = JSON.parse(content);
            const translationKeys = this.flattenKeys(translation);
            // Find missing keys
            result.missingKeys = baseKeys.filter(key => !translationKeys.includes(key));
            // Find extra keys (keys that exist in translation but not in base)
            result.extraKeys = translationKeys.filter(key => !baseKeys.includes(key));
            // Validate interpolation
            result.interpolationErrors = this.validateInterpolation(translation, baseTranslation);
            // Calculate completeness
            result.validKeys = baseKeys.length - result.missingKeys.length;
            result.completeness = result.totalKeys > 0 ? (result.validKeys / result.totalKeys) * 100 : 0;
        }
        catch (error) {
            console.error(`Error parsing ${filePath}:`, error);
            result.missingKeys = baseKeys;
        }
        return result;
    }
    /**
     * Flatten nested translation object to array of dot-notation keys
     */
    flattenKeys(obj, prefix = '') {
        const keys = [];
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                keys.push(...this.flattenKeys(value, fullKey));
            }
            else {
                keys.push(fullKey);
            }
        }
        return keys;
    }
    /**
     * Validate interpolation placeholders match between base and target translations
     */
    validateInterpolation(translation, baseTranslation) {
        const errors = [];
        const flatTranslation = this.flattenTranslation(translation);
        const flatBase = this.flattenTranslation(baseTranslation);
        for (const [key, value] of Object.entries(flatBase)) {
            if (typeof value === 'string' && flatTranslation[key]) {
                const baseMatches = value.match(this.interpolationPattern) || [];
                const translationMatches = flatTranslation[key].match(this.interpolationPattern) || [];
                // Check if interpolation placeholders match
                const basePlaceholders = baseMatches.sort();
                const translationPlaceholders = translationMatches.sort();
                if (JSON.stringify(basePlaceholders) !== JSON.stringify(translationPlaceholders)) {
                    errors.push(`${key}: Expected placeholders ${basePlaceholders.join(', ')}, found ${translationPlaceholders.join(', ')}`);
                }
            }
        }
        return errors;
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
     * Generate comprehensive validation report
     */
    generateReport(results) {
        const totalResults = results.length;
        const averageCompleteness = totalResults > 0
            ? results.reduce((sum, r) => sum + r.completeness, 0) / totalResults
            : 0;
        const criticalIssues = results.filter(r => r.completeness < 80 || r.interpolationErrors.length > 0).length;
        const uniqueLanguages = new Set(results.map(r => r.language)).size;
        const uniqueNamespaces = new Set(results.map(r => r.namespace)).size;
        const recommendations = this.generateRecommendations(results);
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalLanguages: uniqueLanguages,
                totalNamespaces: uniqueNamespaces,
                averageCompleteness: Math.round(averageCompleteness * 100) / 100,
                criticalIssues
            },
            results: results.sort((a, b) => a.completeness - b.completeness),
            recommendations
        };
    }
    /**
     * Generate actionable recommendations based on validation results
     */
    generateRecommendations(results) {
        const recommendations = [];
        // Find languages with low completeness
        const lowCompletenessResults = results.filter(r => r.completeness < 80);
        if (lowCompletenessResults.length > 0) {
            const languages = [...new Set(lowCompletenessResults.map(r => r.language))];
            recommendations.push(`Priority: Complete translations for languages with <80% completeness: ${languages.join(', ')}`);
        }
        // Find namespaces with consistent issues
        const namespaceIssues = new Map();
        results.forEach(r => {
            if (r.completeness < 90) {
                namespaceIssues.set(r.namespace, (namespaceIssues.get(r.namespace) || 0) + 1);
            }
        });
        const problematicNamespaces = Array.from(namespaceIssues.entries())
            .filter(([, count]) => count > 5)
            .map(([namespace]) => namespace);
        if (problematicNamespaces.length > 0) {
            recommendations.push(`Review and update these namespaces with frequent issues: ${problematicNamespaces.join(', ')}`);
        }
        // Interpolation errors
        const interpolationErrors = results.filter(r => r.interpolationErrors.length > 0);
        if (interpolationErrors.length > 0) {
            recommendations.push(`Fix interpolation errors in ${interpolationErrors.length} translation files`);
        }
        // Missing files
        const missingFiles = results.filter(r => r.completeness === 0);
        if (missingFiles.length > 0) {
            recommendations.push(`Create missing translation files: ${missingFiles.length} files need to be created`);
        }
        return recommendations;
    }
    /**
     * Save validation report to file
     */
    async saveReport(report, outputPath) {
        const defaultPath = path.join(this.workspaceRoot, 'translation-completeness-report.json');
        const filePath = outputPath || defaultPath;
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
        console.log(`\n📊 Report saved to: ${filePath}`);
        return filePath;
    }
    /**
     * Print summary to console
     */
    printSummary(report) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TRANSLATION COMPLETENESS VALIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`\n📈 Overall Statistics:`);
        console.log(`   Languages: ${report.summary.totalLanguages}`);
        console.log(`   Namespaces: ${report.summary.totalNamespaces}`);
        console.log(`   Average Completeness: ${report.summary.averageCompleteness}%`);
        console.log(`   Critical Issues: ${report.summary.criticalIssues}`);
        // Show worst performing translations
        const worstResults = report.results.slice(0, 10);
        if (worstResults.length > 0) {
            console.log(`\n⚠️  Lowest Completeness (Top 10):`);
            worstResults.forEach(result => {
                console.log(`   ${result.language} - ${result.namespace}: ${result.completeness.toFixed(1)}% (${result.missingKeys.length} missing keys)`);
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
    const validator = new TranslationCompletenessValidator();
    validator.validateAll()
        .then(report => {
        validator.printSummary(report);
        return validator.saveReport(report);
    })
        .then(filePath => {
        console.log(`\n✅ Validation complete! Report saved to: ${filePath}`);
        process.exit(0);
    })
        .catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}
export { TranslationCompletenessValidator };
