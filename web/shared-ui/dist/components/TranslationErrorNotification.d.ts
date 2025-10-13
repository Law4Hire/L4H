interface TranslationErrorNotificationProps {
    language: string;
    onRetry?: () => void;
    onDismiss?: () => void;
    className?: string;
}
export declare function TranslationErrorNotification({ language, onRetry, onDismiss, className }: TranslationErrorNotificationProps): import("react/jsx-runtime").JSX.Element | null;
export default TranslationErrorNotification;
