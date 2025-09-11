import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { clsx } from 'clsx';
const variantClasses = {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
};
const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
};
export const Input = forwardRef(({ variant = 'default', size = 'md', label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const currentVariant = hasError ? 'error' : variant;
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: inputId, className: "block text-sm font-medium text-gray-700 mb-1", children: label })), _jsx("input", { ref: ref, id: inputId, className: clsx(
                // Base styles
                'block w-full rounded-md border shadow-sm transition-colors', 'focus:outline-none focus:ring-1', 'disabled:opacity-50 disabled:cursor-not-allowed', 'placeholder:text-gray-400', 
                // Variant styles
                variantClasses[currentVariant], 
                // Size styles
                sizeClasses[size], className), "aria-invalid": hasError, "aria-describedby": clsx(error && `${inputId}-error`, helperText && `${inputId}-helper`), ...props }), error && (_jsx("p", { id: `${inputId}-error`, className: "mt-1 text-sm text-error-600", role: "alert", children: error })), helperText && !error && (_jsx("p", { id: `${inputId}-helper`, className: "mt-1 text-sm text-gray-500", children: helperText }))] }));
});
Input.displayName = 'Input';
