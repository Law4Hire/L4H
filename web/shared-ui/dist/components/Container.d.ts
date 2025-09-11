import React from 'react';
interface ContainerProps {
    children: React.ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}
export declare function Container({ children, className, size, padding }: ContainerProps): import("react/jsx-runtime").JSX.Element;
export {};
