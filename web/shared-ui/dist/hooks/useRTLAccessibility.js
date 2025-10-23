import { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isRTL, getTextDirection } from '../i18n-config';
/**
 * Hook for managing RTL-specific accessibility features
 */
export function useRTLAccessibility(options = {}) {
    const { manageFocusOrder = true, adjustKeyboardNavigation = true, announceDirectionChanges = true, customFocusOrder = [], excludeFromFocusManagement = [] } = options;
    const { i18n } = useTranslation();
    const previousDirectionRef = useRef('ltr');
    const currentLanguage = i18n.language;
    const currentIsRTL = isRTL(currentLanguage);
    const textDirection = getTextDirection(currentLanguage);
    // Get appropriate keyboard navigation direction based on RTL context
    const getNavigationDirection = useCallback((key) => {
        switch (key) {
            case 'ArrowLeft':
                return currentIsRTL ? 'forward' : 'backward';
            case 'ArrowRight':
                return currentIsRTL ? 'backward' : 'forward';
            case 'ArrowUp':
                return 'up';
            case 'ArrowDown':
                return 'down';
            case 'Home':
                return currentIsRTL ? 'forward' : 'backward';
            case 'End':
                return currentIsRTL ? 'backward' : 'forward';
            default:
                return null;
        }
    }, [currentIsRTL]);
    // Get RTL-appropriate ARIA attributes
    const getRTLAriaAttributes = useCallback(() => ({
        dir: textDirection,
        ...(textDirection === 'rtl' && { 'aria-orientation': 'horizontal' })
    }), [textDirection]);
    // Set up RTL-aware focus management for a container
    const setupRTLFocusManagement = useCallback((container) => {
        if (!manageFocusOrder)
            return () => { };
        const focusableSelector = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');
        const updateFocusOrder = () => {
            const focusableElements = Array.from(container.querySelectorAll(focusableSelector));
            // Filter out excluded elements
            const filteredElements = focusableElements.filter(element => {
                return !excludeFromFocusManagement.some(selector => element.matches(selector));
            });
            // Apply custom focus order if provided
            let orderedElements = filteredElements;
            if (customFocusOrder.length > 0) {
                orderedElements = [];
                customFocusOrder.forEach(selector => {
                    const elements = filteredElements.filter(el => el.matches(selector));
                    orderedElements.push(...elements);
                });
                // Add remaining elements not in custom order
                const remainingElements = filteredElements.filter(el => !orderedElements.includes(el));
                orderedElements.push(...remainingElements);
            }
            // Reverse order for RTL languages
            if (currentIsRTL) {
                orderedElements.reverse();
            }
            // Update tabindex values
            orderedElements.forEach((element, index) => {
                element.setAttribute('tabindex', index === 0 ? '0' : '-1');
            });
            // Set up keyboard navigation
            const handleKeyDown = (event) => {
                if (!adjustKeyboardNavigation)
                    return;
                const currentElement = event.target;
                const currentIndex = orderedElements.indexOf(currentElement);
                if (currentIndex === -1)
                    return;
                const direction = getNavigationDirection(event.key);
                if (!direction)
                    return;
                let nextIndex = currentIndex;
                switch (direction) {
                    case 'forward':
                        nextIndex = (currentIndex + 1) % orderedElements.length;
                        break;
                    case 'backward':
                        nextIndex = currentIndex === 0 ? orderedElements.length - 1 : currentIndex - 1;
                        break;
                    case 'up':
                        // Find element in previous row (approximate)
                        nextIndex = Math.max(0, currentIndex - 1);
                        break;
                    case 'down':
                        // Find element in next row (approximate)
                        nextIndex = Math.min(orderedElements.length - 1, currentIndex + 1);
                        break;
                }
                if (nextIndex !== currentIndex) {
                    event.preventDefault();
                    orderedElements[nextIndex]?.focus();
                }
            };
            // Add keyboard event listeners
            orderedElements.forEach(element => {
                element.addEventListener('keydown', handleKeyDown);
            });
            return () => {
                orderedElements.forEach(element => {
                    element.removeEventListener('keydown', handleKeyDown);
                });
            };
        };
        // Initial setup
        const cleanup = updateFocusOrder();
        // Update when DOM changes
        const observer = new MutationObserver(() => {
            cleanup();
            updateFocusOrder();
        });
        observer.observe(container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'tabindex', 'hidden']
        });
        return () => {
            cleanup();
            observer.disconnect();
        };
    }, [manageFocusOrder, customFocusOrder, excludeFromFocusManagement, currentIsRTL, adjustKeyboardNavigation, getNavigationDirection]);
    // Handle RTL-aware keyboard navigation
    const handleRTLKeyboardNavigation = useCallback((event, container) => {
        if (!adjustKeyboardNavigation)
            return false;
        const direction = getNavigationDirection(event.key);
        if (!direction)
            return false;
        const focusableElements = Array.from(container.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'));
        const currentElement = event.target;
        const currentIndex = focusableElements.indexOf(currentElement);
        if (currentIndex === -1)
            return false;
        let nextIndex = currentIndex;
        switch (direction) {
            case 'forward':
                nextIndex = (currentIndex + 1) % focusableElements.length;
                break;
            case 'backward':
                nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
                break;
            case 'up':
                // Find element above (approximate by going backwards)
                nextIndex = Math.max(0, currentIndex - 1);
                break;
            case 'down':
                // Find element below (approximate by going forwards)
                nextIndex = Math.min(focusableElements.length - 1, currentIndex + 1);
                break;
        }
        if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
            event.preventDefault();
            focusableElements[nextIndex].focus();
            return true;
        }
        return false;
    }, [adjustKeyboardNavigation, getNavigationDirection]);
    // Announce direction changes to screen readers
    useEffect(() => {
        if (!announceDirectionChanges)
            return;
        const previousDirection = previousDirectionRef.current;
        if (previousDirection !== textDirection) {
            // Create announcement for screen readers
            const announcement = textDirection === 'rtl'
                ? 'Layout changed to right-to-left direction'
                : 'Layout changed to left-to-right direction';
            // Create a temporary live region for the announcement
            const liveRegion = document.createElement('div');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
            // Announce the change
            setTimeout(() => {
                liveRegion.textContent = announcement;
            }, 100);
            // Clean up after announcement
            setTimeout(() => {
                if (liveRegion.parentNode) {
                    liveRegion.parentNode.removeChild(liveRegion);
                }
            }, 3000);
            // Dispatch custom event for other components
            const event = new CustomEvent('rtlDirectionChange', {
                detail: {
                    direction: textDirection,
                    previousDirection,
                    isRTL: currentIsRTL
                }
            });
            document.dispatchEvent(event);
        }
        previousDirectionRef.current = textDirection;
    }, [textDirection, announceDirectionChanges, currentIsRTL]);
    return {
        isRTL: currentIsRTL,
        textDirection,
        getNavigationDirection,
        setupRTLFocusManagement,
        getRTLAriaAttributes,
        handleRTLKeyboardNavigation
    };
}
