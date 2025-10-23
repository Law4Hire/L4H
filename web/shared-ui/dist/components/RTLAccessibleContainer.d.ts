import React from 'react';
export interface RTLAccessibleContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Content to render
     */
    children: React.ReactNode;
    /**
     * Whether to manage focus order for RTL layouts
     * @default true
     */
    manageFocusOrder?: boolean;
    /**
     * Whether to adjust keyboard navigation for RTL
     * @default true
     */
    adjustKeyboardNavigation?: boolean;
    /**
     * Custom focus order selectors for RTL layouts
     */
    customFocusOrder?: string[];
    /**
     * Elements to exclude from RTL focus management
     */
    excludeFromFocusManagement?: string[];
    /**
     * HTML element type to render
     * @default 'div'
     */
    as?: keyof JSX.IntrinsicElements;
    /**
     * Whether to set ARIA attributes automatically
     * @default true
     */
    setAriaAttributes?: boolean;
}
/**
 * Container component that provides RTL-aware accessibility features
 */
export declare const RTLAccessibleContainer: React.ForwardRefExoticComponent<RTLAccessibleContainerProps & React.RefAttributes<HTMLElement>>;
/**
 * Specialized container for RTL-aware form layouts
 */
export declare const RTLAccessibleForm: React.ForwardRefExoticComponent<Omit<RTLAccessibleContainerProps, "as"> & React.RefAttributes<HTMLFormElement>>;
/**
 * Specialized container for RTL-aware navigation menus
 */
export declare const RTLAccessibleNavigation: React.ForwardRefExoticComponent<Omit<RTLAccessibleContainerProps, "as"> & {
    /**
     * Navigation orientation
     * @default 'horizontal'
     */
    orientation?: "horizontal" | "vertical";
} & React.RefAttributes<HTMLElement>>;
/**
 * Specialized container for RTL-aware dialog/modal content
 */
export declare const RTLAccessibleDialog: React.ForwardRefExoticComponent<Omit<RTLAccessibleContainerProps, "as"> & {
    /**
     * Dialog title (for accessibility)
     */
    title?: string;
    /**
     * Dialog description (for accessibility)
     */
    description?: string;
} & React.RefAttributes<HTMLDivElement>>;
/**
 * Specialized container for RTL-aware data tables
 */
export declare const RTLAccessibleTable: React.ForwardRefExoticComponent<Omit<RTLAccessibleContainerProps, "children" | "as"> & {
    /**
     * Table content
     */
    children: React.ReactNode;
    /**
     * Table caption for accessibility
     */
    caption?: string;
} & React.RefAttributes<HTMLTableElement>>;
