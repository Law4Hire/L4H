import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n-provider';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useTheme } from '../ThemeProvider';
import { Sun, Moon } from '../Icon';
import { Button } from './Button';
import { useNavigate, useLocation } from 'react-router-dom';
function getUserDisplayName(user) {
    if (user.firstName)
        return user.firstName;
    if (user.name)
        return user.name;
    if (user.email) {
        const emailName = user.email.split('@')[0];
        const parts = emailName.split(/[._-]/);
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return 'User';
}
export const Layout = ({ children, title: _title, showUserMenu = true, user, isAuthenticated = false }) => {
    const { t: _t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userMenuRef = useRef(null);
    const handleLogout = () => {
        // Clear tokens and redirect
        localStorage.removeItem('jwt-token');
        window.dispatchEvent(new Event('jwt-token-changed'));
        window.location.href = '/login';
    };
    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100", children: [_jsx("header", { className: "bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-16", children: [_jsx("div", { className: "flex items-center space-x-4", children: _jsxs("div", { className: "flex items-center space-x-3 cursor-pointer", onClick: () => navigate('/dashboard'), children: [_jsx("div", { className: "w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-lg", children: "\uD83C\uDDFA\uD83C\uDDF8" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-bold text-gray-900 dark:text-gray-100", children: _t('brand:title', 'US Immigration Help') }), _jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: _t('brand:subtitle', 'Powered by Law4Hire') })] })] }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate('/visa-library'), className: location.pathname === '/visa-library' ? 'bg-blue-50 text-blue-600' : '', children: _t('nav.visaLibrary') }), _jsx(LanguageSwitcher, { variant: "compact" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: toggleTheme, "aria-label": theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode', children: theme === 'light' ? _jsx(Moon, { className: "h-4 w-4" }) : _jsx(Sun, { className: "h-4 w-4" }) }), showUserMenu && isAuthenticated && user ? (_jsxs("div", { ref: userMenuRef, className: "relative", children: [_jsxs(Button, { variant: "ghost", size: "sm", className: "text-sm", onClick: () => setShowUserDropdown(!showUserDropdown), children: [_t('nav.hello'), " ", getUserDisplayName(user)] }), showUserDropdown && (_jsxs("div", { className: "absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700", children: [_jsx("button", { onClick: () => {
                                                            setShowUserDropdown(false);
                                                            navigate('/dashboard');
                                                        }, className: "block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700", children: _t('nav.dashboard') }), user?.isAdmin && (_jsx("button", { onClick: () => {
                                                            setShowUserDropdown(false);
                                                            navigate('/admin');
                                                        }, className: "block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700", children: _t('nav.admin') })), _jsx("button", { onClick: () => {
                                                            setShowUserDropdown(false);
                                                            handleLogout();
                                                        }, className: "block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700", children: _t('logout', { ns: 'auth' }) })] }))] })) : showUserMenu && !isAuthenticated && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate('/login'), children: _t('auth.login') }), _jsx(Button, { variant: "primary", size: "sm", onClick: () => navigate('/login'), children: _t('common.getStarted') })] }))] })] }) }) }), _jsx("main", { className: "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8", children: children })] }));
};
