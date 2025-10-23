import { ValidationResult, CompletenessReport } from '../services/TranslationValidator';
export interface UseTranslationValidationOptions {
    languages?: string[];
    namespaces?: string[];
    referenceLanguage?: string;
    autoValidate?: boolean;
    validationInterval?: number;
}
export interface TranslationValidationState {
    isValidating: boolean;
    validationResults: {
        [language: string]: ValidationResult;
    };
    completenessReports: CompletenessReport[];
    missingKeysReport: any;
    lastValidated: Date | null;
    hasErrors: boolean;
    hasWarnings: boolean;
}
export declare function useTranslationValidation(options?: UseTranslationValidationOptions): {
    validateTranslations: () => Promise<{
        validationResults: {
            [language: string]: ValidationResult;
        };
        completenessReports: CompletenessReport[];
        missingKeysReport: import("../translation-system").MissingKeysReport;
    }>;
    validateLanguage: (language: string) => Promise<{
        validationResult: ValidationResult;
        completenessReport: CompletenessReport;
    }>;
    checkKeyExistence: (key: string) => Promise<{
        [language: string]: boolean;
    }>;
    getValidationSummary: () => {
        totalLanguages: number;
        languagesWithErrors: number;
        languagesWithWarnings: number;
        averageCompleteness: number;
        totalMissingKeys: number;
        isHealthy: boolean;
    };
    getMissingKeys: (language: string) => string[];
    getValidationErrors: (language: string) => {
        errors: import("../translation-system").ValidationError[];
        warnings: import("../translation-system").ValidationWarning[];
    };
    validationSummary: {
        totalLanguages: number;
        languagesWithErrors: number;
        languagesWithWarnings: number;
        averageCompleteness: number;
        totalMissingKeys: number;
        isHealthy: boolean;
    };
    isValidating: boolean;
    validationResults: {
        [language: string]: ValidationResult;
    };
    completenessReports: CompletenessReport[];
    missingKeysReport: any;
    lastValidated: Date | null;
    hasErrors: boolean;
    hasWarnings: boolean;
};
