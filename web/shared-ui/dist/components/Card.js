import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
export const Card = ({ children, className, title, actions, variant = 'default', padding = 'md' }) => {
    const variantClasses = {
        default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
        elevated: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg',
        outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-none'
    };
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };
    return (_jsxs("div", { className: clsx('rounded-lg transition-shadow hover:shadow-md', variantClasses[variant], className), children: [(title || actions) && (_jsxs("div", { className: "px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between", children: [title && (_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-gray-100", children: title })), actions && (_jsx("div", { className: "flex items-center space-x-2", children: actions }))] })), _jsx("div", { className: clsx(paddingClasses[padding], title || actions ? '' : 'rounded-lg'), children: children })] }));
};
