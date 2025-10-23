import { jsx as _jsx } from "react/jsx-runtime";
import { useRTL } from '../hooks/useRTL';
/**
 * RTL-aware number formatting component
 * Automatically formats numbers according to the current language locale
 */
export function RTLNumber({ value, format = 'number', currency = 'USD', minimumFractionDigits, maximumFractionDigits, binary = false, durationStyle = 'short', className, style, }) {
    const { formatNumber, formatCurrency, formatPercentage, formatFileSize, formatDuration } = useRTL();
    let formattedValue;
    switch (format) {
        case 'currency':
            formattedValue = formatCurrency(value, currency, {
                minimumFractionDigits,
                maximumFractionDigits,
            });
            break;
        case 'percent':
            formattedValue = formatPercentage(value, {
                minimumFractionDigits,
                maximumFractionDigits,
            });
            break;
        case 'filesize':
            formattedValue = formatFileSize(value, { binary });
            break;
        case 'duration':
            formattedValue = formatDuration(value, { style: durationStyle });
            break;
        default:
            formattedValue = formatNumber(value, {
                minimumFractionDigits,
                maximumFractionDigits,
            });
            break;
    }
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
/**
 * RTL-aware relative time formatting component
 * Automatically formats relative time according to the current language locale
 */
export function RTLRelativeTime({ date, numeric = 'auto', formatStyle: relativeStyle = 'long', className, style, }) {
    const { formatRelativeTime } = useRTL();
    const formattedTime = formatRelativeTime(date, {
        numeric,
        style: relativeStyle,
    });
    return (_jsx("span", { className: `relative-time-display ${className || ''}`, style: style, title: date.toLocaleString(), children: formattedTime }));
}
