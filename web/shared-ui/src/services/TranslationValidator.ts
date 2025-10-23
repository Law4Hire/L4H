export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  completeness: number
  missingKeys: string[]
  extraKeys: string[]
}

export interface ValidationError {
  type: 'missing_key' | 'invalid_interpolation' | 'empty_value' | 'invalid_format'
  key: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  type: 'unused_key' | 'inconsistent_casing' | 'long_text' | 'special_characters'
  key: string
  message: string
  suggestion?: string
}

export interface TranslationData {
  [key: string]: string | TranslationData
}

export interface ValidationOptions {
  checkInterpolation?: boolean
  checkCompleteness?: boolean
  checkConsistency?: boolean
  maxTextLength?: number
  requiredKeys?: string[]
  allowedInterpolationParams?: string[]
}

export interface CompletenessReport {
  language: string
  totalKeys: number
  translatedKeys: number
  missingKeys: string[]
  emptyKeys: string[]
  completeness: number
  lastUpdated: Date
}

export interface MissingKeysReport {
  [language: string]: {
    missingKeys: string[]
    count: number
    percentage: number
  }
}

export class TranslationValidator {
  private readonly defaultOptions: ValidationOptions = {
    checkInterpolation: true,
    checkCompleteness: true,
    checkConsistency: true,
    maxTextLength: 500,
    requiredKeys: ['common.loading', 'common.error', 'common.retry'],
    allowedInterpolationParams: ['count', 'name', 'value', 'date', 'time']
  }

