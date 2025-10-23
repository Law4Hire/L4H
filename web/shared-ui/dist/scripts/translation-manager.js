#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { NewLanguageManager } from './add-new-language';
import { SharedTranslationUpdater } from './update-shared-translations';
import { TranslationKeyMigrator } from './translation-key-migrator';
import { TranslationCompletenessValidator } from './translation-completeness-validator';
class TranslationManager {
    constructor(config = {}) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "languageManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "translationUpdater", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "keyMigrator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "validator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.config = {
            workspaceRoot: process.cwd(),
            backupEnabled: true,
            validateAfterOperations: true,
            ...config
        };
        this.languageManager = new NewLanguageManager(this.config.workspaceRoot);
        this.translationUpdater = new SharedTranslationUpdater(this.config.workspaceRoot);
        this.keyMigrator = new TranslationKeyMigrator(this.config.workspaceRoot);
        this.validator = new TranslationCompletenessValidator(this.config.workspaceRoot);
    }
    /**
     * Add a new language with comprehensive setup
     */
    async addLanguage(languageCode, options = {}) {
        console.log(`🌍 Starting comprehensive language addition: ${languageCode}`);
        try {
            // Add language using language manager
            await this.languageManager.addLanguage(languageCode, {
                copyFromBase: options.copyFromBase ?? true,
                generatePlaceholders: options.generatePlaceholders ?? false,
                updateConfig: options.updateConfig ?? true
            });
            // Validate if requested
            if (options.validate ?? this.config.validateAfterOperations) {
                console.log('\n🔍 Validating new language setup...');
                const validationResult = await this.validator.validateAll();
                const languageResults = validationResult.results.filter(r => r.language === languageCode);
                if (languageResults.length > 0) {
                    const avgCompleteness = languageResults.reduce((sum, r) => sum + r.completeness, 0) / languageResults.length;
                    const totalMissing = languageResults.reduce((sum, r) => sum + r.missingKeys.length, 0);
                    if (avgCompleteness < 100) {
                        console.warn(`⚠️  Language ${languageCode} has incomplete translations:`);
                        console.warn(`   Missing keys: ${totalMissing}`);
                        console.warn(`   Completion rate: ${avgCompleteness.toFixed(1)}%`);
                    }
                }
            }
            return {
                success: true,
                message: `Successfully added language ${languageCode}`,
                details: { languageCode }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to add language ${languageCode}: ${error}`,
                details: { error: String(error) }
            };
        }
    }
    /**
     * Remove a language completely
     */
    async removeLanguage(languageCode) {
        console.log(`🗑️  Starting comprehensive language removal: ${languageCode}`);
        try {
            // Create backup if enabled
            if (this.config.backupEnabled) {
                await this.createBackup(`language-removal-${languageCode}`);
            }
            // Remove language using language manager
            await this.languageManager.removeLanguage(languageCode);
            return {
                success: true,
                message: `Successfully removed language ${languageCode}`,
                details: { languageCode }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to remove language ${languageCode}: ${error}`,
                details: { error: String(error) }
            };
        }
    }
    /**
     * Update translations across all applications
     */
    async updateTranslations(namespace, key, translations, options = {}) {
        console.log(`🔄 Updating translations: ${namespace}.${key}`);
        try {
            // Create backup if enabled
            if (this.config.backupEnabled) {
                await this.createBackup(`translation-update-${namespace}-${key.replace(/\./g, '-')}`);
            }
            // Update translations
            const result = await this.translationUpdater.updateTranslationKey(namespace, key, translations, {
                createMissing: options.createMissing ?? true,
                backupOriginal: false, // We already created a backup
                validateStructure: true
            });
            // Validate if requested
            if (options.validate ?? this.config.validateAfterOperations) {
                console.log('\n🔍 Validating updated translations...');
                const validationResult = await this.validator.validateAll();
                if (validationResult.summary.averageCompleteness < 100) {
                    console.warn('⚠️  Some languages have incomplete translations after update');
                }
            }
            return {
                success: result.success,
                message: result.message,
                details: result
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to update translations: ${error}`,
                details: { error: String(error) }
            };
        }
    }
    /**
     * Migrate translation keys across applications
     */
    async migrateKeys(migrations, options = {}) {
        console.log(`🔄 Migrating ${migrations.length} translation keys`);
        try {
            // Create backup if enabled
            if (this.config.backupEnabled) {
                await this.createBackup(`key-migration-${Date.now()}`);
            }
            // Migrate keys
            const result = await this.keyMigrator.bulkMigrateKeys(migrations);
            // Validate if requested
            if (options.validate ?? this.config.validateAfterOperations) {
                console.log('\n🔍 Validating migrated translations...');
                const validationResult = await this.validator.validateAll();
                if (validationResult.summary.averageCompleteness < 100) {
                    console.warn('⚠️  Some languages have incomplete translations after migration');
                }
            }
            return {
                success: result.success,
                message: result.summary,
                details: result
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to migrate keys: ${error}`,
                details: { error: String(error) }
            };
        }
    }
    /**
     * Synchronize all namespaces across languages
     */
    async synchronizeAll(options = {}) {
        console.log('🔄 Synchronizing all translation namespaces');
        const namespaces = options.namespaces || ['common', 'errors', 'forms', 'auth'];
        const results = [];
        try {
            // Create backup if enabled
            if (this.config.backupEnabled) {
                await this.createBackup(`synchronization-${Date.now()}`);
            }
            // Synchronize each namespace
            for (const namespace of namespaces) {
                console.log(`\n📁 Synchronizing namespace: ${namespace}`);
                const result = await this.translationUpdater.synchronizeNamespace(namespace);
                results.push({ namespace, ...result });
            }
            // Validate if requested
            if (options.validate ?? this.config.validateAfterOperations) {
                console.log('\n🔍 Validating synchronized translations...');
                const validationResult = await this.validator.validateAll();
                if (validationResult.summary.averageCompleteness < 100) {
                    console.warn(`⚠️  Some languages have incomplete translations after synchronization`);
                }
            }
            const allSuccessful = results.every(r => r.success);
            return {
                success: allSuccessful,
                message: allSuccessful
                    ? `Successfully synchronized ${namespaces.length} namespaces`
                    : `Synchronization completed with some errors`,
                details: { results }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to synchronize translations: ${error}`,
                details: { error: String(error) }
            };
        }
    }
    /**
     * Comprehensive validation of all translations
     */
    async validateAll() {
        console.log('🔍 Running comprehensive translation validation');
        try {
            const validationReport = await this.validator.validateAll();
            const summary = {
                totalLanguages: validationReport.summary.totalLanguages,
                completeLanguages: validationReport.results.filter(r => r.completeness === 100).length,
                incompleteLanguages: validationReport.results.filter(r => r.completeness < 100).length,
                totalMissingKeys: validationReport.results.reduce((sum, r) => sum + r.missingKeys.length, 0),
                averageCompletion: validationReport.summary.averageCompleteness
            };
            console.log('\n📊 Validation Summary:');
            console.log(`   Total languages: ${summary.totalLanguages}`);
            console.log(`   Complete languages: ${summary.completeLanguages}`);
            console.log(`   Incomplete languages: ${summary.incompleteLanguages}`);
            console.log(`   Total missing keys: ${summary.totalMissingKeys}`);
            console.log(`   Average completion: ${summary.averageCompletion.toFixed(1)}%`);
            // Show details for incomplete languages
            const incompleteLanguages = validationReport.results.filter((r) => r.completeness < 100);
            if (incompleteLanguages.length > 0) {
                console.log('\n⚠️  Incomplete Languages:');
                incompleteLanguages.forEach((result) => {
                    console.log(`   ${result.language}: ${result.completeness.toFixed(1)}% (${result.missingKeys.length} missing keys)`);
                });
            }
            return {
                success: summary.incompleteLanguages === 0,
                message: summary.incompleteLanguages === 0
                    ? 'All translations are complete'
                    : `${summary.incompleteLanguages} languages have incomplete translations`,
                details: { summary, results: validationReport.results }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Validation failed: ${error}`,
                details: { error: String(error) }
            };
        }
    }
    /**
     * Generate comprehensive translation report
     */
    async generateReport(outputPath) {
        console.log('📊 Generating comprehensive translation report');
        try {
            const validationReport = await this.validator.validateAll();
            const report = {
                generatedAt: new Date().toISOString(),
                summary: {
                    totalLanguages: validationReport.summary.totalLanguages,
                    completeLanguages: validationReport.results.filter((r) => r.completeness === 100).length,
                    averageCompletion: validationReport.summary.averageCompleteness
                },
                languages: validationReport.results.map((result) => ({
                    language: result.language,
                    isComplete: result.completeness === 100,
                    completionPercentage: result.completeness,
                    missingKeysCount: result.missingKeys.length,
                    missingKeys: result.missingKeys.slice(0, 10), // First 10 missing keys
                    namespace: result.namespace
                })),
                recommendations: this.generateRecommendations(validationReport.results)
            };
            const reportJson = JSON.stringify(report, null, 2);
            if (outputPath) {
                fs.writeFileSync(outputPath, reportJson);
                console.log(`📄 Report saved to: ${outputPath}`);
            }
            else {
                const defaultPath = path.join(this.config.workspaceRoot, `translation-report-${Date.now()}.json`);
                fs.writeFileSync(defaultPath, reportJson);
                console.log(`📄 Report saved to: ${defaultPath}`);
            }
            return {
                success: true,
                message: 'Translation report generated successfully',
                details: { report }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to generate report: ${error}`,
                details: { error: String(error) }
            };
        }
    }
    /**
     * Create backup of translation files
     */
    async createBackup(suffix) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.config.workspaceRoot, `translation-backups/${suffix}-${timestamp}`);
        console.log(`💾 Creating backup: ${backupDir}`);
        const applications = [
            { name: 'shared-ui', path: 'web/shared-ui/public/locales' },
            { name: 'l4h', path: 'web/l4h/public/locales' },
            { name: 'cannlaw', path: 'web/cannlaw/public/locales' }
        ];
        for (const app of applications) {
            const sourcePath = path.join(this.config.workspaceRoot, app.path);
            if (fs.existsSync(sourcePath)) {
                const backupPath = path.join(backupDir, app.name);
                this.copyDirectory(sourcePath, backupPath);
            }
        }
        console.log('✅ Backup created successfully');
    }
    /**
     * Copy directory recursively
     */
    copyDirectory(src, dest) {
        if (!fs.existsSync(src))
            return;
        fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            }
            else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    /**
     * Generate recommendations based on validation results
     */
    generateRecommendations(results) {
        const recommendations = [];
        const incompleteLanguages = results.filter((r) => r.completeness < 100);
        const averageCompletion = results.reduce((sum, r) => sum + r.completeness, 0) / results.length;
        if (incompleteLanguages.length > 0) {
            recommendations.push(`Complete translations for ${incompleteLanguages.length} languages`);
        }
        if (averageCompletion < 90) {
            recommendations.push('Focus on improving overall translation completion rate');
        }
        const languagesWithManyMissing = results.filter((r) => r.missingKeys.length > 50);
        if (languagesWithManyMissing.length > 0) {
            recommendations.push(`Priority attention needed for languages with 50+ missing keys: ${languagesWithManyMissing.map((r) => r.language).join(', ')}`);
        }
        if (recommendations.length === 0) {
            recommendations.push('All translations are in good condition');
        }
        return recommendations;
    }
    /**
     * List all supported languages
     */
    listLanguages() {
        this.languageManager.listSupportedLanguages();
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
// CLI execution
if (require.main === module) {
    const manager = new TranslationManager();
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('🌍 Translation Manager - Comprehensive Translation Management Tool');
        console.log('='.repeat(70));
        console.log('');
        console.log('Usage:');
        console.log('  node translation-manager.ts <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  add-language <code>                     Add a new language');
        console.log('  remove-language <code>                  Remove a language');
        console.log('  update <namespace> <key> <value>        Update translation key');
        console.log('  migrate <oldKey> <newKey> [namespace]   Migrate translation key');
        console.log('  sync [namespace1,namespace2,...]        Synchronize namespaces');
        console.log('  validate                                Validate all translations');
        console.log('  report [output-file]                    Generate comprehensive report');
        console.log('  list-languages                          List supported languages');
        console.log('');
        console.log('Global Options:');
        console.log('  --no-backup                             Disable automatic backups');
        console.log('  --no-validate                           Skip validation after operations');
        console.log('  --workspace <path>                      Set workspace root path');
        console.log('');
        console.log('Examples:');
        console.log('  node translation-manager.ts add-language zh-TW');
        console.log('  node translation-manager.ts update common loading "Loading..."');
        console.log('  node translation-manager.ts migrate old.key new.key common');
        console.log('  node translation-manager.ts sync common,errors');
        console.log('  node translation-manager.ts validate');
        console.log('  node translation-manager.ts report translation-report.json');
        process.exit(1);
    }
    // Parse global options
    const globalOptions = {
        backupEnabled: !args.includes('--no-backup'),
        validateAfterOperations: !args.includes('--no-validate'),
        workspaceRoot: args.includes('--workspace')
            ? args[args.indexOf('--workspace') + 1]
            : process.cwd()
    };
    // Update manager configuration
    manager.updateConfig(globalOptions);
    const command = args[0];
    try {
        switch (command) {
            case 'add-language':
                if (args.length < 2) {
                    console.error('Error: Language code required');
                    process.exit(1);
                }
                manager.addLanguage(args[1])
                    .then(result => {
                    console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`);
                    process.exit(result.success ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'remove-language':
                if (args.length < 2) {
                    console.error('Error: Language code required');
                    process.exit(1);
                }
                manager.removeLanguage(args[1])
                    .then(result => {
                    console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`);
                    process.exit(result.success ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'update':
                if (args.length < 4) {
                    console.error('Error: namespace, key, and value required');
                    process.exit(1);
                }
                const [, namespace, key, value] = args;
                const translations = {};
                // Use same value for all languages as placeholder
                const supportedLanguages = [
                    'ar-SA', 'bn-BD', 'de-DE', 'en-US', 'es-ES', 'fr-FR', 'hi-IN',
                    'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR',
                    'ru-RU', 'ta-IN', 'te-IN', 'tl-PH', 'tr-TR', 'ur-PK', 'vi-VN', 'zh-CN'
                ];
                supportedLanguages.forEach(lang => {
                    translations[lang] = value;
                });
                manager.updateTranslations(namespace, key, translations)
                    .then(result => {
                    console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`);
                    process.exit(result.success ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'migrate':
                if (args.length < 3) {
                    console.error('Error: oldKey and newKey required');
                    process.exit(1);
                }
                const migration = {
                    oldKey: args[1],
                    newKey: args[2],
                    namespace: args[3] || 'common'
                };
                manager.migrateKeys([migration])
                    .then(result => {
                    console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`);
                    process.exit(result.success ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'sync':
                const namespaces = args.length > 1 ? args[1].split(',') : undefined;
                manager.synchronizeAll({ namespaces })
                    .then(result => {
                    console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`);
                    process.exit(result.success ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'validate':
                manager.validateAll()
                    .then(result => {
                    console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`);
                    process.exit(result.success ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'report':
                const outputFile = args.length > 1 ? args[1] : undefined;
                manager.generateReport(outputFile)
                    .then(result => {
                    console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`);
                    process.exit(result.success ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'list-languages':
                manager.listLanguages();
                process.exit(0);
                break;
            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
export { TranslationManager };
