import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
export const RTLNumber = ({ value, format = 'decimal', currency = 'USD', minimumFractionDigits, maximumFractionDigits }) => {
    const { i18n } = useTranslation();
    const formattedValue = new Intl.NumberFormat(i18n.language, {
        style: format,
        currency: currency,
        minimumFractionDigits,
        maximumFractionDigits
    }).format(value);
    return (_jsx("span", { className: "rtl-number", dir: "ltr", children: formattedValue }));
};
