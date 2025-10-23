#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
class NewLanguageManager {
    constructor(workspaceRoot = process.cwd()) {
        Object.defineProperty(this, "workspaceRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "baseLanguage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'en-US'
        });
        Object.defineProperty(this, "applications", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                {
                    name: 'shared-ui',
                    localesPath: 'web/shared-ui/public/locales/shared',
                    namespaces: ['common', 'errors', 'forms', 'auth']
                },
                {
                    name: 'l4h',
                    localesPath: 'web/l4h/public/locales/l4h',
                    namespaces: ['interview', 'dashboard', 'visa-library', 'pricing']
                },
                {
                    name: 'cannlaw',
                    localesPath: 'web/cannlaw/public/locales/cannlaw',
                    namespaces: ['legal', 'billing', 'clients', 'cases']
                }
            ]
        });
        Object.defineProperty(this, "supportedLanguages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', rtl: true, region: 'Saudi Arabia' },
                { code: 'bn-BD', name: 'Bengali', nativeName: 'বাংলা', rtl: false, region: 'Bangladesh' },
                { code: 'de-DE', name: 'German', nativeName: 'Deutsch', rtl: false, region: 'Germany' },
                { code: 'en-US', name: 'English', nativeName: 'English', rtl: false, region: 'United States' },
                { code: 'es-ES', name: 'Spanish', nativeName: 'Español', rtl: false, region: 'Spain' },
                { code: 'fr-FR', name: 'French', nativeName: 'Français', rtl: false, region: 'France' },
                { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', rtl: false, region: 'India' },
                { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false, region: 'Indonesia' },
                { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', rtl: false, region: 'Italy' },
                { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', rtl: false, region: 'Japan' },
                { code: 'ko-KR', name: 'Korean', nativeName: '한국어', rtl: false, region: 'South Korea' },
                { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', rtl: false, region: 'India' },
                { code: 'pl-PL', name: 'Polish', nativeName: 'Polski', rtl: false, region: 'Poland' },
                { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português', rtl: false, region: 'Brazil' },
                { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', rtl: false, region: 'Russia' },
                { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', rtl: false, region: 'India' },
                { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', rtl: false, region: 'India' },
                { code: 'tl-PH', name: 'Filipino', nativeName: 'Filipino', rtl: false, region: 'Philippines' },
                { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', rtl: false, region: 'Turkey' },
                { code: 'ur-PK', name: 'Urdu', nativeName: 'اردو', rtl: true, region: 'Pakistan' },
                { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false, region: 'Vietnam' },
                { code: 'zh-CN', name: 'Chinese', nativeName: '中文', rtl: false, region: 'China' }
            ]
        });
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Add a new language to all applications
     */
    async addLanguage(languageCode, options = {}) {
        const { copyFromBase = true, generatePlaceholders = false, updateConfig = true } = options;
        console.log(`🌍 Adding new language: ${languageCode}`);
        // Validate language code
        const languageConfig = this.supportedLanguages.find(lang => lang.code === languageCode);
        if (!languageConfig) {
            throw new Error(`Unsupported language code: ${languageCode}. Supported languages: ${this.supportedLanguages.map(l => l.code).join(', ')}`);
        }
        console.log(`   Language: ${languageConfig.name} (${languageConfig.nativeName})`);
        console.log(`   RTL: ${languageConfig.rtl ? 'Yes' : 'No'}`);
        console.log(`   Region: ${languageConfig.region}`);
        // Add language to each application
        for (const app of this.applications) {
            console.log(`\n📁 Adding ${languageCode} to ${app.name}...`);
            await this.addLanguageToApplication(languageCode, app, {
                copyFromBase,
                generatePlaceholders
            });
        }
        // Update configuration files
        if (updateConfig) {
            console.log(`\n⚙️  Updating configuration files...`);
            await this.updateConfigurationFiles(languageCode, languageConfig);
        }
        console.log(`\n✅ Successfully added ${languageCode} to all applications!`);
        console.log(`\n📝 Next steps:`);
        console.log(`   1. Review generated translation files`);
        console.log(`   2. Replace placeholder content with actual translations`);
        console.log(`   3. Test the new language in the applications`);
        console.log(`   4. Run validation: npm run validate-translations`);
    }
    /**
     * Add language to a specific application
     */
    async addLanguageToApplication(languageCode, app, options) {
        const appLocalesPath = path.join(this.workspaceRoot, app.localesPath);
        const languageDir = path.join(appLocalesPath, languageCode);
        const baseLanguageDir = path.join(appLocalesPath, this.baseLanguage);
        // Check if base language exists
        if (!fs.existsSync(baseLanguageDir)) {
            console.warn(`   ⚠️  Base language (${this.baseLanguage}) not found in ${app.name}, skipping...`);
            return;
        }
        // Create language directory
        if (!fs.existsSync(languageDir)) {
            fs.mkdirSync(languageDir, { recursive: true });
            console.log(`   📂 Created directory: ${path.relative(this.workspaceRoot, languageDir)}`);
        }
        // Process each namespace
        for (const namespace of app.namespaces) {
            const baseFilePath = path.join(baseLanguageDir, `${namespace}.json`);
            const targetFilePath = path.join(languageDir, `${namespace}.json`);
            if (!fs.existsSync(baseFilePath)) {
                console.warn(`   ⚠️  Base file not found: ${namespace}.json, skipping...`);
                continue;
            }
            if (fs.existsSync(targetFilePath)) {
                console.log(`   ⏭️  File already exists: ${namespace}.json, skipping...`);
                continue;
            }
            if (options.copyFromBase) {
                // Copy base file as starting point
                fs.copyFileSync(baseFilePath, targetFilePath);
                console.log(`   📄 Copied ${namespace}.json from base language`);
            }
            else if (options.generatePlaceholders) {
                // Generate placeholder file
                const baseContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));
                const placeholderContent = this.generatePlaceholderTranslations(baseContent, languageCode);
                fs.writeFileSync(targetFilePath, JSON.stringify(placeholderContent, null, 2));
                console.log(`   📄 Generated placeholder ${namespace}.json`);
            }
            else {
                // Create empty structure
                const baseContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));
                const emptyContent = this.createEmptyStructure(baseContent);
                fs.writeFileSync(targetFilePath, JSON.stringify(emptyContent, null, 2));
                console.log(`   📄 Created empty structure ${namespace}.json`);
            }
        }
    }
    /**
     * Generate placeholder translations
     */
    generatePlaceholderTranslations(obj, languageCode, _prefix = '') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                result[key] = this.generatePlaceholderTranslations(value, languageCode);
            }
            else if (typeof value === 'string') {
                // Generate placeholder that indicates translation is needed
                result[key] = `[${languageCode.toUpperCase()}] ${value}`;
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    /**
     * Create empty structure with same keys but empty values
     */
    createEmptyStructure(obj) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                result[key] = this.createEmptyStructure(value);
            }
            else if (typeof value === 'string') {
                result[key] = '';
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    /**
     * Update configuration files to include new language
     */
    async updateConfigurationFiles(languageCode, languageConfig) {
        // Update i18n configuration
        await this.updateI18nConfig(languageCode, languageConfig);
        // Update package.json scripts if needed
        await this.updatePackageJsonScripts(languageCode);
        // Update any language constants files
        await this.updateLanguageConstants(languageCode, languageConfig);
    }
    /**
     * Update i18n configuration file
     */
    async updateI18nConfig(languageCode, languageConfig) {
        const i18nConfigPath = path.join(this.workspaceRoot, 'web/shared-ui/src/i18n-config.ts');
        if (!fs.existsSync(i18nConfigPath)) {
            console.warn(`   ⚠️  i18n config file not found: ${i18nConfigPath}`);
            return;
        }
        let content = fs.readFileSync(i18nConfigPath, 'utf-8');
        // Check if language is already in the supported languages array
        if (content.includes(`'${languageCode}'`)) {
            console.log(`   ✅ Language ${languageCode} already in i18n config`);
            return;
        }
        // Add to supported languages array
        const supportedLanguagesRegex = /(const\s+supportedLanguages\s*=\s*\[)([\s\S]*?)(\];)/;
        const match = content.match(supportedLanguagesRegex);
        if (match) {
            const beforeArray = match[1];
            const arrayContent = match[2];
            const afterArray = match[3];
            // Add new language to array
            const newArrayContent = arrayContent.trim() + (arrayContent.trim().endsWith(',') ? '' : ',') + `\n  '${languageCode}',`;
            content = content.replace(supportedLanguagesRegex, `${beforeArray}${newArrayContent}\n${afterArray}`);
            fs.writeFileSync(i18nConfigPath, content);
            console.log(`   ✅ Added ${languageCode} to i18n config`);
        }
        else {
            console.warn(`   ⚠️  Could not find supportedLanguages array in i18n config`);
        }
        // Add to RTL languages if applicable
        if (languageConfig.rtl) {
            const rtlLanguagesRegex = /(const\s+rtlLanguages\s*=\s*\[)([\s\S]*?)(\];)/;
            const rtlMatch = content.match(rtlLanguagesRegex);
            if (rtlMatch && !content.includes(`'${languageCode}'`)) {
                const beforeRtlArray = rtlMatch[1];
                const rtlArrayContent = rtlMatch[2];
                const afterRtlArray = rtlMatch[3];
                const newRtlArrayContent = rtlArrayContent.trim() + (rtlArrayContent.trim().endsWith(',') ? '' : ',') + `\n  '${languageCode}',`;
                content = content.replace(rtlLanguagesRegex, `${beforeRtlArray}${newRtlArrayContent}\n${afterRtlArray}`);
                fs.writeFileSync(i18nConfigPath, content);
                console.log(`   ✅ Added ${languageCode} to RTL languages`);
            }
        }
    }
    /**
     * Update package.json scripts for new language
     */
    async updatePackageJsonScripts(languageCode) {
        // This could add language-specific build or validation scripts
        console.log(`   ℹ️  Package.json scripts update not implemented yet`);
    }
    /**
     * Update language constants file
     */
    async updateLanguageConstants(languageCode, languageConfig) {
        const constantsPath = path.join(this.workspaceRoot, 'web/shared-ui/src/constants/languages.ts');
        // Create constants file if it doesn't exist
        if (!fs.existsSync(constantsPath)) {
            const constantsDir = path.dirname(constantsPath);
            if (!fs.existsSync(constantsDir)) {
                fs.mkdirSync(constantsDir, { recursive: true });
            }
            const initialContent = `// Language constants for the application
export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English', nativeName: 'English', rtl: false, region: 'United States' }
];

export const RTL_LANGUAGES = ['ar-SA', 'ur-PK'];

export const LANGUAGE_NAMES: Record<string, string> = {
  'en-US': 'English'
};

export const NATIVE_LANGUAGE_NAMES: Record<string, string> = {
  'en-US': 'English'
};
`;
            fs.writeFileSync(constantsPath, initialContent);
            console.log(`   📄 Created language constants file`);
        }
        let content = fs.readFileSync(constantsPath, 'utf-8');
        // Check if language is already added
        if (content.includes(`'${languageCode}'`)) {
            console.log(`   ✅ Language ${languageCode} already in constants`);
            return;
        }
        // Add to SUPPORTED_LANGUAGES array
        const languageEntry = `  { code: '${languageCode}', name: '${languageConfig.name}', nativeName: '${languageConfig.nativeName}', rtl: ${languageConfig.rtl}, region: '${languageConfig.region}' }`;
        const supportedLanguagesRegex = /(export const SUPPORTED_LANGUAGES = \[)([\s\S]*?)(\];)/;
        const match = content.match(supportedLanguagesRegex);
        if (match) {
            const beforeArray = match[1];
            const arrayContent = match[2];
            const afterArray = match[3];
            const newArrayContent = arrayContent.trim() + (arrayContent.trim().endsWith(',') ? '' : ',') + `\n${languageEntry},`;
            content = content.replace(supportedLanguagesRegex, `${beforeArray}${newArrayContent}\n${afterArray}`);
        }
        // Add to LANGUAGE_NAMES
        const languageNamesRegex = /(export const LANGUAGE_NAMES: Record<string, string> = \{)([\s\S]*?)(\};)/;
        const namesMatch = content.match(languageNamesRegex);
        if (namesMatch) {
            const beforeObj = namesMatch[1];
            const objContent = namesMatch[2];
            const afterObj = namesMatch[3];
            const newObjContent = objContent.trim() + (objContent.trim().endsWith(',') ? '' : ',') + `\n  '${languageCode}': '${languageConfig.name}',`;
            content = content.replace(languageNamesRegex, `${beforeObj}${newObjContent}\n${afterObj}`);
        }
        // Add to NATIVE_LANGUAGE_NAMES
        const nativeNamesRegex = /(export const NATIVE_LANGUAGE_NAMES: Record<string, string> = \{)([\s\S]*?)(\};)/;
        const nativeMatch = content.match(nativeNamesRegex);
        if (nativeMatch) {
            const beforeObj = nativeMatch[1];
            const objContent = nativeMatch[2];
            const afterObj = nativeMatch[3];
            const newObjContent = objContent.trim() + (objContent.trim().endsWith(',') ? '' : ',') + `\n  '${languageCode}': '${languageConfig.nativeName}',`;
            content = content.replace(nativeNamesRegex, `${beforeObj}${newObjContent}\n${afterObj}`);
        }
        fs.writeFileSync(constantsPath, content);
        console.log(`   ✅ Updated language constants`);
    }
    /**
     * List all supported languages
     */
    listSupportedLanguages() {
        console.log('🌍 Supported Languages:');
        console.log('='.repeat(60));
        this.supportedLanguages.forEach(lang => {
            const rtlIndicator = lang.rtl ? '(RTL)' : '(LTR)';
            console.log(`${lang.code.padEnd(8)} ${lang.name.padEnd(15)} ${lang.nativeName.padEnd(15)} ${rtlIndicator}`);
        });
        console.log('='.repeat(60));
    }
    /**
     * Remove a language from all applications
     */
    async removeLanguage(languageCode) {
        console.log(`🗑️  Removing language: ${languageCode}`);
        if (languageCode === this.baseLanguage) {
            throw new Error(`Cannot remove base language: ${this.baseLanguage}`);
        }
        // Remove from each application
        for (const app of this.applications) {
            console.log(`\n📁 Removing ${languageCode} from ${app.name}...`);
            const appLocalesPath = path.join(this.workspaceRoot, app.localesPath);
            const languageDir = path.join(appLocalesPath, languageCode);
            if (fs.existsSync(languageDir)) {
                fs.rmSync(languageDir, { recursive: true, force: true });
                console.log(`   🗑️  Removed directory: ${path.relative(this.workspaceRoot, languageDir)}`);
            }
            else {
                console.log(`   ⏭️  Directory not found, skipping...`);
            }
        }
        console.log(`\n✅ Successfully removed ${languageCode} from all applications!`);
        console.log(`\n📝 Note: You may need to manually update configuration files.`);
    }
}
// CLI execution
if (require.main === module) {
    const manager = new NewLanguageManager();
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node add-new-language.ts <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  add <language-code>     Add a new language');
        console.log('  remove <language-code>  Remove a language');
        console.log('  list                    List supported languages');
        console.log('');
        console.log('Options for add:');
        console.log('  --no-copy              Don\'t copy from base language');
        console.log('  --placeholders         Generate placeholder translations');
        console.log('  --no-config            Don\'t update configuration files');
        process.exit(1);
    }
    const command = args[0];
    try {
        switch (command) {
            case 'add':
                if (args.length < 2) {
                    console.error('Error: Language code required for add command');
                    process.exit(1);
                }
                const languageCode = args[1];
                const options = {
                    copyFromBase: !args.includes('--no-copy'),
                    generatePlaceholders: args.includes('--placeholders'),
                    updateConfig: !args.includes('--no-config')
                };
                manager.addLanguage(languageCode, options)
                    .then(() => process.exit(0))
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'remove':
                if (args.length < 2) {
                    console.error('Error: Language code required for remove command');
                    process.exit(1);
                }
                manager.removeLanguage(args[1])
                    .then(() => process.exit(0))
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'list':
                manager.listSupportedLanguages();
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
export { NewLanguageManager };
