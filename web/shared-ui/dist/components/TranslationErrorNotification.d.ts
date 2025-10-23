export interface TranslationErrorNotificationProps {
    language: string;
    namespaces?: string[];
    onRetry?: (language: string, namespaces: string[]) => Promise<void | boolean>;
    onDismiss?: () => void;
    onLanguageSwitch?: (newLanguage: string) => void;
    className?: string;
    autoRetry?: boolean;
    maxAutoRetries?: number;
    showFallbackOptions?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}
export declare function TranslationErrorNotification({ language, namespaces, onRetry, onDismiss, onLanguageSwitch, className, autoRetry, maxAutoRetries, showFallbackOptions, position }: TranslationErrorNotificationProps): import("react/jsx-runtime").JSX.Element | null;
export default TranslationErrorNotification;
