import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children, defaultTheme = 'light', storageKey = 'l4h-theme' }) {
    const [theme, setThemeState] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                return stored;
            }
            // Respect system preference if no stored theme
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return prefersDark ? 'dark' : defaultTheme;
        }
        return defaultTheme;
    });
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem(storageKey, newTheme);
    };
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    const value = {
        theme,
        toggleTheme,
        setTheme,
    };
    return (_jsx(ThemeContext.Provider, { value: value, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
