#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
class SharedTranslationUpdater {
    constructor(workspaceRoot = process.cwd()) {
        Object.defineProperty(this, "workspaceRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sharedLocalesPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
        Object.defineProperty(this, "sharedNamespaces", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ['common', 'errors', 'forms', 'auth']
        });
        this.workspaceRoot = workspaceRoot;
        this.sharedLocalesPath = path.join(workspaceRoot, 'web/shared-ui/public/locales/shared');
    }
    /**
     * Update a single translation key across all languages
     */
    async updateTranslationKey(namespace, key, translations, options = {}) {
        const { createMissing = true, backupOriginal = true, validateStructure = true } = options;
        console.log(`🔄 Updating translation key: ${namespace}.${key}`);
        const updated = [];
        const failed = [];
        // Validate namespace
        if (!this.sharedNamespaces.includes(namespace)) {
            return {
                success: false,
                updated: [],
                failed: [],
                message: `Invalid namespace: ${namespace}. Supported namespaces: ${this.sharedNamespaces.join(', ')}`
            };
        }
        // Create backup if requested
        if (backupOriginal) {
            await this.createBackup();
        }
        // Update each language
        for (const language of this.supportedLanguages) {
            const translation = translations[language];
            if (!translation) {
                console.warn(`   ⚠️  No translation provided for ${language}, skipping...`);
                continue;
            }
            try {
                const filePath = path.join(this.sharedLocalesPath, language, `${namespace}.json`);
                // Create directory if it doesn't exist
                const dirPath = path.dirname(filePath);
                if (!fs.existsSync(dirPath) && createMissing) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
                let translationData = {};
                // Load existing translations
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    translationData = JSON.parse(content);
                }
                else if (!createMissing) {
                    failed.push(`${language}: File does not exist`);
                    continue;
                }
                // Update the key
                this.setNestedValue(translationData, key, translation);
                // Validate structure if requested
                if (validateStructure) {
                    const baseFilePath = path.join(this.sharedLocalesPath, 'en-US', `${namespace}.json`);
                    if (fs.existsSync(baseFilePath)) {
                        const baseContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));
                        if (!this.validateStructure(translationData, baseContent)) {
                            console.warn(`   ⚠️  Structure validation failed for ${language}`);
                        }
                    }
                }
                // Save updated translations
                fs.writeFileSync(filePath, JSON.stringify(translationData, null, 2));
                updated.push(language);
                console.log(`   ✅ Updated ${language}`);
            }
            catch (error) {
                failed.push(`${language}: ${error}`);
                console.error(`   ❌ Failed to update ${language}:`, error);
            }
        }
        const success = failed.length === 0;
        const message = success
            ? `Successfully updated ${updated.length} languages`
            : `Updated ${updated.length} languages, failed ${failed.length}`;
        return {
            success,
            updated,
            failed,
            message
        };
    }
    /**
     * Bulk update multiple translation keys
     */
    async bulkUpdateTranslations(updates) {
        console.log(`🔄 Starting bulk update of ${updates.length} translation keys...`);
        const results = [];
        let successfulUpdates = 0;
        let failedUpdates = 0;
        // Create backup before bulk operations
        await this.createBackup();
        for (const update of updates) {
            console.log(`\n📝 Processing: ${update.namespace}.${update.key} (${update.action})`);
            let result;
            switch (update.action) {
                case 'add':
                case 'update':
                    // For add/update, we need translations for all languages or specified languages
                    const languages = update.languages || this.supportedLanguages;
                    const translations = {};
                    // If only one value provided, use it for all languages (placeholder)
                    if (typeof update.value === 'string') {
                        languages.forEach(lang => {
                            translations[lang] = update.value;
                        });
                    }
                    result = await this.updateTranslationKey(update.namespace, update.key, translations);
                    break;
                case 'delete':
                    result = await this.deleteTranslationKey(update.namespace, update.key, update.languages);
                    break;
                default:
                    result = {
                        success: false,
                        updated: [],
                        failed: [],
                        message: `Unknown action: ${update.action}`
                    };
            }
            results.push(result);
            if (result.success) {
                successfulUpdates++;
            }
            else {
                failedUpdates++;
            }
        }
        const summary = `Bulk update complete: ${successfulUpdates} successful, ${failedUpdates} failed out of ${updates.length} total updates`;
        return {
            totalUpdates: updates.length,
            successfulUpdates,
            failedUpdates,
            results,
            summary
        };
    }
    /**
     * Delete a translation key from all or specified languages
     */
    async deleteTranslationKey(namespace, key, languages) {
        console.log(`🗑️  Deleting translation key: ${namespace}.${key}`);
        const updated = [];
        const failed = [];
        const targetLanguages = languages || this.supportedLanguages;
        for (const language of targetLanguages) {
            try {
                const filePath = path.join(this.sharedLocalesPath, language, `${namespace}.json`);
                if (!fs.existsSync(filePath)) {
                    console.log(`   ⏭️  File does not exist for ${language}, skipping...`);
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const translationData = JSON.parse(content);
                // Delete the key
                if (this.deleteNestedValue(translationData, key)) {
                    fs.writeFileSync(filePath, JSON.stringify(translationData, null, 2));
                    updated.push(language);
                    console.log(`   ✅ Deleted from ${language}`);
                }
                else {
                    console.log(`   ⏭️  Key not found in ${language}, skipping...`);
                }
            }
            catch (error) {
                failed.push(`${language}: ${error}`);
                console.error(`   ❌ Failed to delete from ${language}:`, error);
            }
        }
        const success = failed.length === 0;
        const message = success
            ? `Successfully deleted from ${updated.length} languages`
            : `Deleted from ${updated.length} languages, failed ${failed.length}`;
        return {
            success,
            updated,
            failed,
            message
        };
    }
    /**
     * Synchronize a namespace across all languages based on base language
     */
    async synchronizeNamespace(namespace) {
        console.log(`🔄 Synchronizing namespace: ${namespace}`);
        const baseFilePath = path.join(this.sharedLocalesPath, 'en-US', `${namespace}.json`);
        if (!fs.existsSync(baseFilePath)) {
            return {
                success: false,
                updated: [],
                failed: [],
                message: `Base file not found: ${baseFilePath}`
            };
        }
        const baseContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));
        const baseKeys = this.getAllKeys(baseContent);
        const updated = [];
        const failed = [];
        for (const language of this.supportedLanguages) {
            if (language === 'en-US')
                continue; // Skip base language
            try {
                const filePath = path.join(this.sharedLocalesPath, language, `${namespace}.json`);
                let translationData = {};
                // Load existing translations
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    translationData = JSON.parse(content);
                }
                // Add missing keys with placeholder values
                let hasChanges = false;
                for (const key of baseKeys) {
                    if (!this.hasNestedValue(translationData, key)) {
                        const baseValue = this.getNestedValue(baseContent, key);
                        this.setNestedValue(translationData, key, `[${language.toUpperCase()}] ${baseValue}`);
                        hasChanges = true;
                    }
                }
                // Remove keys that don't exist in base
                const currentKeys = this.getAllKeys(translationData);
                for (const key of currentKeys) {
                    if (!baseKeys.includes(key)) {
                        this.deleteNestedValue(translationData, key);
                        hasChanges = true;
                    }
                }
                if (hasChanges) {
                    // Create directory if it doesn't exist
                    const dirPath = path.dirname(filePath);
                    if (!fs.existsSync(dirPath)) {
                        fs.mkdirSync(dirPath, { recursive: true });
                    }
                    fs.writeFileSync(filePath, JSON.stringify(translationData, null, 2));
                    updated.push(language);
                    console.log(`   ✅ Synchronized ${language}`);
                }
                else {
                    console.log(`   ⏭️  No changes needed for ${language}`);
                }
            }
            catch (error) {
                failed.push(`${language}: ${error}`);
                console.error(`   ❌ Failed to synchronize ${language}:`, error);
            }
        }
        const success = failed.length === 0;
        const message = success
            ? `Successfully synchronized ${updated.length} languages`
            : `Synchronized ${updated.length} languages, failed ${failed.length}`;
        return {
            success,
            updated,
            failed,
            message
        };
    }
    /**
     * Create backup of all translation files
     */
    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.workspaceRoot, `translation-backups/shared-${timestamp}`);
        if (!fs.existsSync(this.sharedLocalesPath)) {
            console.warn('⚠️  Shared locales path does not exist, skipping backup');
            return;
        }
        // Copy entire shared locales directory
        fs.mkdirSync(backupDir, { recursive: true });
        this.copyDirectory(this.sharedLocalesPath, backupDir);
        console.log(`💾 Backup created: ${backupDir}`);
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
     * Set nested value in object using dot notation
     */
    setNestedValue(obj, key, value) {
        const keys = key.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        current[keys[keys.length - 1]] = value;
    }
    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, key) {
        const keys = key.split('.');
        let current = obj;
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    /**
     * Check if nested value exists
     */
    hasNestedValue(obj, key) {
        return this.getNestedValue(obj, key) !== undefined;
    }
    /**
     * Delete nested value from object
     */
    deleteNestedValue(obj, key) {
        const keys = key.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current) || typeof current[k] !== 'object') {
                return false; // Path doesn't exist
            }
            current = current[k];
        }
        const lastKey = keys[keys.length - 1];
        if (lastKey in current) {
            delete current[lastKey];
            return true;
        }
        return false;
    }
    /**
     * Get all keys from nested object
     */
    getAllKeys(obj, prefix = '') {
        const keys = [];
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                keys.push(...this.getAllKeys(value, fullKey));
            }
            else {
                keys.push(fullKey);
            }
        }
        return keys;
    }
    /**
     * Validate that translation structure matches base structure
     */
    validateStructure(translation, base) {
        const translationKeys = this.getAllKeys(translation);
        const baseKeys = this.getAllKeys(base);
        // Check for missing keys
        const missingKeys = baseKeys.filter(key => !translationKeys.includes(key));
        if (missingKeys.length > 0) {
            console.warn(`   Missing keys: ${missingKeys.join(', ')}`);
            return false;
        }
        return true;
    }
    /**
     * Load updates from JSON file
     */
    async loadUpdatesFromFile(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Updates file not found: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const updates = JSON.parse(content);
        if (!Array.isArray(updates)) {
            throw new Error('Updates file must contain an array of update objects');
        }
        // Validate update objects
        for (const update of updates) {
            if (!update.key || !update.namespace || !update.action) {
                throw new Error('Each update must have key, namespace, and action properties');
            }
        }
        return updates;
    }
    /**
     * Generate update template file
     */
    generateUpdateTemplate(outputPath) {
        const template = [
            {
                key: 'example.newKey',
                value: 'New translation value',
                namespace: 'common',
                action: 'add'
            },
            {
                key: 'example.existingKey',
                value: 'Updated translation value',
                namespace: 'common',
                action: 'update'
            },
            {
                key: 'example.oldKey',
                value: '',
                namespace: 'common',
                action: 'delete'
            }
        ];
        fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
        console.log(`📄 Update template generated: ${outputPath}`);
    }
}
// CLI execution
if (require.main === module) {
    const updater = new SharedTranslationUpdater();
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node update-shared-translations.ts <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  update <namespace> <key> <value>    Update a single key');
        console.log('  delete <namespace> <key>            Delete a key');
        console.log('  sync <namespace>                    Synchronize namespace');
        console.log('  bulk <file>                         Bulk update from file');
        console.log('  template <file>                     Generate update template');
        console.log('');
        console.log('Examples:');
        console.log('  node update-shared-translations.ts update common loading "Loading..."');
        console.log('  node update-shared-translations.ts delete common oldKey');
        console.log('  node update-shared-translations.ts sync common');
        console.log('  node update-shared-translations.ts bulk updates.json');
        console.log('  node update-shared-translations.ts template updates-template.json');
        process.exit(1);
    }
    const command = args[0];
    try {
        switch (command) {
            case 'update':
                if (args.length < 4) {
                    console.error('Error: namespace, key, and value required for update command');
                    process.exit(1);
                }
                const [, namespace, key, value] = args;
                const translations = {};
                updater.supportedLanguages.forEach(lang => {
                    translations[lang] = value; // Use same value for all languages as placeholder
                });
                updater.updateTranslationKey(namespace, key, translations)
                    .then(result => {
                    console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`);
                    process.exit(result.success ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'delete':
                if (args.length < 3) {
                    console.error('Error: namespace and key required for delete command');
                    process.exit(1);
                }
                updater.deleteTranslationKey(args[1], args[2])
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
                if (args.length < 2) {
                    console.error('Error: namespace required for sync command');
                    process.exit(1);
                }
                updater.synchronizeNamespace(args[1])
                    .then(result => {
                    console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`);
                    process.exit(result.success ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'bulk':
                if (args.length < 2) {
                    console.error('Error: file path required for bulk command');
                    process.exit(1);
                }
                updater.loadUpdatesFromFile(args[1])
                    .then(updates => updater.bulkUpdateTranslations(updates))
                    .then(result => {
                    console.log(`\n📊 ${result.summary}`);
                    process.exit(result.failedUpdates === 0 ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'template':
                if (args.length < 2) {
                    console.error('Error: output file path required for template command');
                    process.exit(1);
                }
                updater.generateUpdateTemplate(args[1]);
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
export { SharedTranslationUpdater };
