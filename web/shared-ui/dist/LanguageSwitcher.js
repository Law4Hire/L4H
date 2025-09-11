import { jsx as _jsx } from "react/jsx-runtime";
import { clsx } from 'clsx';
import { useI18n, useTranslation } from './i18n-provider';
export function LanguageSwitcher({ variant = 'full', className, 'aria-label': ariaLabel = 'Select language', 'aria-describedby': ariaDescribedBy, }) {
    const { t } = useTranslation();
    const { cultures, currentCulture, setCurrentCulture, isLoading } = useI18n();
    const handleLanguageChange = async (event) => {
        const newLanguage = event.target.value;
        await setCurrentCulture(newLanguage);
    };
    if (isLoading) {
        return (_jsx("div", { className: "px-3 py-2 text-sm text-gray-500", children: t('common.loading') }));
    }
    return (_jsx("select", { value: currentCulture, onChange: handleLanguageChange, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy, className: clsx('border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500', variant === 'compact' ? 'px-2 py-1 text-sm' : 'px-3 py-2 text-base', className), children: cultures.map((culture) => (_jsx("option", { value: culture.code, children: culture.displayName }, culture.code))) }));
}
