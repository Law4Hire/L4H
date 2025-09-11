import React from 'react';
interface User {
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
}
interface LayoutProps {
    children: React.ReactNode;
    title?: string;
    showUserMenu?: boolean;
    user?: User | null;
    isAuthenticated?: boolean;
}
export declare const Layout: React.FC<LayoutProps>;
export {};
