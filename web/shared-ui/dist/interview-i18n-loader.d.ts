/**
 * CSV-based Interview i18n Loader
 * Loads SpecSQL/routing_questions.csv and generates translation resources
 */
/**
 * Register interview resources with i18next
 */
export declare function registerInterviewResources(i18n: any): Promise<void>;
/**
 * Helper to get localized question text
 */
export declare function getQuestionText(t: any, questionId: string, fallbackText: string): string;
/**
 * Helper to get localized option text
 */
export declare function getOptionText(t: any, questionId: string, optionIndex: number, fallbackText: string): string;
/**
 * Helper to get localized outcome text
 */
export declare function getOutcomeText(t: any, outcomeId: string, field: 'code' | 'label' | 'notes' | 'attorney', fallbackText: string): string;
