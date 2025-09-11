// import { isRTL } from './i18n' // Commented out unused import
// Currency formatting
export function formatCurrency(amount, currency = 'USD', locale) {
    const currentLocale = locale || getCurrentLocale();
    try {
        return new Intl.NumberFormat(currentLocale, {
            style: 'currency',
            currency: currency,
        }).format(amount);
    }
    catch (error) {
        console.warn('Currency formatting failed, using fallback:', error);
        return `${currency} ${amount.toFixed(2)}`;
    }
}
// Date formatting
export function formatDate(date, options, locale) {
    const currentLocale = locale || getCurrentLocale();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    try {
        return new Intl.DateTimeFormat(currentLocale, {
            ...defaultOptions,
            ...options,
        }).format(dateObj);
    }
    catch (error) {
        console.warn('Date formatting failed, using fallback:', error);
        return dateObj.toLocaleDateString();
    }
}
// Time formatting
export function formatTime(date, options, locale) {
    const currentLocale = locale || getCurrentLocale();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };
    try {
        return new Intl.DateTimeFormat(currentLocale, {
            ...defaultOptions,
            ...options,
        }).format(dateObj);
    }
    catch (error) {
        console.warn('Time formatting failed, using fallback:', error);
        return dateObj.toLocaleTimeString();
    }
}
// DateTime formatting
export function formatDateTime(date, options, locale) {
    const currentLocale = locale || getCurrentLocale();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };
    try {
        return new Intl.DateTimeFormat(currentLocale, {
            ...defaultOptions,
            ...options,
        }).format(dateObj);
    }
    catch (error) {
        console.warn('DateTime formatting failed, using fallback:', error);
        return dateObj.toLocaleString();
    }
}
// Number formatting
export function formatNumber(number, options, locale) {
    const currentLocale = locale || getCurrentLocale();
    try {
        return new Intl.NumberFormat(currentLocale, options).format(number);
    }
    catch (error) {
        console.warn('Number formatting failed, using fallback:', error);
        return number.toString();
    }
}
// Relative time formatting (e.g., "2 hours ago")
export function formatRelativeTime(date, options, locale) {
    const currentLocale = locale || getCurrentLocale();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    const defaultOptions = {
        numeric: 'auto',
    };
    try {
        const rtf = new Intl.RelativeTimeFormat(currentLocale, {
            ...defaultOptions,
            ...options,
        });
        // Determine the appropriate unit and value
        if (Math.abs(diffInSeconds) < 60) {
            return rtf.format(diffInSeconds, 'second');
        }
        else if (Math.abs(diffInSeconds) < 3600) {
            return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
        }
        else if (Math.abs(diffInSeconds) < 86400) {
            return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
        }
        else if (Math.abs(diffInSeconds) < 2592000) {
            return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
        }
        else if (Math.abs(diffInSeconds) < 31536000) {
            return rtf.format(Math.floor(diffInSeconds / 2592000), 'month');
        }
        else {
            return rtf.format(Math.floor(diffInSeconds / 31536000), 'year');
        }
    }
    catch (error) {
        console.warn('Relative time formatting failed, using fallback:', error);
        return formatDateTime(dateObj, { month: 'short', day: 'numeric' });
    }
}
// Get current locale from i18n
function getCurrentLocale() {
    // Try to get from i18n first
    if (typeof window !== 'undefined' && window.i18n) {
        return window.i18n.language;
    }
    // Fallback to browser locale
    return navigator.language || 'en-US';
}
// File size formatting
export function formatFileSize(bytes, locale) {
    const currentLocale = locale || getCurrentLocale();
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);
    try {
        return new Intl.NumberFormat(currentLocale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        }).format(size) + ' ' + sizes[i];
    }
    catch (error) {
        console.warn('File size formatting failed, using fallback:', error);
        return size.toFixed(1) + ' ' + sizes[i];
    }
}
// Percentage formatting
export function formatPercentage(value, options, locale) {
    const currentLocale = locale || getCurrentLocale();
    try {
        return new Intl.NumberFormat(currentLocale, {
            style: 'percent',
            ...options,
        }).format(value / 100);
    }
    catch (error) {
        console.warn('Percentage formatting failed, using fallback:', error);
        return `${value.toFixed(1)}%`;
    }
}
// List formatting (e.g., "apple, banana, and orange")
export function formatList(items, _options, _locale) {
    // const currentLocale = locale || getCurrentLocale() // Unused for now
    try {
        // Use a simplified approach for older browsers
        if (items.length === 0)
            return '';
        if (items.length === 1)
            return items[0];
        if (items.length === 2)
            return `${items[0]} and ${items[1]}`;
        const lastItem = items[items.length - 1];
        const otherItems = items.slice(0, -1);
        return `${otherItems.join(', ')}, and ${lastItem}`;
    }
    catch (error) {
        console.warn('List formatting failed, using fallback:', error);
        return items.join(', ');
    }
}
