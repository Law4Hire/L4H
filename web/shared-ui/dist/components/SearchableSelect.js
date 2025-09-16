import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
export const SearchableSelect = ({ label, placeholder = "Search...", options, value, onChange, onFocus, onBlur, error, disabled = false, required = false, loading = false, noOptionsMessage = "No options found", className, id }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const listRef = useRef(null);
    // Filter options based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredOptions(options);
        }
        else {
            const filtered = options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                option.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (option.iso2 && option.iso2.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (option.iso3 && option.iso3.toLowerCase().includes(searchTerm.toLowerCase())));
            setFilteredOptions(filtered);
        }
        setHighlightedIndex(-1);
    }, [searchTerm, options]);
    // Set display text based on selected value
    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : searchTerm;
    useEffect(() => {
        if (!isOpen && selectedOption) {
            setSearchTerm('');
        }
    }, [isOpen, selectedOption]);
    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        if (!isOpen) {
            setIsOpen(true);
        }
    };
    const handleInputFocus = () => {
        setIsOpen(true);
        onFocus?.();
    };
    const handleInputBlur = () => {
        // Delay blur to allow for option clicks
        setTimeout(() => {
            // Only clear search term if we don't have a selection and the dropdown is closing
            if (!selectedOption && searchTerm && !isOpen) {
                setSearchTerm('');
            }
            onBlur?.();
        }, 150);
    };
    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => prev < filteredOptions.length - 1 ? prev + 1 : 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : filteredOptions.length - 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    selectOption(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                inputRef.current?.blur();
                break;
        }
    };
    const selectOption = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
    };
    return (_jsxs("div", { className: clsx("relative", className), ref: containerRef, children: [label && (_jsxs("label", { htmlFor: id, className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })), _jsxs("div", { className: "relative", children: [_jsx("input", { ref: inputRef, type: "text", id: id, className: clsx("block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset", "placeholder:text-gray-400 dark:placeholder:text-gray-500", "focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-400", "sm:text-sm sm:leading-6", "bg-white dark:bg-gray-800", error
                            ? "ring-red-300 dark:ring-red-600"
                            : "ring-gray-300 dark:ring-gray-600", disabled && "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"), placeholder: placeholder, value: isOpen ? searchTerm : displayText, onChange: handleInputChange, onFocus: handleInputFocus, onBlur: handleInputBlur, onKeyDown: handleKeyDown, disabled: disabled, autoComplete: "off" }), _jsx("div", { className: "absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none", children: loading ? (_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" })) : (_jsx("svg", { className: clsx("h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform", isOpen && "rotate-180"), viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z", clipRule: "evenodd" }) })) })] }), isOpen && (_jsx("div", { className: "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm", children: _jsx("ul", { ref: listRef, className: "divide-y divide-gray-200 dark:divide-gray-700", children: filteredOptions.length > 0 ? (filteredOptions.map((option, index) => (_jsx("li", { children: _jsxs("button", { type: "button", className: clsx("relative w-full cursor-pointer select-none py-2 pl-3 pr-9 text-left", "hover:bg-gray-50 dark:hover:bg-gray-700", index === highlightedIndex && "bg-blue-50 dark:bg-blue-900/20", "focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20"), onClick: () => selectOption(option), onMouseEnter: () => setHighlightedIndex(index), children: [_jsx("span", { className: "block truncate text-gray-900 dark:text-gray-100", children: option.label }), option.value === value && (_jsx("span", { className: "absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 dark:text-blue-400", children: _jsx("svg", { className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z", clipRule: "evenodd" }) }) }))] }) }, option.value)))) : (_jsx("li", { className: "relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500 dark:text-gray-400", children: noOptionsMessage })) }) })), error && (_jsx("p", { className: "mt-2 text-sm text-red-600 dark:text-red-400", role: "alert", children: error }))] }));
};
