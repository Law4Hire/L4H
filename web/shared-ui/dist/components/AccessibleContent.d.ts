import React from 'react';
export interface AccessibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Content to render
     */
    children: React.ReactNode;
    /**
     * Override the language for this content
     */
    language?: string;
    /**
     * Whether to announce content changes to screen readers
     * @default false
     */
    announceChanges?: boolean;
    /**
     * Priority for screen reader announcements
     * @default 'polite'
     */
    announcementPriority?: 'polite' | 'assertive';
    /**
     * Whether to set lang attribute on the element
     * @default true
     */
    setLangAttribute?: boolean;
    /**
     * Whether to set dir attribute on the element
     * @default true
     */
    setDirAttribute?: boolean;
    /**
     * Custom text alignment based on language direction
     */
    textAlign?: 'start' | 'end' | 'left' | 'right' | 'center';
    /**
     * HTML element type to render
     * @default 'div'
     */
    as?: keyof JSX.IntrinsicElements;
}
/**
 * Component that provides accessibility features for multilingual content
 */
export declare const AccessibleContent: React.ForwardRefExoticComponent<AccessibleContentProps & React.RefAttributes<HTMLElement>>;
/**
 * Specialized component for accessible text content
 */
export declare const AccessibleText: React.ForwardRefExoticComponent<Omit<AccessibleContentProps, "as"> & {
    as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
} & React.RefAttributes<HTMLElement>>;
/**
 * Specialized component for accessible headings
 */
export declare const AccessibleHeading: React.ForwardRefExoticComponent<Omit<AccessibleContentProps, "as"> & {
    level: 1 | 2 | 3 | 4 | 5 | 6;
} & React.RefAttributes<HTMLHeadingElement>>;
/**
 * Component for live regions that announce content changes
 */
export declare const AccessibleLiveRegion: React.ForwardRefExoticComponent<Omit<AccessibleContentProps, "announceChanges" | "as"> & {
    /**
     * Live region politeness level
     * @default 'polite'
     */
    live?: "off" | "polite" | "assertive";
    /**
     * Whether the entire live region should be announced when any part changes
     * @default true
     */
    atomic?: boolean;
} & React.RefAttributes<HTMLDivElement>>;
