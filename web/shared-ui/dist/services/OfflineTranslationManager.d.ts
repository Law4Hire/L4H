export interface OfflineConfig {
    enableOfflineSupport: boolean;
    offlineStorageKey: string;
    maxOfflineSize: number;
    criticalNamespaces: string[];
    syncOnReconnect: boolean;
    compressionEnabled: boolean;
}
export interface OfflineEntry {
    language: string;
    namespace: string;
    data: any;
    timestamp: number;
    version: string;
    size: number;
    critical: boolean;
}
export interface OfflineStats {
    totalEntries: number;
    totalSize: number;
    criticalEntries: number;
    lastSync: number;
    isOnline: boolean;
    pendingSync: number;
}
export interface SyncResult {
    updated: string[];
    failed: string[];
    removed: string[];
    totalSynced: number;
}
export declare class OfflineTranslationManager {
    private config;
    private offlineStorage;
    private isOnline;
    private syncQueue;
    private lastSyncTime;
    private syncInProgress;
    constructor(config?: Partial<OfflineConfig>);
    /**
     * Store translation for offline use
     */
    storeOffline(language: string, namespace: string, data: any, version?: string): Promise<boolean>;
    /**
     * Retrieve translation from offline storage
     */
    getOffline(language: string, namespace: string): any | null;
    /**
     * Check if translation is available offline
     */
    isAvailableOffline(language: string, namespace: string): boolean;
    /**
     * Preload critical translations for offline use
     */
    preloadCriticalTranslations(language: string, loadPaths: string[]): Promise<{
        [namespace: string]: boolean;
    }>;
    /**
     * Sync offline translations when online
     */
    syncTranslations(language: string, loadPaths: string[]): Promise<SyncResult>;
    /**
     * Clear offline storage
     */
    clearOfflineStorage(options?: {
        language?: string;
        namespace?: string;
        keepCritical?: boolean;
    }): Promise<number>;
    /**
     * Get offline storage statistics
     */
    getOfflineStats(): OfflineStats;
    /**
     * Get offline entries for debugging
     */
    getOfflineEntries(): Array<{
        key: string;
        language: string;
        namespace: string;
        size: string;
        age: string;
        critical: boolean;
        version: string;
    }>;
    /**
     * Enable/disable offline support
     */
    setOfflineSupport(enabled: boolean): void;
    /**
     * Destroy offline manager and cleanup
     */
    destroy(): void;
    private getOfflineKey;
    private setupEventListeners;
    private loadOfflineStorage;
    private persistOfflineStorage;
    private hasSpaceForEntry;
    private freeSpace;
    private getCurrentStorageSize;
    private calculateSize;
    private compressData;
    private decompressData;
    private fetchTranslation;
    private hasDataChanged;
    private generateVersion;
    private triggerSync;
    private formatSize;
    private formatDuration;
}
export declare const offlineTranslationManager: OfflineTranslationManager;
