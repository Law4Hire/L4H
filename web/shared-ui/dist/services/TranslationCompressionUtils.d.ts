export interface CompressionConfig {
    enableCompression: boolean;
    compressionThreshold: number;
    compressionLevel: 'fast' | 'balanced' | 'best';
    enableDeduplication: boolean;
    enableMinification: boolean;
    preserveFormatting: boolean;
}
export interface CompressionResult {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    method: string;
    success: boolean;
    error?: string;
}
export interface CompressionStats {
    totalFiles: number;
    compressedFiles: number;
    totalOriginalSize: number;
    totalCompressedSize: number;
    averageCompressionRatio: number;
    totalSavings: number;
}
export declare class TranslationCompressionUtils {
    private config;
    private stats;
    constructor(config?: Partial<CompressionConfig>);
    /**
     * Compress translation data
     */
    compressTranslation(data: any, namespace?: string): Promise<CompressionResult>;
    /**
     * Decompress translation data
     */
    decompressTranslation(compressedData: string): Promise<any>;
    /**
     * Compress multiple translation files
     */
    compressTranslationBundle(translations: {
        [namespace: string]: any;
    }): Promise<{
        compressed: string;
        results: {
            [namespace: string]: CompressionResult;
        };
        bundleStats: CompressionResult;
    }>;
    /**
     * Optimize translation structure for better compression
     */
    optimizeTranslationStructure(data: any): any;
    /**
     * Analyze compression potential
     */
    analyzeCompressionPotential(data: any): {
        originalSize: number;
        estimatedCompressedSize: number;
        estimatedSavings: number;
        recommendCompression: boolean;
        duplicateStrings: number;
        longStrings: number;
    };
    /**
     * Get compression statistics
     */
    getCompressionStats(): CompressionStats;
    /**
     * Reset compression statistics
     */
    resetStats(): void;
    /**
     * Check if data is compressed
     */
    isCompressed(data: string): boolean;
    private applyCompression;
    private applyDecompression;
    private fastCompress;
    private balancedCompress;
    private bestCompress;
    private simpleDecompress;
    private lzDecompress;
    private gzDecompress;
    private lzCompress;
    private lzDecompressString;
    private minifyTranslationJson;
    private deduplicateTranslations;
    private deduplicateObject;
    private extractStrings;
    private findDuplicateStrings;
    private getCompressionMethod;
    private updateStats;
}
export declare const translationCompressionUtils: TranslationCompressionUtils;
