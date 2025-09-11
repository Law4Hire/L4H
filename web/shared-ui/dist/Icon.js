import { jsx as _jsx } from "react/jsx-runtime";
import { clsx } from 'clsx';
const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
};
export function Icon({ icon: IconComponent, size = 'md', className, 'aria-label': ariaLabel, 'aria-hidden': ariaHidden = !ariaLabel, ...props }) {
    return (_jsx(IconComponent, { className: clsx(sizeClasses[size], 'inline-block', className), "aria-label": ariaLabel, "aria-hidden": ariaHidden, ...props }));
}
// Re-export commonly used icons for convenience
export { 
// Navigation
Menu, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowLeft, ArrowRight, Home, Settings, User, LogOut, 
// Actions
Plus, Minus, Edit, Trash2, Save, Check, X as Close, 
// Status
CheckCircle, AlertCircle, Info, AlertTriangle, 
// Media
Upload, Download, File, Image, Video, 
// Communication
Mail, Phone, MessageCircle, 
// Time
Calendar, Clock, 
// Search
Search, Filter, 
// Theme
Sun, Moon, 
// Language
Globe, 
// Loading
Loader2, } from 'lucide-react';
