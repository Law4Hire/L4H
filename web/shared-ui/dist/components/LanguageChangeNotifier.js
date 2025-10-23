import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CULTURE_NAMES } from '../i18n-config';
import { useAccessibilityI18n } from '../hooks/useAccessibilityI18n';
/**
 * Component that notifies users and assistive technologies about language changes
 */
export function LanguageChangeNotifier({ showVisualNotification = false, notificationDuration = 3000, messageTemplate, announceToScreenReader = true, notificationClassName }) {
    const { i18n } = useTranslation();
    const { announceToScreenReader: announce } = useAccessibilityI18n({
        announceLanguageChanges: false // We'll handle this manually
    });
    const [showNotification, setShowNotification] = React.useState(false);
    const [notificationMessage, setNotificationMessage] = React.useState('');
    const previousLanguageRef = useRef('');
    const timeoutRef = useRef();
    useEffect(() => {
        const currentLanguage = i18n.language;
        const previousLanguage = previousLanguageRef.current;
        if (previousLanguage && previousLanguage !== currentLanguage) {
            const displayName = CULTURE_NAMES[currentLanguage] || currentLanguage;
            const message = messageTemplate
                ? messageTemplate(currentLanguage, displayName)
                : `Language changed to ${displayName}`;
            // Announce to screen readers
            if (announceToScreenReader) {
                announce(message, 'polite');
                // Also dispatch a custom event for other components to listen to
                if (typeof document !== 'undefined') {
                    const event = new CustomEvent('languageChangeAnnounced', {
                        detail: {
                            language: currentLanguage,
                            displayName,
                            message
                        }
                    });
                    document.dispatchEvent(event);
                }
            }
            // Show visual notification if enabled
            if (showVisualNotification) {
                setNotificationMessage(message);
                setShowNotification(true);
                // Clear previous timeout
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                // Hide notification after duration
                timeoutRef.current = setTimeout(() => {
                    setShowNotification(false);
                }, notificationDuration);
            }
        }
        previousLanguageRef.current = currentLanguage;
    }, [i18n.language, messageTemplate, announceToScreenReader, announce, showVisualNotification, notificationDuration]);
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    if (!showVisualNotification || !showNotification) {
        return null;
    }
    return (_jsx("div", { className: notificationClassName || `
        fixed top-4 right-4 z-50 
        bg-blue-600 text-white 
        px-4 py-2 rounded-md shadow-lg
        transition-opacity duration-300
        ${showNotification ? 'opacity-100' : 'opacity-0'}
      `, role: "status", "aria-live": "polite", "aria-atomic": "true", children: notificationMessage }));
}
/**
 * Hook for listening to language change announcements
 */
export function useLanguageChangeListener(callback) {
    useEffect(() => {
        if (typeof document === 'undefined')
            return;
        const handleLanguageChange = (event) => {
            callback(event);
        };
        document.addEventListener('languageChangeAnnounced', handleLanguageChange);
        return () => {
            document.removeEventListener('languageChangeAnnounced', handleLanguageChange);
        };
    }, [callback]);
}
/**
 * Component that provides a live region specifically for language announcements
 */
export function LanguageAnnouncementRegion() {
    const [announcement, setAnnouncement] = React.useState('');
    useLanguageChangeListener((event) => {
        setAnnouncement(event.detail.message);
        // Clear announcement after it's been read
        setTimeout(() => {
            setAnnouncement('');
        }, 3000);
    });
    return (_jsx("div", { "aria-live": "polite", "aria-atomic": "true", role: "status", className: "sr-only", id: "language-announcement-region", children: announcement }));
}
