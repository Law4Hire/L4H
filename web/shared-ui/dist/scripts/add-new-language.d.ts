#!/usr/bin/env node
interface LanguageConfig {
    code: string;
    name: string;
    nativeName: string;
    rtl: boolean;
    region?: string;
}
interface ApplicationConfig {
    name: string;
    localesPath: string;
    namespaces: string[];
}
declare class NewLanguageManager {
    private workspaceRoot;
    private baseLanguage;
    private applications;
    private supportedLanguages;
    constructor(workspaceRoot?: string);
    /**
     * Add a new language to all applications
     */
    addLanguage(languageCode: string, options?: {
        copyFromBase?: boolean;
        generatePlaceholders?: boolean;
        updateConfig?: boolean;
    }): Promise<void>;
    /**
     * Add language to a specific application
     */
    private addLanguageToApplication;
    /**
     * Generate placeholder translations
     */
    private generatePlaceholderTranslations;
    /**
     * Create empty structure with same keys but empty values
     */
    private createEmptyStructure;
    /**
     * Update configuration files to include new language
     */
    private updateConfigurationFiles;
    /**
     * Update i18n configuration file
     */
    private updateI18nConfig;
    /**
     * Update package.json scripts for new language
     */
    private updatePackageJsonScripts;
    /**
     * Update language constants file
     */
    private updateLanguageConstants;
    /**
     * List all supported languages
     */
    listSupportedLanguages(): void;
    /**
     * Remove a language from all applications
     */
    removeLanguage(languageCode: string): Promise<void>;
}
export type { LanguageConfig, ApplicationConfig };
export { NewLanguageManager };
