import React from 'react';
import { LucideIcon } from 'lucide-react';
interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}
export declare function EmptyState({ icon: IconComponent, title, description, action, className }: EmptyStateProps): import("react/jsx-runtime").JSX.Element;
export {};
