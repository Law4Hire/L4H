import React from 'react';
export interface SearchableSelectOption {
    value: string;
    label: string;
    iso2?: string;
    iso3?: string;
}
export interface SearchableSelectProps {
    label?: string;
    placeholder?: string;
    options: SearchableSelectOption[];
    value?: string;
    onChange: (value: string | null) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    loading?: boolean;
    noOptionsMessage?: string;
    className?: string;
    id?: string;
}
export declare const SearchableSelect: React.FC<SearchableSelectProps>;
