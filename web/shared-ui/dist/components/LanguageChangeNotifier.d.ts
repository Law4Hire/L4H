export interface LanguageChangeNotifierProps {
    /**
     * Whether to show visual notification
     * @default false
     */
    showVisualNotification?: boolean;
    /**
     * Duration to show visual notification (ms)
     * @default 3000
     */
    notificationDuration?: number;
    /**
     * Custom message template for language change
     */
    messageTemplate?: (language: string, displayName: string) => string;
    /**
     * Whether to announce to screen readers
     * @default true
     */
    announceToScreenReader?: boolean;
    /**
     * Custom CSS class for visual notification
     */
    notificationClassName?: string;
}
/**
 * Component that notifies users and assistive technologies about language changes
 */
export declare function LanguageChangeNotifier({ showVisualNotification, notificationDuration, messageTemplate, announceToScreenReader, notificationClassName }: LanguageChangeNotifierProps): import("react/jsx-runtime").JSX.Element | null;
/**
 * Hook for listening to language change announcements
 */
export declare function useLanguageChangeListener(callback: (event: CustomEvent<{
    language: string;
    displayName: string;
    message: string;
}>) => void): void;
/**
 * Component that provides a live region specifically for language announcements
 */
export declare function LanguageAnnouncementRegion(): import("react/jsx-runtime").JSX.Element;
