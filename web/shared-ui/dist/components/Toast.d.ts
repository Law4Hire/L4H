export interface ToastProps {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
    onClose: (id: string) => void;
}
export declare function Toast({ id, type, title, message, duration, onClose }: ToastProps): import("react/jsx-runtime").JSX.Element;
export interface ToastContainerProps {
    toasts: ToastProps[];
    onClose: (id: string) => void;
}
export declare function ToastContainer({ toasts, onClose }: ToastContainerProps): import("react").ReactPortal | null;
export declare function useToast(): {
    toasts: ToastProps[];
    addToast: (toast: Omit<ToastProps, "id" | "onClose">) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
};
