import React from 'react';
interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    actions?: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}
export declare const Card: React.FC<CardProps>;
export {};
