import { jsx as _jsx } from "react/jsx-runtime";
import { useRTL } from '../hooks/useRTL';
/**
 * RTL-aware number formatting component
 * Automatically formats numbers according to the current language locale
 */
export function RTLNumber({ value, format = 'number', currency = 'USD', minimumFractionDigits, maximumFractionDigits, className, style, }) {
    const { formatNumber } = useRTL();
    const formatOptions = {
        minimumFractionDigits,
        maximumFractionDigits,
    };
    if (format === 'currency') {
        formatOptions.style = 'currency';
        formatOptions.currency = currency;
    }
    else if (format === 'percent') {
        formatOptions.style = 'percent';
    }
    const formattedValue = formatNumber(value, formatOptions);
    return (_jsx("span", { className: `number-display ${className || ''}`, style: {
            direction: 'ltr',
            unicodeBidi: 'embed',
            ...style
        }, children: formattedValue }));
}
/**
 * RTL-aware date formatting component
 * Automatically formats dates according to the current language locale
 */
export function RTLDate({ date, format = 'medium', dateStyle, timeStyle, className, style, }) {
    const { formatDate } = useRTL();
    const formatOptions = {};
    if (dateStyle || timeStyle) {
        formatOptions.dateStyle = dateStyle;
        formatOptions.timeStyle = timeStyle;
    }
    else {
        switch (format) {
            case 'short':
                formatOptions.dateStyle = 'short';
                break;
            case 'medium':
                formatOptions.dateStyle = 'medium';
                break;
            case 'long':
                formatOptions.dateStyle = 'long';
                break;
            case 'full':
                formatOptions.dateStyle = 'full';
                break;
        }
    }
    const formattedDate = formatDate(date, formatOptions);
    return (_jsx("span", { className: `date-display ${className || ''}`, style: style, children: formattedDate }));
}
