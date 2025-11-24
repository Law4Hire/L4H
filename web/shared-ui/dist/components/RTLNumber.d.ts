import React from 'react';
interface RTLNumberProps {
    value: number;
    format?: 'decimal' | 'currency' | 'percent';
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
}
export declare const RTLNumber: React.FC<RTLNumberProps>;
export {};
