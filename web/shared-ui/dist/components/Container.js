import { jsx as _jsx } from "react/jsx-runtime";
import { clsx } from 'clsx';
const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
};
const paddingClasses = {
    none: '',
    sm: 'px-4 py-6',
    md: 'px-6 py-8',
    lg: 'px-8 py-12'
};
export function Container({ children, className, size = 'lg', padding = 'md' }) {
    return (_jsx("div", { className: clsx('mx-auto w-full', sizeClasses[size], paddingClasses[padding], className), children: children }));
}
