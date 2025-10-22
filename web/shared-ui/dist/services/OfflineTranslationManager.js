import { translationCacheManager } from './TranslationCacheManager';
export class OfflineTranslationManager {
    constructor(config = {}) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "offlineStorage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "isOnline", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: navigator.onLine
        });
        Object.defineProperty(this, "syncQueue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "lastSyncTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "syncInProgress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.config = {
            enableOfflineSupport: true,
            offlineStorageKey: 'l4h-offline-translations',
            maxOfflineSize: 10 * 1024 * 1024, // 10MB
            criticalNamespaces: ['common', 'errors', 'auth'],
            syncOnReconnect: true,
            compressionEnabled: true,
            ...config
        };
        this.setupEventListeners();
        this.loadOfflineStorage();
    }
    /**
     * Store translation for offline use
     */
    async storeOffline(language, namespace, data, version = '1.0.0') {
        if (!this.config.enableOfflineSupport)
            return false;
        try {
            const key = this.getOfflineKey(language, namespace);
            const isCritical = this.config.criticalNamespaces.includes(namespace);
            // Compress data if enabled
            const processedData = this.config.compressionEnabled
                ? this.compressData(data)
                : data;
            const size = this.calculateSize(processedData);
            // Check if we have space
            if (!this.hasSpaceForEntry(size, key)) {
                await this.freeSpace(size);
            }
            const entry = {
                language,
                namespace,
                data: processedData,
                timestamp: Date.now(),
                version,
                size,
                critical: isCritical
            };
            this.offlineStorage.set(key, entry);
            await this.persistOfflineStorage();
            console.info(`Stored ${language}/${namespace} offline (${this.formatSize(size)})`);
            return true;
        }
        catch (error) {
            console.error(`Failed to store ${language}/${namespace} offline:`, error);
            return false;
        }
    }
    /**
     * Retrieve translation from offline storage
     */
    getOffline(language, namespace) {
        if (!this.config.enableOfflineSupport)
            return null;
        const key = this.getOfflineKey(language, namespace);
        const entry = this.offlineStorage.get(key);
        if (!entry)
            return null;
        // Decompress if needed
        const data = this.config.compressionEnabled
            ? this.decompressData(entry.data)
            : entry.data;
        console.info(`Retrieved ${language}/${namespace} from offline storage`);
        return data;
    }
    /**
     * Check if translation is available offline
     */
    isAvailableOffline(language, namespace) {
        if (!this.config.enableOfflineSupport)
            return false;
        const key = this.getOfflineKey(language, namespace);
        return this.offlineStorage.has(key);
    }
    /**
     * Preload critical translations for offline use
     */
    async preloadCriticalTranslations(language, loadPaths) {
        const results = {};
        if (!this.config.enableOfflineSupport) {
            return results;
        }
        console.info(`Preloading critical translations for offline use: ${this.config.criticalNamespaces.join(', ')}`);
        for (const namespace of this.config.criticalNamespaces) {
            try {
                // Check if already available offline
                if (this.isAvailableOffline(language, namespace)) {
                    results[namespace] = true;
                    continue;
                }
                // Try to load from cache first
                let data = translationCacheManager.get(language, namespace);
                // If not in cache, try to fetch
                if (!data) {
                    data = await this.fetchTranslation(language, namespace, loadPaths);
                }
                if (data) {
                    const success = await this.storeOffline(language, namespace, data);
                    results[namespace] = success;
                }
                else {
                    results[namespace] = false;
                }
            }
            catch (error) {
                console.error(`Failed to preload critical translation ${namespace}:`, error);
                results[namespace] = false;
            }
        }
        return results;
    }
    /**
     * Sync offline translations when online
     */
    async syncTranslations(language, loadPaths) {
        if (!this.config.enableOfflineSupport || !this.isOnline || this.syncInProgress) {
            return { updated: [], failed: [], removed: [], totalSynced: 0 };
        }
        this.syncInProgress = true;
        const result = {
            updated: [],
            failed: [],
            removed: [],
            totalSynced: 0
        };
        try {
            console.info('Starting offline translation sync...');
            // Get all offline entries for the language
            const offlineEntries = Array.from(this.offlineStorage.entries())
                .filter(([key]) => key.startsWith(`${language}:`));
            for (const [key, entry] of offlineEntries) {
                try {
                    // Fetch latest version
                    const latestData = await this.fetchTranslation(entry.language, entry.namespace, loadPaths);
                    if (latestData) {
                        // Compare versions or data
                        const hasChanged = this.hasDataChanged(entry.data, latestData);
                        if (hasChanged) {
                            await this.storeOffline(entry.language, entry.namespace, latestData, this.generateVersion());
                            result.updated.push(key);
                        }
                    }
                    result.totalSynced++;
                }
                catch (error) {
                    console.warn(`Failed to sync ${key}:`, error);
                    result.failed.push(key);
                }
            }
            this.lastSyncTime = Date.now();
            console.info(`Sync completed: ${result.updated.length} updated, ${result.failed.length} failed`);
        }
        catch (error) {
            console.error('Sync failed:', error);
        }
        finally {
            this.syncInProgress = false;
        }
        return result;
    }
    /**
     * Clear offline storage
     */
    async clearOfflineStorage(options) {
        let clearedCount = 0;
        for (const [key, entry] of this.offlineStorage.entries()) {
            let shouldClear = false;
            // Apply filters
            if (options?.language && entry.language !== options.language)
                continue;
            if (options?.namespace && entry.namespace !== options.namespace)
                continue;
            if (options?.keepCritical && entry.critical)
                continue;
            if (!options ||
                (options.language && entry.language === options.language) ||
                (options.namespace && entry.namespace === options.namespace)) {
                shouldClear = true;
            }
            if (shouldClear) {
                this.offlineStorage.delete(key);
                clearedCount++;
            }
        }
        if (clearedCount > 0) {
            await this.persistOfflineStorage();
            console.info(`Cleared ${clearedCount} offline translations`);
        }
        return clearedCount;
    }
    /**
     * Get offline storage statistics
     */
    getOfflineStats() {
        let totalSize = 0;
        let criticalEntries = 0;
        for (const entry of this.offlineStorage.values()) {
            totalSize += entry.size;
            if (entry.critical)
                criticalEntries++;
        }
        return {
            totalEntries: this.offlineStorage.size,
            totalSize,
            criticalEntries,
            lastSync: this.lastSyncTime,
            isOnline: this.isOnline,
            pendingSync: this.syncQueue.size
        };
    }
    /**
     * Get offline entries for debugging
     */
    getOfflineEntries() {
        const now = Date.now();
        return Array.from(this.offlineStorage.entries()).map(([key, entry]) => ({
            key,
            language: entry.language,
            namespace: entry.namespace,
            size: this.formatSize(entry.size),
            age: this.formatDuration(now - entry.timestamp),
            critical: entry.critical,
            version: entry.version
        }));
    }
    /**
     * Enable/disable offline support
     */
    setOfflineSupport(enabled) {
        this.config.enableOfflineSupport = enabled;
        if (!enabled) {
            this.clearOfflineStorage();
        }
    }
    /**
     * Destroy offline manager and cleanup
     */
    destroy() {
        this.offlineStorage.clear();
        this.syncQueue.clear();
    }
    getOfflineKey(language, namespace) {
        return `${language}:${namespace}`;
    }
    setupEventListeners() {
        // Online/offline detection
        window.addEventListener('online', () => {
            console.info('Connection restored, going online');
            this.isOnline = true;
            if (this.config.syncOnReconnect) {
                // Delay sync to allow connection to stabilize
                setTimeout(() => {
                    this.triggerSync();
                }, 1000);
            }
        });
        window.addEventListener('offline', () => {
            console.info('Connection lost, going offline');
            this.isOnline = false;
        });
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isOnline) {
                this.triggerSync();
            }
        });
    }
    async loadOfflineStorage() {
        if (typeof localStorage === 'undefined')
            return;
        try {
            const stored = localStorage.getItem(this.config.offlineStorageKey);
            if (!stored)
                return;
            const { entries, timestamp } = JSON.parse(stored);
            // Don't load if too old (more than 7 days)
            const maxAge = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - timestamp > maxAge) {
                localStorage.removeItem(this.config.offlineStorageKey);
                return;
            }
            // Load entries
            for (const [key, entry] of Object.entries(entries)) {
                this.offlineStorage.set(key, entry);
            }
            console.info(`Loaded ${this.offlineStorage.size} offline translations`);
        }
        catch (error) {
            console.warn('Failed to load offline storage:', error);
            try {
                localStorage.removeItem(this.config.offlineStorageKey);
            }
            catch { }
        }
    }
    async persistOfflineStorage() {
        if (typeof localStorage === 'undefined')
            return;
        try {
            const entries = {};
            for (const [key, entry] of this.offlineStorage.entries()) {
                entries[key] = entry;
            }
            const data = {
                entries,
                timestamp: Date.now()
            };
            localStorage.setItem(this.config.offlineStorageKey, JSON.stringify(data));
        }
        catch (error) {
            console.warn('Failed to persist offline storage:', error);
        }
    }
    hasSpaceForEntry(size, existingKey) {
        const currentSize = this.getCurrentStorageSize();
        const existingSize = existingKey && this.offlineStorage.has(existingKey)
            ? this.offlineStorage.get(existingKey).size
            : 0;
        return (currentSize - existingSize + size) <= this.config.maxOfflineSize;
    }
    async freeSpace(requiredSize) {
        const currentSize = this.getCurrentStorageSize();
        const targetSize = this.config.maxOfflineSize * 0.8; // Free to 80% capacity
        const sizeToFree = Math.max(requiredSize, currentSize - targetSize);
        // Get non-critical entries sorted by age (oldest first)
        const entries = Array.from(this.offlineStorage.entries())
            .filter(([, entry]) => !entry.critical)
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        let freedSize = 0;
        for (const [key, entry] of entries) {
            if (freedSize >= sizeToFree)
                break;
            this.offlineStorage.delete(key);
            freedSize += entry.size;
        }
        console.info(`Freed ${this.formatSize(freedSize)} of offline storage space`);
    }
    getCurrentStorageSize() {
        let total = 0;
        for (const entry of this.offlineStorage.values()) {
            total += entry.size;
        }
        return total;
    }
    calculateSize(data) {
        return new Blob([JSON.stringify(data)]).size;
    }
    compressData(data) {
        // Unicode-safe compression using JSON + base64
        try {
            const jsonString = JSON.stringify(data);
            // Use TextEncoder for Unicode support, then convert to base64
            const bytes = new TextEncoder().encode(jsonString);
            // Convert bytes to base64 using binary string approach
            const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
            return `compressed:${btoa(binString)}`;
        }
        catch (error) {
            console.warn('Failed to compress offline data:', error);
            return data;
        }
    }
    decompressData(data) {
        if (typeof data === 'string' && data.startsWith('compressed:')) {
            try {
                const compressed = data.substring('compressed:'.length);
                const binString = atob(compressed);
                // Convert binary string back to bytes
                const bytes = Uint8Array.from(binString, (char) => char.codePointAt(0));
                // Use TextDecoder for Unicode support
                const jsonString = new TextDecoder().decode(bytes);
                return JSON.parse(jsonString);
            }
            catch (error) {
                console.warn('Failed to decompress offline data:', error);
                return data;
            }
        }
        return data;
    }
    async fetchTranslation(language, namespace, loadPaths) {
        for (const loadPath of loadPaths) {
            try {
                const url = loadPath
                    .replace('{{lng}}', language)
                    .replace('{{ns}}', namespace);
                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    return await response.json();
                }
            }
            catch (error) {
                continue;
            }
        }
        return null;
    }
    hasDataChanged(oldData, newData) {
        // Simple comparison - in production you might want a more sophisticated approach
        try {
            const oldStr = JSON.stringify(oldData);
            const newStr = JSON.stringify(newData);
            return oldStr !== newStr;
        }
        catch {
            return true; // Assume changed if comparison fails
        }
    }
    generateVersion() {
        return new Date().toISOString();
    }
    triggerSync() {
        // Implementation would depend on how you want to trigger sync
        // This could emit an event or call a callback
        console.info('Sync triggered - implement based on your needs');
    }
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0)
            return `${days}d`;
        if (hours > 0)
            return `${hours}h`;
        if (minutes > 0)
            return `${minutes}m`;
        return `${seconds}s`;
    }
}
// Global offline manager instance
export const offlineTranslationManager = new OfflineTranslationManager();
