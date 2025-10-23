export interface AccessibilityI18nOptions {
    /**
     * Whether to announce language changes to screen readers
     * @default true
     */
    announceLanguageChanges?: boolean;
    /**
     * Whether to update HTML lang attributes automatically
     * @default true
     */
    updateLangAttributes?: boolean;
    /**
     * Whether to announce translation loading states
     * @default false
     */
    announceLoadingStates?: boolean;
    /**
     * Custom announcement messages
     */
    customMessages?: {
        languageChanged?: (language: string, displayName: string) => string;
        translationsLoaded?: (language: string) => string;
        translationsFailed?: (language: string) => string;
    };
}
export interface AccessibilityI18nReturn {
    /**
     * Current language code
     */
    currentLanguage: string;
    /**
     * Whether current language is RTL
     */
    isRTL: boolean;
    /**
     * Text direction for current language
     */
    textDirection: 'ltr' | 'rtl';
    /**
     * Announce a message to screen readers
     */
    announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
    /**
     * Set language attribute on an element
     */
    setElementLanguage: (element: HTMLElement, language?: string) => void;
    /**
     * Get appropriate ARIA attributes for current language
     */
    getAriaAttributes: () => {
        lang: string;
        dir: 'ltr' | 'rtl';
    };
    /**
     * Get language-appropriate text alignment
     */
    getTextAlign: (align?: 'start' | 'end' | 'left' | 'right' | 'center') => string;
}
/**
 * Hook for managing accessibility features in multilingual context
 */
export declare function useAccessibilityI18n(options?: AccessibilityI18nOptions): AccessibilityI18nReturn;
