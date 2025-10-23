#!/usr/bin/env node
interface KeyMigration {
    oldKey: string;
    newKey: string;
    namespace?: string;
    targetNamespace?: string;
    applications?: string[];
    preserveOld?: boolean;
}
interface MigrationResult {
    success: boolean;
    filesUpdated: string[];
    codeFilesUpdated: string[];
    errors: string[];
    summary: string;
}
interface ApplicationConfig {
    name: string;
    localesPath: string;
    srcPath: string;
    namespaces: string[];
}
interface CodeFileUpdate {
    filePath: string;
    oldPattern: string;
    newPattern: string;
    occurrences: number;
}
declare class TranslationKeyMigrator {
    private workspaceRoot;
    private supportedLanguages;
    private applications;
    constructor(workspaceRoot?: string);
    /**
     * Migrate a single translation key across all applications
     */
    migrateKey(migration: KeyMigration): Promise<MigrationResult>;
    /**
     * Bulk migrate multiple keys
     */
    bulkMigrateKeys(migrations: KeyMigration[]): Promise<MigrationResult>;
    /**
     * Migrate translation files for a specific application
     */
    private migrateTranslationFiles;
    /**
     * Migrate code files for a specific application
     */
    private migrateCodeFiles;
    /**
     * Update a single code file
     */
    private updateCodeFile;
    /**
     * Create backup of all translation and code files
     */
    private createBackup;
    /**
     * Copy directory recursively
     */
    private copyDirectory;
    /**
     * Utility methods for nested object manipulation
     */
    private setNestedValue;
    private getNestedValue;
    private deleteNestedValue;
    private escapeRegex;
    /**
     * Load migrations from JSON file
     */
    loadMigrationsFromFile(filePath: string): Promise<KeyMigration[]>;
    /**
     * Generate migration template file
     */
    generateMigrationTemplate(outputPath: string): void;
    /**
     * Analyze translation key usage across applications
     */
    analyzeKeyUsage(key: string): Promise<{
        translationFiles: string[];
        codeFiles: string[];
        totalOccurrences: number;
    }>;
}
export type { KeyMigration, MigrationResult, ApplicationConfig, CodeFileUpdate };
export { TranslationKeyMigrator };
