import { LucideIcon } from 'lucide-react';
export interface IconProps {
    icon: LucideIcon;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    'aria-label'?: string;
    'aria-hidden'?: boolean;
}
export declare function Icon({ icon: IconComponent, size, className, 'aria-label': ariaLabel, 'aria-hidden': ariaHidden, ...props }: IconProps): import("react/jsx-runtime").JSX.Element;
export { Menu, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowLeft, ArrowRight, Home, Settings, User, LogOut, Plus, Minus, Edit, Trash2, Save, Check, X as Close, CheckCircle, AlertCircle, Info, AlertTriangle, Upload, Download, File, Image, Video, Mail, Phone, MessageCircle, Calendar, Clock, Search, Filter, Sun, Moon, Globe, Loader2, } from 'lucide-react';
