export interface CompressionConfig {
  enableCompression: boolean
  compressionThreshold: number // Compress files larger than this size (bytes)
  compressionLevel: 'fast' | 'balanced' | 'best'
  enableDeduplication: boolean
  enableMinification: boolean
  preserveFormatting: boolean
}

export interface CompressionResult {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  method: string
  success: boolean
  error?: string
}

export interface CompressionStats {
  totalFiles: number
  compressedFiles: number
  totalOriginalSize: number
  totalCompressedSize: number
  averageCompressionRatio: number
  totalSavings: number
}

export class TranslationCompressionUtils {
  private config: CompressionConfig
  private stats: CompressionStats = {
    totalFiles: 0,
    compressedFiles: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    averageCompressionRatio: 0,
    totalSavings: 0
  }

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = {
      enableCompression: true,
      compressionThreshold: 1024, // 1KB
      compressionLevel: 'balanced',
      enableDeduplication: true,
      enableMinification: true,
      preserveFormatting: false,
      ...config
    }
  }

  /**
   * Compress translation data
   */
  async compressTranslation(
    data: any,
    namespace: string = 'unknown'
  ): Promise<CompressionResult> {
    if (!this.config.enableCompression) {
      return {
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 1,
        method: 'none',
        success: false,
        error: 'Compression disabled'
      }
    }

    try {
      // Convert to JSON string
      let jsonString = JSON.stringify(data, null, this.config.preserveFormatting ? 2 : 0)
      const originalSize = new Blob([jsonString]).size

      // Check if compression is needed
      if (originalSize < this.config.compressionThreshold) {
        return {
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
          method: 'none',
          success: true
        }
      }

      // Apply preprocessing optimizations
      if (this.config.enableMinification) {
        jsonString = this.minifyTranslationJson(jsonString)
      }

      if (this.config.enableDeduplication) {
        data = this.deduplicateTranslations(data)
        jsonString = JSON.stringify(data)
      }

      // Apply compression
      const compressed = await this.applyCompression(jsonString)
      const compressedSize = new Blob([compressed]).size
      const compressionRatio = compressedSize / originalSize

      // Update stats
      this.updateStats(originalSize, compressedSize, true)

      return {
        originalSize,
        compressedSize,
        compressionRatio,
        method: this.getCompressionMethod(),
        success: true
      }
    } catch (error) {
      this.updateStats(0, 0, false)
      
      return {
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 1,
        method: 'none',
        success: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Decompress translation data
   */
  async decompressTranslation(compressedData: string): Promise<any> {
    if (!this.isCompressed(compressedData)) {
      return JSON.parse(compressedData)
    }

    try {
      const decompressed = await this.applyDecompression(compressedData)
      return JSON.parse(decompressed)
    } catch (error) {
      console.error('Failed to decompress translation data:', error)
      throw error
    }
  }

  /**
   * Compress multiple translation files
   */
  async compressTranslationBundle(
    translations: { [namespace: string]: any }
  ): Promise<{
    compressed: string
    results: { [namespace: string]: CompressionResult }
    bundleStats: CompressionResult
  }> {
    const results: { [namespace: string]: CompressionResult } = {}
    const processedTranslations: { [namespace: string]: any } = {}

    // Compress individual namespaces
    for (const [namespace, data] of Object.entries(translations)) {
      const result = await this.compressTranslation(data, namespace)
      results[namespace] = result
      processedTranslations[namespace] = data
    }

    // Create bundle
    const bundleJson = JSON.stringify(processedTranslations)
    const bundleCompressed = await this.applyCompression(bundleJson)
    
    const bundleOriginalSize = new Blob([bundleJson]).size
    const bundleCompressedSize = new Blob([bundleCompressed]).size

    const bundleStats: CompressionResult = {
      originalSize: bundleOriginalSize,
      compressedSize: bundleCompressedSize,
      compressionRatio: bundleCompressedSize / bundleOriginalSize,
      method: this.getCompressionMethod(),
      success: true
    }

    return {
      compressed: bundleCompressed,
      results,
      bundleStats
    }
  }

  /**
   * Optimize translation structure for better compression
   */
  optimizeTranslationStructure(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const optimized: any = {}

    // Sort keys for better compression
    const sortedKeys = Object.keys(data).sort()
    
    for (const key of sortedKeys) {
      const value = data[key]
      
      if (typeof value === 'object' && value !== null) {
        optimized[key] = this.optimizeTranslationStructure(value)
      } else if (typeof value === 'string') {
        // Normalize whitespace
        optimized[key] = value.trim().replace(/\s+/g, ' ')
      } else {
        optimized[key] = value
      }
    }

    return optimized
  }

  /**
   * Analyze compression potential
   */
  analyzeCompressionPotential(data: any): {
    originalSize: number
    estimatedCompressedSize: number
    estimatedSavings: number
    recommendCompression: boolean
    duplicateStrings: number
    longStrings: number
  } {
    const jsonString = JSON.stringify(data)
    const originalSize = new Blob([jsonString]).size
    
    // Analyze content
    const strings = this.extractStrings(data)
    const duplicates = this.findDuplicateStrings(strings)
    const longStrings = strings.filter(s => s.length > 100).length
    
    // Estimate compression ratio based on content analysis
    let estimatedRatio = 0.7 // Base compression ratio
    
    if (duplicates.length > 0) {
      estimatedRatio -= 0.1 // Better compression with duplicates
    }
    
    if (longStrings > 0) {
      estimatedRatio -= 0.05 // Better compression with long strings
    }

    const estimatedCompressedSize = Math.floor(originalSize * estimatedRatio)
    const estimatedSavings = originalSize - estimatedCompressedSize
    const recommendCompression = originalSize > this.config.compressionThreshold && estimatedSavings > 500

    return {
      originalSize,
      estimatedCompressedSize,
      estimatedSavings,
      recommendCompression,
      duplicateStrings: duplicates.length,
      longStrings
    }
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(): CompressionStats {
    const stats = { ...this.stats }
    
    if (stats.compressedFiles > 0) {
      stats.averageCompressionRatio = stats.totalCompressedSize / stats.totalOriginalSize
      stats.totalSavings = stats.totalOriginalSize - stats.totalCompressedSize
    }

    return stats
  }

  /**
   * Reset compression statistics
   */
  resetStats(): void {
    this.stats = {
      totalFiles: 0,
      compressedFiles: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      averageCompressionRatio: 0,
      totalSavings: 0
    }
  }

  /**
   * Check if data is compressed
   */
  isCompressed(data: string): boolean {
    return data.startsWith('compressed:') || data.startsWith('lz:') || data.startsWith('gz:')
  }

  private async applyCompression(data: string): Promise<string> {
    switch (this.config.compressionLevel) {
      case 'fast':
        return this.fastCompress(data)
      case 'balanced':
        return this.balancedCompress(data)
      case 'best':
        return this.bestCompress(data)
      default:
        return this.balancedCompress(data)
    }
  }

  private async applyDecompression(data: string): Promise<string> {
    if (data.startsWith('compressed:')) {
      return this.simpleDecompress(data)
    } else if (data.startsWith('lz:')) {
      return this.lzDecompress(data)
    } else if (data.startsWith('gz:')) {
      return this.gzDecompress(data)
    }
    
    throw new Error('Unknown compression format')
  }

  private fastCompress(data: string): string {
    // Simple base64 compression (fast but not very efficient)
    try {
      return `compressed:${btoa(data)}`
    } catch (error) {
      console.warn('Fast compression failed, using uncompressed data')
      return data
    }
  }

  private balancedCompress(data: string): string {
    // LZ-style compression (balanced speed/ratio)
    try {
      const compressed = this.lzCompress(data)
      return `lz:${compressed}`
    } catch (error) {
      console.warn('Balanced compression failed, falling back to fast compression')
      return this.fastCompress(data)
    }
  }

  private bestCompress(data: string): string {
    // Best compression (slower but better ratio)
    try {
      // In a real implementation, you'd use a proper compression library like pako
      const compressed = this.lzCompress(data)
      return `gz:${compressed}`
    } catch (error) {
      console.warn('Best compression failed, falling back to balanced compression')
      return this.balancedCompress(data)
    }
  }

  private simpleDecompress(data: string): string {
    const compressed = data.substring('compressed:'.length)
    return atob(compressed)
  }

  private lzDecompress(data: string): string {
    const compressed = data.substring('lz:'.length)
    return this.lzDecompressString(compressed)
  }

  private gzDecompress(data: string): string {
    const compressed = data.substring('gz:'.length)
    // In a real implementation, you'd use a proper decompression library
    return this.lzDecompressString(compressed)
  }

  private lzCompress(data: string): string {
    // Simplified LZ77-style compression
    const dictionary: { [key: string]: number } = {}
    const result: string[] = []
    let dictSize = 256
    
    // Initialize dictionary with single characters
    for (let i = 0; i < 256; i++) {
      dictionary[String.fromCharCode(i)] = i
    }

    let current = ''
    for (let i = 0; i < data.length; i++) {
      const char = data[i]
      const combined = current + char
      
      if (dictionary[combined] !== undefined) {
        current = combined
      } else {
        result.push(String.fromCharCode(dictionary[current]))
        dictionary[combined] = dictSize++
        current = char
      }
    }
    
    if (current) {
      result.push(String.fromCharCode(dictionary[current]))
    }

    return btoa(result.join(''))
  }

  private lzDecompressString(compressed: string): string {
    try {
      const data = atob(compressed)
      const dictionary: string[] = []
      
      // Initialize dictionary
      for (let i = 0; i < 256; i++) {
        dictionary[i] = String.fromCharCode(i)
      }

      const result: string[] = []
      let dictSize = 256
      let previous = data[0]
      result.push(previous)

      for (let i = 1; i < data.length; i++) {
        const code = data.charCodeAt(i)
        let entry: string
        
        if (dictionary[code] !== undefined) {
          entry = dictionary[code]
        } else if (code === dictSize) {
          entry = previous + previous[0]
        } else {
          throw new Error('Invalid compressed data')
        }
        
        result.push(entry)
        dictionary[dictSize++] = previous + entry[0]
        previous = entry
      }

      return result.join('')
    } catch (error) {
      throw new Error('Failed to decompress LZ data')
    }
  }

  private minifyTranslationJson(jsonString: string): string {
    try {
      // Remove unnecessary whitespace while preserving string content
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed)
    } catch (error) {
      console.warn('Failed to minify JSON, using original')
      return jsonString
    }
  }

  private deduplicateTranslations(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const stringMap = new Map<string, string>()
    const deduplicated = this.deduplicateObject(data, stringMap)
    
    // If we found duplicates, add a reference table
    if (stringMap.size > 0) {
      return {
        __refs: Array.from(stringMap.entries()).reduce((acc, [key, value]) => {
          acc[key] = value
          return acc
        }, {} as { [key: string]: string }),
        ...deduplicated
      }
    }

    return deduplicated
  }

  private deduplicateObject(obj: any, stringMap: Map<string, string>): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    const result: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > 20) {
        // Check if we've seen this string before
        const existing = Array.from(stringMap.values()).find(v => v === value)
        if (existing) {
          const refKey = Array.from(stringMap.entries()).find(([, v]) => v === existing)?.[0]
          if (refKey) {
            result[key] = `__ref:${refKey}`
            continue
          }
        }
        
        // Add to string map if it's long enough
        const refKey = `ref_${stringMap.size}`
        stringMap.set(refKey, value)
        result[key] = `__ref:${refKey}`
      } else if (typeof value === 'object') {
        result[key] = this.deduplicateObject(value, stringMap)
      } else {
        result[key] = value
      }
    }

    return result
  }

  private extractStrings(obj: any): string[] {
    const strings: string[] = []
    
    const extract = (value: any) => {
      if (typeof value === 'string') {
        strings.push(value)
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(extract)
      }
    }
    
    extract(obj)
    return strings
  }

  private findDuplicateStrings(strings: string[]): string[] {
    const counts = new Map<string, number>()
    
    strings.forEach(str => {
      counts.set(str, (counts.get(str) || 0) + 1)
    })
    
    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([str]) => str)
  }

  private getCompressionMethod(): string {
    switch (this.config.compressionLevel) {
      case 'fast': return 'base64'
      case 'balanced': return 'lz77'
      case 'best': return 'gzip'
      default: return 'lz77'
    }
  }

  private updateStats(originalSize: number, compressedSize: number, success: boolean): void {
    this.stats.totalFiles++
    
    if (success) {
      this.stats.compressedFiles++
      this.stats.totalOriginalSize += originalSize
      this.stats.totalCompressedSize += compressedSize
    }
  }
}

// Global compression utils instance
export const translationCompressionUtils = new TranslationCompressionUtils()