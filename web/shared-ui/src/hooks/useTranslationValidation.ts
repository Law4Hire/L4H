import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { translationValidator, ValidationResult, CompletenessReport } from '../services/TranslationValidator'
import { translationLoader } from '../services/TranslationLoader'

export interface UseTranslationValidationOptions {
  languages?: string[]
  namespaces?: string[]
  referenceLanguage?: string
  autoValidate?: boolean
  validationInterval?: number
}

export interface TranslationValidationState {
  isValidating: boolean
  validationResults: { [language: string]: ValidationResult }
  completenessReports: CompletenessReport[]
  missingKeysReport: any
  lastValidated: Date | null
  hasErrors: boolean
  hasWarnings: boolean
}

export function useTranslationValidation(options: UseTranslationValidationOptions = {}) {
  const { i18n } = useTranslation()
  const {
    languages = ['en-US', 'es-ES', 'fr-FR', 'de-DE'],
    namespaces = ['common', 'errors', 'forms'],
    referenceLanguage = 'en-US',
    autoValidate = false,
    validationInterval = 300000 // 5 minutes
  } = options

  const [state, setState] = useState<TranslationValidationState>({
    isValidating: false,
    validationResults: {},
    completenessReports: [],
    missingKeysReport: {},
    lastValidated: null,
    hasErrors: false,
    hasWarnings: false
  })

  /**
   * Load translation data for validation
   */
  const loadTranslationData = useCallback(async (language: string, namespace: string) => {
    try {
      const result = await translationLoader.loadTranslation({
        language,
        namespace,
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        cache: true
      })
      
      if (result.success) {
        return result.data
      } else {
        throw result.error || new Error(`Failed to load ${language}/${namespace}`)
      }
    } catch (error) {
      console.warn(`Failed to load translation data for ${language}/${namespace}:`, error)
      return {}
    }
  }, [])

  /**
   * Validate translations for all languages
   */
  const validateTranslations = useCallback(async () => {
    setState(prev => ({ ...prev, isValidating: true }))
    
    try {
      const validationResults: { [language: string]: ValidationResult } = {}
      const completenessReports: CompletenessReport[] = []
      
      // Load reference translations
      const referenceTranslations: any = {}
      for (const namespace of namespaces) {
        referenceTranslations[namespace] = await loadTranslationData(referenceLanguage, namespace)
      }
      
      // Validate each language
      for (const language of languages) {
        if (language === referenceLanguage) continue
        
        const languageTranslations: any = {}
        for (const namespace of namespaces) {
          languageTranslations[namespace] = await loadTranslationData(language, namespace)
        }
        
        // Combine all namespaces for validation
        const combinedReference = Object.assign({}, ...Object.values(referenceTranslations))
        const combinedTarget = Object.assign({}, ...Object.values(languageTranslations))
        
        // Validate completeness
        const validationResult = translationValidator.validateCompleteness(
          combinedTarget,
          combinedReference,
          language
        )
        
        validationResults[language] = validationResult
        
        // Generate completeness report
        const completenessReport = translationValidator.generateCompletenessReport(
          combinedTarget,
          combinedReference,
          language
        )
        
        completenessReports.push(completenessReport)
      }
      
      // Generate missing keys report
      const allTranslations: { [language: string]: any } = {}
      allTranslations[referenceLanguage] = Object.assign({}, ...Object.values(referenceTranslations))
      
      for (const language of languages) {
        if (language === referenceLanguage) continue
        
        const languageTranslations: any = {}
        for (const namespace of namespaces) {
          languageTranslations[namespace] = await loadTranslationData(language, namespace)
        }
        allTranslations[language] = Object.assign({}, ...Object.values(languageTranslations))
      }
      
      const missingKeysReport = translationValidator.generateMissingKeysReport(
        allTranslations,
        referenceLanguage
      )
      
      // Calculate overall error/warning state
      const hasErrors = Object.values(validationResults).some(result => 
        result.errors.some(error => error.severity === 'error')
      )
      const hasWarnings = Object.values(validationResults).some(result => 
        result.warnings.length > 0 || result.errors.some(error => error.severity === 'warning')
      )
      
      setState(prev => ({
        ...prev,
        isValidating: false,
        validationResults,
        completenessReports,
        missingKeysReport,
        lastValidated: new Date(),
        hasErrors,
        hasWarnings
      }))
      
      return {
        validationResults,
        completenessReports,
        missingKeysReport
      }
    } catch (error) {
      console.error('Translation validation failed:', error)
      setState(prev => ({
        ...prev,
        isValidating: false,
        hasErrors: true
      }))
      throw error
    }
  }, [languages, namespaces, referenceLanguage, loadTranslationData])

  /**
   * Validate a specific language
   */
  const validateLanguage = useCallback(async (language: string) => {
    if (language === referenceLanguage) {
      throw new Error('Cannot validate reference language against itself')
    }
    
    setState(prev => ({ ...prev, isValidating: true }))
    
    try {
      // Load reference and target translations
      const referenceTranslations: any = {}
      const targetTranslations: any = {}
      
      for (const namespace of namespaces) {
        referenceTranslations[namespace] = await loadTranslationData(referenceLanguage, namespace)
        targetTranslations[namespace] = await loadTranslationData(language, namespace)
      }
      
      const combinedReference = Object.assign({}, ...Object.values(referenceTranslations))
      const combinedTarget = Object.assign({}, ...Object.values(targetTranslations))
      
      const validationResult = translationValidator.validateCompleteness(
        combinedTarget,
        combinedReference,
        language
      )
      
      const completenessReport = translationValidator.generateCompletenessReport(
        combinedTarget,
        combinedReference,
        language
      )
      
      setState(prev => ({
        ...prev,
        isValidating: false,
        validationResults: {
          ...prev.validationResults,
          [language]: validationResult
        },
        completenessReports: [
          ...prev.completenessReports.filter(r => r.language !== language),
          completenessReport
        ],
        lastValidated: new Date()
      }))
      
      return { validationResult, completenessReport }
    } catch (error) {
      setState(prev => ({ ...prev, isValidating: false }))
      throw error
    }
  }, [referenceLanguage, namespaces, loadTranslationData])

  /**
   * Get validation summary
   */
  const getValidationSummary = useCallback(() => {
    const { validationResults, completenessReports } = state
    
    const totalLanguages = Object.keys(validationResults).length
    const languagesWithErrors = Object.values(validationResults).filter(result => 
      result.errors.some(error => error.severity === 'error')
    ).length
    const languagesWithWarnings = Object.values(validationResults).filter(result => 
      result.warnings.length > 0
    ).length
    
    const averageCompleteness = completenessReports.length > 0
      ? completenessReports.reduce((sum, report) => sum + report.completeness, 0) / completenessReports.length
      : 0
    
    const totalMissingKeys = Object.values(state.missingKeysReport).reduce(
      (sum: number, report: any) => sum + (report.count || 0), 
      0
    )
    
    return {
      totalLanguages,
      languagesWithErrors,
      languagesWithWarnings,
      averageCompleteness,
      totalMissingKeys,
      isHealthy: languagesWithErrors === 0 && averageCompleteness > 95
    }
  }, [state])

  /**
   * Get missing keys for a specific language
   */
  const getMissingKeys = useCallback((language: string): string[] => {
    const validationResult = state.validationResults[language]
    return validationResult ? validationResult.missingKeys : []
  }, [state.validationResults])

  /**
   * Get validation errors for a specific language
   */
  const getValidationErrors = useCallback((language: string) => {
    const validationResult = state.validationResults[language]
    return validationResult ? {
      errors: validationResult.errors,
      warnings: validationResult.warnings
    } : { errors: [], warnings: [] }
  }, [state.validationResults])

  /**
   * Check if a specific translation key exists across languages
   */
  const checkKeyExistence = useCallback(async (key: string) => {
    const results: { [language: string]: boolean } = {}
    
    for (const language of languages) {
      try {
        // This would need to be implemented to check actual translation data
        // For now, we'll use the validation results if available
        const validationResult = state.validationResults[language]
        if (validationResult) {
          results[language] = !validationResult.missingKeys.includes(key)
        } else {
          results[language] = false
        }
      } catch (error) {
        results[language] = false
      }
    }
    
    return results
  }, [languages, state.validationResults])

  // Auto-validation
  useEffect(() => {
    if (!autoValidate) return
    
    // Initial validation
    validateTranslations()
    
    // Set up interval
    const interval = setInterval(validateTranslations, validationInterval)
    
    return () => clearInterval(interval)
  }, [autoValidate, validationInterval, validateTranslations])

  // Re-validate when language changes
  useEffect(() => {
    if (autoValidate && state.lastValidated) {
      // Debounce validation when language changes
      const timeoutId = setTimeout(validateTranslations, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [i18n.language, autoValidate, validateTranslations, state.lastValidated])

  return {
    // State
    ...state,
    
    // Actions
    validateTranslations,
    validateLanguage,
    checkKeyExistence,
    
    // Getters
    getValidationSummary,
    getMissingKeys,
    getValidationErrors,
    
    // Computed properties
    validationSummary: getValidationSummary()
  }
}