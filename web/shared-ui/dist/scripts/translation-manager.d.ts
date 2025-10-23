#!/usr/bin/env node
interface ManagerConfig {
    workspaceRoot: string;
    backupEnabled: boolean;
    validateAfterOperations: boolean;
}
interface OperationResult {
    success: boolean;
    message: string;
    details?: any;
}
declare class TranslationManager {
    private config;
    private languageManager;
    private translationUpdater;
    private keyMigrator;
    private validator;
    constructor(config?: Partial<ManagerConfig>);
    /**
     * Add a new language with comprehensive setup
     */
    addLanguage(languageCode: string, options?: {
        copyFromBase?: boolean;
        generatePlaceholders?: boolean;
        updateConfig?: boolean;
        validate?: boolean;
    }): Promise<OperationResult>;
    /**
     * Remove a language completely
     */
    removeLanguage(languageCode: string): Promise<OperationResult>;
    /**
     * Update translations across all applications
     */
    updateTranslations(namespace: string, key: string, translations: Record<string, string>, options?: {
        createMissing?: boolean;
        validate?: boolean;
    }): Promise<OperationResult>;
    /**
     * Migrate translation keys across applications
     */
    migrateKeys(migrations: Array<{
        oldKey: string;
        newKey: string;
        namespace?: string;
        targetNamespace?: string;
        applications?: string[];
        preserveOld?: boolean;
    }>, options?: {
        validate?: boolean;
    }): Promise<OperationResult>;
    /**
     * Synchronize all namespaces across languages
     */
    synchronizeAll(options?: {
        namespaces?: string[];
        validate?: boolean;
    }): Promise<OperationResult>;
    /**
     * Comprehensive validation of all translations
     */
    validateAll(): Promise<OperationResult>;
    /**
     * Generate comprehensive translation report
     */
    generateReport(outputPath?: string): Promise<OperationResult>;
    /**
     * Create backup of translation files
     */
    private createBackup;
    /**
     * Copy directory recursively
     */
    private copyDirectory;
    /**
     * Generate recommendations based on validation results
     */
    private generateRecommendations;
    /**
     * List all supported languages
     */
    listLanguages(): void;
    /**
     * Get configuration
     */
    getConfig(): ManagerConfig;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ManagerConfig>): void;
}
export { TranslationManager };
export type { ManagerConfig, OperationResult };