  /**
   * Validate translation completeness against a reference language
   */
  validateCompleteness(
    targetTranslations: TranslationData,
    referenceTranslations: TranslationData,
    language: string,
    options: Partial<ValidationOptions> = {}
  ): ValidationResult {
    const opts = { ...this.defaultOptions, ...options }
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    const referenceKeys = this.flattenTranslationKeys(referenceTranslations)
    const targetKeys = this.flattenTranslationKeys(targetTranslations)
    
    const missingKeys = referenceKeys.filter(key => !targetKeys.includes(key))
    const extraKeys = targetKeys.filter(key => !referenceKeys.includes(key))
    
    // Check for missing keys
    missingKeys.forEach(key => {
      const isRequired = opts.requiredKeys?.includes(key)
      errors.push({
        type: 'missing_key',
        key,
        message: `Missing translation for key: ${key}`,
        severity: isRequired ? 'error' : 'warning'
      })
    })
    
    // Check for empty values
    const emptyKeys = this.findEmptyKeys(targetTranslations)
    emptyKeys.forEach(key => {
      errors.push({
        type: 'empty_value',
        key,
        message: `Empty translation value for key: ${key}`,
        severity: 'warning'
      })
    })
    
    // Check interpolation if enabled
    if (opts.checkInterpolation) {
      const interpolationErrors = this.validateInterpolation(
        targetTranslations, 
        referenceTranslations,
        opts.allowedInterpolationParams || []
      )
      errors.push(...interpolationErrors)
    }
    
    // Check consistency if enabled
    if (opts.checkConsistency) {
      const consistencyWarnings = this.validateConsistency(targetTranslations, opts)
      warnings.push(...consistencyWarnings)
    }
    
    const completeness = referenceKeys.length > 0 
      ? ((referenceKeys.length - missingKeys.length) / referenceKeys.length) * 100 
      : 100
    
    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
      completeness,
      missingKeys,
      extraKeys
    }
  }

  /**
   * Generate completeness report for a language
   */
  generateCompletenessReport(
    translations: TranslationData,
    referenceTranslations: TranslationData,
    language: string
  ): CompletenessReport {
    const referenceKeys = this.flattenTranslationKeys(referenceTranslations)
    const translationKeys = this.flattenTranslationKeys(translations)
    const emptyKeys = this.findEmptyKeys(translations)
    
    const missingKeys = referenceKeys.filter(key => !translationKeys.includes(key))
    const translatedKeys = referenceKeys.length - missingKeys.length - emptyKeys.length
    const completeness = referenceKeys.length > 0 
      ? (translatedKeys / referenceKeys.length) * 100 
      : 100
    
    return {
      language,
      totalKeys: referenceKeys.length,
      translatedKeys,
      missingKeys,
      emptyKeys,
      completeness,
      lastUpdated: new Date()
    }
  }

  /**
   * Generate missing keys report across multiple languages
   */
  generateMissingKeysReport(
    translationsByLanguage: { [language: string]: TranslationData },
    referenceLanguage: string = 'en-US'
  ): MissingKeysReport {
    const referenceTranslations = translationsByLanguage[referenceLanguage]
    if (!referenceTranslations) {
      throw new Error(`Reference language ${referenceLanguage} not found`)
    }
    
    const referenceKeys = this.flattenTranslationKeys(referenceTranslations)
    const report: MissingKeysReport = {}
    
    Object.entries(translationsByLanguage).forEach(([language, translations]) => {
      if (language === referenceLanguage) return
      
      const translationKeys = this.flattenTranslationKeys(translations)
      const missingKeys = referenceKeys.filter(key => !translationKeys.includes(key))
      
      report[language] = {
        missingKeys,
        count: missingKeys.length,
        percentage: referenceKeys.length > 0 
          ? (missingKeys.length / referenceKeys.length) * 100 
          : 0
      }
    })
    
    return report
  }

  /**
   * Validate interpolation parameters
   */
  validateInterpolation(
    translations: TranslationData,
    referenceTranslations: TranslationData,
    allowedParams: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = []
    const flatTranslations = this.flattenTranslations(translations)
    const flatReference = this.flattenTranslations(referenceTranslations)
    
    Object.entries(flatTranslations).forEach(([key, value]) => {
      if (typeof value !== 'string') return
      
      // Find interpolation parameters in the translation
      const translationParams = this.extractInterpolationParams(value as string)
      const referenceValue = flatReference[key]
      const referenceParams = referenceValue && typeof referenceValue === 'string'
        ? this.extractInterpolationParams(referenceValue) 
        : []
      
      // Check for missing parameters
      referenceParams.forEach(param => {
        if (!translationParams.includes(param)) {
          errors.push({
            type: 'invalid_interpolation',
            key,
            message: `Missing interpolation parameter: {{${param}}}`,
            severity: 'error'
          })
        }
      })
      
      // Check for extra parameters
      translationParams.forEach(param => {
        if (!referenceParams.includes(param) && !allowedParams.includes(param)) {
          errors.push({
            type: 'invalid_interpolation',
            key,
            message: `Unknown interpolation parameter: {{${param}}}`,
            severity: 'warning'
          })
        }
      })
    })
    
    return errors
  }

  /**
   * Validate translation consistency
   */
  validateConsistency(
    translations: TranslationData,
    options: Partial<ValidationOptions>
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = []
    const flatTranslations = this.flattenTranslations(translations)
    
    Object.entries(flatTranslations).forEach(([key, value]) => {
      if (typeof value !== 'string') return
      
      // Check text length
      if (options.maxTextLength && value.length > options.maxTextLength) {
        warnings.push({
          type: 'long_text',
          key,
          message: `Text is too long (${value.length} > ${options.maxTextLength} characters)`,
          suggestion: 'Consider shortening the text or splitting into multiple keys'
        })
      }
      
      // Check for inconsistent casing in keys
      if (this.hasInconsistentCasing(key)) {
        warnings.push({
          type: 'inconsistent_casing',
          key,
          message: 'Key uses inconsistent casing convention',
          suggestion: 'Use consistent camelCase or snake_case'
        })
      }
      
      // Check for special characters that might cause issues
      if (this.hasProblematicCharacters(value)) {
        warnings.push({
          type: 'special_characters',
          key,
          message: 'Translation contains potentially problematic characters',
          suggestion: 'Review special characters for compatibility'
        })
      }
    })
    
    return warnings
  }

  /**
   * Check if translation key exists and is not empty
   */
  hasValidTranslation(translations: TranslationData, key: string): boolean {
    const value = this.getNestedValue(translations, key)
    return value !== undefined && value !== null && value !== ''
  }

  /**
   * Get translation statistics
   */
  getTranslationStats(translations: TranslationData): {
    totalKeys: number
    emptyKeys: number
    averageLength: number
    longestKey: string
    shortestKey: string
  } {
    const flatTranslations = this.flattenTranslations(translations)
    const values = Object.values(flatTranslations).filter(v => typeof v === 'string') as string[]
    const keys = Object.keys(flatTranslations)
    
    const emptyKeys = values.filter(v => v === '').length
    const averageLength = values.length > 0 
      ? values.reduce((sum, v) => sum + v.length, 0) / values.length 
      : 0
    
    const longestKey = keys.reduce((longest, key) => 
      flatTranslations[key] && typeof flatTranslations[key] === 'string' && 
      (flatTranslations[key] as string).length > (flatTranslations[longest] as string || '').length 
        ? key 
        : longest, 
      keys[0] || ''
    )
    
    const shortestKey = keys.reduce((shortest, key) => 
      flatTranslations[key] && typeof flatTranslations[key] === 'string' && 
      (flatTranslations[key] as string).length < (flatTranslations[shortest] as string || 'x'.repeat(1000)).length 
        ? key 
        : shortest, 
      keys[0] || ''
    )
    
    return {
      totalKeys: keys.length,
      emptyKeys,
      averageLength,
      longestKey,
      shortestKey
    }
  }

  private flattenTranslationKeys(obj: TranslationData, prefix = ''): string[] {
    const keys: string[] = []
    
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'object' && value !== null) {
        keys.push(...this.flattenTranslationKeys(value, fullKey))
      } else {
        keys.push(fullKey)
      }
    })
    
    return keys
  }

  private flattenTranslations(obj: TranslationData, prefix = ''): { [key: string]: string | TranslationData } {
    const flattened: { [key: string]: string | TranslationData } = {}
    
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'object' && value !== null) {
        Object.assign(flattened, this.flattenTranslations(value, fullKey))
      } else {
        flattened[fullKey] = value
      }
    })
    
    return flattened
  }

  private findEmptyKeys(obj: TranslationData, prefix = ''): string[] {
    const emptyKeys: string[] = []
    
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'object' && value !== null) {
        emptyKeys.push(...this.findEmptyKeys(value, fullKey))
      } else if (value === '' || value === null || value === undefined) {
        emptyKeys.push(fullKey)
      }
    })
    
    return emptyKeys
  }

  private extractInterpolationParams(text: string): string[] {
    const matches = text.match(/\{\{([^}]+)\}\}/g)
    if (!matches) return []
    
    return matches.map(match => {
      const param = match.replace(/\{\{|\}\}/g, '').trim()
      // Handle complex interpolation like {{count, number}} -> count
      return param.split(',')[0].trim()
    })
  }

  private getNestedValue(obj: TranslationData, key: string): any {
    return key.split('.').reduce((current, part) => {
      return current && typeof current === 'object' ? (current as any)[part] : undefined
    }, obj)
  }

  private hasInconsistentCasing(key: string): boolean {
    const parts = key.split('.')
    const hasCamelCase = parts.some(part => /[a-z][A-Z]/.test(part))
    const hasSnakeCase = parts.some(part => part.includes('_'))
    const hasKebabCase = parts.some(part => part.includes('-'))
    
    // Inconsistent if using multiple casing styles
    return [hasCamelCase, hasSnakeCase, hasKebabCase].filter(Boolean).length > 1
  }

  private hasProblematicCharacters(text: string): boolean {
    // Check for characters that might cause issues in different contexts
    const problematicChars = /[<>{}[\]\\`]/
    return problematicChars.test(text)
  }
}

// Global instance for use across the application
export const translationValidator = new TranslationValidator()