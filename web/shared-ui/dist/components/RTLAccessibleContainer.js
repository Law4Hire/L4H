import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { forwardRef, useEffect, useRef, useCallback } from 'react';
import { useRTLAccessibility } from '../hooks/useRTLAccessibility';
/**
 * Container component that provides RTL-aware accessibility features
 */
export const RTLAccessibleContainer = forwardRef(({ children, manageFocusOrder = true, adjustKeyboardNavigation = true, customFocusOrder = [], excludeFromFocusManagement = [], as: Component = 'div', setAriaAttributes = true, className, style, ...props }, ref) => {
    const containerRef = useRef(null);
    const { isRTL, textDirection, setupRTLFocusManagement, getRTLAriaAttributes, handleRTLKeyboardNavigation } = useRTLAccessibility({
        manageFocusOrder,
        adjustKeyboardNavigation,
        customFocusOrder,
        excludeFromFocusManagement
    });
    // Set up RTL focus management
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !manageFocusOrder)
            return;
        const cleanup = setupRTLFocusManagement(container);
        return cleanup;
    }, [setupRTLFocusManagement, manageFocusOrder]);
    // Handle keyboard navigation
    const handleKeyDown = (event) => {
        if (adjustKeyboardNavigation && containerRef.current) {
            const handled = handleRTLKeyboardNavigation(event.nativeEvent, containerRef.current);
            if (handled) {
                return;
            }
        }
        // Call original onKeyDown if provided
        props.onKeyDown?.(event);
    };
    // Combine refs
    const combinedRef = useCallback((node) => {
        // Update our internal ref
        if (containerRef.current !== node) {
            containerRef.current = node;
        }
        // Forward to external ref
        if (typeof ref === 'function') {
            ref(node);
        }
        else if (ref) {
            ref.current = node;
        }
    }, [ref]);
    // Get ARIA attributes
    const ariaAttributes = setAriaAttributes ? getRTLAriaAttributes() : {};
    // Prepare element props
    const elementProps = {
        ...props,
        ...ariaAttributes,
        ref: combinedRef,
        className,
        style: {
            ...style,
            // Ensure proper text direction
            direction: textDirection,
        },
        onKeyDown: handleKeyDown,
    };
    return React.createElement(Component, elementProps, children);
});
RTLAccessibleContainer.displayName = 'RTLAccessibleContainer';
/**
 * Specialized container for RTL-aware form layouts
 */
export const RTLAccessibleForm = forwardRef((props, ref) => (_jsx(RTLAccessibleContainer, { ...props, as: "form", customFocusOrder: [
        'input[type="text"]',
        'input[type="email"]',
        'input[type="password"]',
        'input[type="tel"]',
        'input[type="url"]',
        'input[type="number"]',
        'select',
        'textarea',
        'input[type="radio"]',
        'input[type="checkbox"]',
        'button[type="submit"]',
        'button[type="button"]',
        ...props.customFocusOrder || []
    ], ref: ref })));
RTLAccessibleForm.displayName = 'RTLAccessibleForm';
/**
 * Specialized container for RTL-aware navigation menus
 */
export const RTLAccessibleNavigation = forwardRef(({ orientation = 'horizontal', ...props }, ref) => (_jsx(RTLAccessibleContainer, { ...props, as: "nav", role: "navigation", "aria-orientation": orientation, customFocusOrder: [
        'a[href]',
        'button',
        '[role="menuitem"]',
        '[role="tab"]',
        ...props.customFocusOrder || []
    ], ref: ref })));
RTLAccessibleNavigation.displayName = 'RTLAccessibleNavigation';
/**
 * Specialized container for RTL-aware dialog/modal content
 */
export const RTLAccessibleDialog = forwardRef(({ title, description, ...props }, ref) => (_jsx(RTLAccessibleContainer, { ...props, as: "div", role: "dialog", "aria-modal": "true", "aria-labelledby": title ? `${props.id}-title` : undefined, "aria-describedby": description ? `${props.id}-description` : undefined, customFocusOrder: [
        'button[aria-label*="close"]',
        'input',
        'select',
        'textarea',
        'button',
        'a[href]',
        ...props.customFocusOrder || []
    ], ref: ref })));
RTLAccessibleDialog.displayName = 'RTLAccessibleDialog';
/**
 * Specialized container for RTL-aware data tables
 */
export const RTLAccessibleTable = forwardRef(({ caption, children, ...props }, ref) => (_jsxs(RTLAccessibleContainer, { ...props, as: "table", role: "table", customFocusOrder: [
        'th[tabindex]',
        'td[tabindex]',
        'button',
        'a[href]',
        'input',
        'select',
        ...props.customFocusOrder || []
    ], ref: ref, children: [caption && _jsx("caption", { children: caption }), children] })));
RTLAccessibleTable.displayName = 'RTLAccessibleTable';
