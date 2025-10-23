export interface RTLAccessibilityOptions {
    /**
     * Whether to manage focus order for RTL layouts
     * @default true
     */
    manageFocusOrder?: boolean;
    /**
     * Whether to adjust keyboard navigation for RTL
     * @default true
     */
    adjustKeyboardNavigation?: boolean;
    /**
     * Whether to announce direction changes to screen readers
     * @default true
     */
    announceDirectionChanges?: boolean;
    /**
     * Custom focus order for RTL layouts
     */
    customFocusOrder?: string[];
    /**
     * Elements to exclude from RTL focus management
     */
    excludeFromFocusManagement?: string[];
}
export interface RTLAccessibilityReturn {
    /**
     * Whether current language is RTL
     */
    isRTL: boolean;
    /**
     * Text direction for current language
     */
    textDirection: 'ltr' | 'rtl';
    /**
     * Get appropriate keyboard navigation direction
     */
    getNavigationDirection: (key: string) => 'forward' | 'backward' | 'up' | 'down' | null;
    /**
     * Set up RTL-aware focus management for a container
     */
    setupRTLFocusManagement: (container: HTMLElement) => () => void;
    /**
     * Get RTL-appropriate ARIA attributes
     */
    getRTLAriaAttributes: () => {
        dir: 'ltr' | 'rtl';
        'aria-orientation'?: 'horizontal' | 'vertical';
    };
    /**
     * Handle RTL-aware keyboard navigation
     */
    handleRTLKeyboardNavigation: (event: KeyboardEvent, container: HTMLElement) => boolean;
}
/**
 * Hook for managing RTL-specific accessibility features
 */
export declare function useRTLAccessibility(options?: RTLAccessibilityOptions): RTLAccessibilityReturn;
