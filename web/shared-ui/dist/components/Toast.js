import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from '../Icon';
const typeConfig = {
    success: {
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-400',
        titleColor: 'text-green-800',
        messageColor: 'text-green-700'
    },
    error: {
        icon: AlertCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-400',
        titleColor: 'text-red-800',
        messageColor: 'text-red-700'
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-400',
        titleColor: 'text-yellow-800',
        messageColor: 'text-yellow-700'
    },
    info: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-400',
        titleColor: 'text-blue-800',
        messageColor: 'text-blue-700'
    }
};
export function Toast({ id, type, title, message, duration = 5000, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const config = typeConfig[type];
    const IconComponent = config.icon;
    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);
    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            onClose(id);
        }, 300); // Match CSS transition duration
    };
    return (_jsx("div", { className: clsx('pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-in-out', config.bgColor, config.borderColor, isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'), role: "alert", "aria-live": "polite", "aria-atomic": "true", children: _jsx("div", { className: "p-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(IconComponent, { className: clsx('h-5 w-5', config.iconColor), "aria-hidden": "true" }) }), _jsxs("div", { className: "ml-3 w-0 flex-1", children: [_jsx("p", { className: clsx('text-sm font-medium', config.titleColor), children: title }), message && (_jsx("p", { className: clsx('mt-1 text-sm', config.messageColor), children: message }))] }), _jsx("div", { className: "ml-4 flex flex-shrink-0", children: _jsx("button", { type: "button", className: clsx('inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2', config.iconColor, 'hover:opacity-75 focus:ring-offset-green-50 focus:ring-green-600'), onClick: handleClose, "aria-label": "Close notification", children: _jsx(X, { className: "h-4 w-4", "aria-hidden": "true" }) }) })] }) }) }));
}
export function ToastContainer({ toasts, onClose }) {
    if (toasts.length === 0)
        return null;
    return createPortal(_jsx("div", { className: "pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6", "aria-live": "polite", "aria-label": "Notifications", children: _jsx("div", { className: "flex w-full flex-col items-center space-y-4 sm:items-end", children: toasts.map((toast) => (_jsx(Toast, { ...toast, onClose: onClose }, toast.id))) }) }), document.body);
}
// Toast hook for managing toasts
export function useToast() {
    const [toasts, setToasts] = useState([]);
    const addToast = (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = {
            ...toast,
            id,
            onClose: removeToast
        };
        setToasts(prev => [...prev, newToast]);
    };
    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };
    const success = (title, message, duration) => {
        addToast({ type: 'success', title, message, duration });
    };
    const error = (title, message, duration) => {
        addToast({ type: 'error', title, message, duration });
    };
    const warning = (title, message, duration) => {
        addToast({ type: 'warning', title, message, duration });
    };
    const info = (title, message, duration) => {
        addToast({ type: 'info', title, message, duration });
    };
    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info
    };
}
