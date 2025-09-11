import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
export function EmptyState({ icon: IconComponent, title, description, action, className }) {
    return (_jsxs("div", { className: clsx('flex flex-col items-center justify-center py-12 px-4 text-center', className), children: [IconComponent && (_jsx("div", { className: "mb-4", children: _jsx(IconComponent, { className: "h-12 w-12 text-gray-400", "aria-hidden": "true" }) })), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: title }), description && (_jsx("p", { className: "text-sm text-gray-500 mb-6 max-w-sm", children: description })), action && (_jsx("div", { className: "flex-shrink-0", children: action }))] }));
}
