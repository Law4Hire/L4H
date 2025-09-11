import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from '../Icon';
const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};
export function Modal({ open, onClose, title, size = 'md', showCloseButton = true, className, children, }) {
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);
    // Handle escape key
    useEffect(() => {
        if (!open)
            return;
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);
    // Handle focus management
    useEffect(() => {
        if (!open)
            return;
        // Store the previously focused element
        previousActiveElement.current = document.activeElement;
        // Focus the modal
        const modal = modalRef.current;
        if (modal) {
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements[0];
            if (firstElement) {
                firstElement.focus();
            }
        }
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        return () => {
            // Restore body scroll
            document.body.style.overflow = 'unset';
            // Restore focus to previously focused element
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        };
    }, [open]);
    // Handle backdrop click
    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };
    if (!open)
        return null;
    const modalContent = (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", "data-testid": "modal-backdrop", onClick: handleBackdropClick, children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50" }), _jsxs("div", { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": title ? 'modal-title' : undefined, className: clsx('relative w-full rounded-lg bg-white shadow-xl', sizeClasses[size], className), "data-testid": "modal-content", onClick: (e) => e.stopPropagation(), children: [(title || showCloseButton) && (_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [title && (_jsx("h2", { id: "modal-title", className: "text-lg font-semibold text-gray-900", children: title })), showCloseButton && (_jsx("button", { type: "button", onClick: onClose, className: "rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500", "aria-label": "Close modal", children: _jsx(X, { className: "h-5 w-5" }) }))] })), _jsx("div", { className: "p-6", children: children })] })] }));
    // Render modal in portal
    return createPortal(modalContent, document.body);
}
