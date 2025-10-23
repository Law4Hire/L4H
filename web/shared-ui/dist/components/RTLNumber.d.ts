import React from 'react';
export interface RTLNumberProps {
    value: number;
    format?: 'number' | 'currency' | 'percent' | 'filesize' | 'duration';
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    binary?: boolean;
    durationStyle?: 'long' | 'short' | 'narrow';
    className?: string;
    style?: React.CSSProperties;
}
/**
 * RTL-aware number formatting component
 * Automatically formats numbers according to the current language locale
 */
export declare function RTLNumber({ value, format, currency, minimumFractionDigits, maximumFractionDigits, binary, durationStyle, className, style, }: RTLNumberProps): import("react/jsx-runtime").JSX.Element;
export interface RTLDateProps {
    date: Date;
    format?: 'short' | 'medium' | 'long' | 'full';
    dateStyle?: Intl.DateTimeFormatOptions['dateStyle'];
    timeStyle?: Intl.DateTimeFormatOptions['timeStyle'];
    className?: string;
    style?: React.CSSProperties;
}
export interface RTLRelativeTimeProps {
    date: Date;
    numeric?: 'always' | 'auto';
    formatStyle?: 'long' | 'short' | 'narrow';
    className?: string;
    style?: React.CSSProperties;
}
/**
 * RTL-aware date formatting component
 * Automatically formats dates according to the current language locale
 */
export declare function RTLDate({ date, format, dateStyle, timeStyle, className, style, }: RTLDateProps): import("react/jsx-runtime").JSX.Element;
/**
 * RTL-aware relative time formatting component
 * Automatically formats relative time according to the current language locale
 */
export declare function RTLRelativeTime({ date, numeric, formatStyle: relativeStyle, className, style, }: RTLRelativeTimeProps): import("react/jsx-runtime").JSX.Element;
