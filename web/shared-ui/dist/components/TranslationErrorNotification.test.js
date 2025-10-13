import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TranslationErrorNotification from './TranslationErrorNotification';
import { translationErrorHandler } from '../translation-error-handler';
// Mock react-i18next
const mockT = vi.fn((key, fallback) => fallback || key);
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT
    })
}));
describe('TranslationErrorNotification', () => {
    const mockOnRetry = vi.fn();
    const mockOnDismiss = vi.fn();
    beforeEach(() => {
        translationErrorHandler.clearErrors();
        vi.clearAllMocks();
        mockT.mockImplementation((key, fallback) => {
            const translations = {
                'translation.loadFailed': 'Failed to load translations for this language.',
                'translation.fallbackActive': 'Some translations are not available. Showing English as fallback.',
                'translation.retrying': 'Retrying... ({{count}})',
                'translation.retryFailed': 'Retry {{count}} failed',
                'translation.failedLanguages': 'Failed languages: {{languages}}',
                'common.retry': 'Retry',
                'common.dismiss': 'Dismiss'
            };
            return translations[key] || fallback || key;
        });
    });
    it('should not render when there are no errors', () => {
        const { container } = render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        expect(container.firstChild).toBeNull();
    });
    it('should render error notification when there are errors', () => {
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Network error'));
        render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        expect(screen.getByText('Failed to load translations for this language.')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
    });
    it('should render fallback notification when fallback is active', () => {
        // Trigger fallback by exceeding max retries
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 1'));
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 2'));
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 3'));
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 4'));
        render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        expect(screen.getByText('Some translations are not available. Showing English as fallback.')).toBeInTheDocument();
    });
    it('should call onRetry when retry button is clicked', () => {
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Network error'));
        render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);
        expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
    it('should call onDismiss when dismiss button is clicked', () => {
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Network error'));
        render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        const dismissButton = screen.getByLabelText('Dismiss');
        fireEvent.click(dismissButton);
        expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
    it('should not render after being dismissed', () => {
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Network error'));
        const { rerender } = render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        expect(screen.getByText('Failed to load translations for this language.')).toBeInTheDocument();
        const dismissButton = screen.getByLabelText('Dismiss');
        fireEvent.click(dismissButton);
        rerender(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        expect(screen.queryByText('Failed to load translations for this language.')).not.toBeInTheDocument();
    });
    it('should show retry count when retrying', () => {
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 1'));
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 2'));
        mockT.mockImplementation((key, fallback, options) => {
            if (key === 'translation.retryFailed' && options?.count) {
                return `Retry ${options.count} failed`;
            }
            return mockT(key, fallback);
        });
        render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        expect(screen.getByText('Retry 1 failed')).toBeInTheDocument();
    });
    it('should show failed languages when fallback is active', () => {
        // Trigger fallback
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 1'));
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 2'));
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 3'));
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 4'));
        mockT.mockImplementation((key, fallback, options) => {
            if (key === 'translation.failedLanguages' && options?.languages) {
                return `Failed languages: ${options.languages}`;
            }
            return mockT(key, fallback);
        });
        render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        expect(screen.getByText('Failed languages: fr-FR')).toBeInTheDocument();
    });
    it('should disable retry button when retrying', () => {
        translationErrorHandler.startLoading('fr-FR', 'interview');
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Network error'));
        render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        const retryButton = screen.getByText('Retry');
        expect(retryButton).toBeDisabled();
    });
    it('should update when loading state changes', async () => {
        const { rerender } = render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        // Initially no notification
        expect(screen.queryByText('Failed to load translations for this language.')).not.toBeInTheDocument();
        // Add error
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Network error'));
        rerender(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        await waitFor(() => {
            expect(screen.getByText('Failed to load translations for this language.')).toBeInTheDocument();
        });
        // Clear error
        translationErrorHandler.recordSuccess('fr-FR', 'interview');
        rerender(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss }));
        await waitFor(() => {
            expect(screen.queryByText('Failed to load translations for this language.')).not.toBeInTheDocument();
        });
    });
    it('should apply custom className', () => {
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Network error'));
        const { container } = render(_jsx(TranslationErrorNotification, { language: "fr-FR", onRetry: mockOnRetry, onDismiss: mockOnDismiss, className: "custom-class" }));
        expect(container.firstChild).toHaveClass('translation-error-notification');
        expect(container.firstChild).toHaveClass('custom-class');
    });
    it('should work without onRetry and onDismiss callbacks', () => {
        translationErrorHandler.recordError('fr-FR', 'interview', new Error('Network error'));
        render(_jsx(TranslationErrorNotification, { language: "fr-FR" }));
        expect(screen.getByText('Failed to load translations for this language.')).toBeInTheDocument();
        // Should not throw when clicking buttons
        const retryButton = screen.getByText('Retry');
        const dismissButton = screen.getByLabelText('Dismiss');
        expect(() => {
            fireEvent.click(retryButton);
            fireEvent.click(dismissButton);
        }).not.toThrow();
    });
});
