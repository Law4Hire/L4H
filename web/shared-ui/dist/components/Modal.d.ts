import React from 'react';
export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
    className?: string;
    children: React.ReactNode;
}
export declare function Modal({ open, onClose, title, size, showCloseButton, className, children, }: ModalProps): React.ReactPortal | null;
