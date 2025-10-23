#!/usr/bin/env node
interface TranslationUpdate {
    key: string;
    value: string;
    namespace: string;
    languages?: string[];
    action: 'add' | 'update' | 'delete';
}
interface UpdateResult {
    success: boolean;
    updated: string[];
    failed: string[];
    message: string;
}
interface BulkUpdateResult {
    totalUpdates: number;
    successfulUpdates: number;
    failedUpdates: number;
    results: UpdateResult[];
    summary: string;
}
declare class SharedTranslationUpdater {
    private workspaceRoot;
    private sharedLocalesPath;
    supportedLanguages: string[];
    private sharedNamespaces;
    constructor(workspaceRoot?: string);
    /**
     * Update a single translation key across all languages
     */
    updateTranslationKey(namespace: string, key: string, translations: Record<string, string>, options?: {
        createMissing?: boolean;
        backupOriginal?: boolean;
        validateStructure?: boolean;
    }): Promise<UpdateResult>;
    /**
     * Bulk update multiple translation keys
     */
    bulkUpdateTranslations(updates: TranslationUpdate[]): Promise<BulkUpdateResult>;
    /**
     * Delete a translation key from all or specified languages
     */
    deleteTranslationKey(namespace: string, key: string, languages?: string[]): Promise<UpdateResult>;
    /**
     * Synchronize a namespace across all languages based on base language
     */
    synchronizeNamespace(namespace: string): Promise<UpdateResult>;
    /**
     * Create backup of all translation files
     */
    private createBackup;
    /**
     * Copy directory recursively
     */
    private copyDirectory;
    /**
     * Set nested value in object using dot notation
     */
    private setNestedValue;
    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue;
    /**
     * Check if nested value exists
     */
    private hasNestedValue;
    /**
     * Delete nested value from object
     */
    private deleteNestedValue;
    /**
     * Get all keys from nested object
     */
    private getAllKeys;
    /**
     * Validate that translation structure matches base structure
     */
    private validateStructure;
    /**
     * Load updates from JSON file
     */
    loadUpdatesFromFile(filePath: string): Promise<TranslationUpdate[]>;
    /**
     * Generate update template file
     */
    generateUpdateTemplate(outputPath: string): void;
}
export { SharedTranslationUpdater };
export type { TranslationUpdate, UpdateResult, BulkUpdateResult };
