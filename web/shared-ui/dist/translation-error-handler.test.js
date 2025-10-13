import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { translationErrorHandler, TranslationErrorHandler } from './translation-error-handler';
// Mock setTimeout and clearTimeout for testing
const mockSetTimeout = vi.fn();
const mockClearTimeout = vi.fn();
global.setTimeout = mockSetTimeout;
global.clearTimeout = mockClearTimeout;
describe('TranslationErrorHandler', () => {
    let handler;
    beforeEach(() => {
        handler = new TranslationErrorHandler({
            maxRetries: 2,
            retryDelay: 100,
            enableLogging: false, // Disable logging in tests
            enableUserNotifications: true,
            fallbackLanguage: 'en-US'
        });
        // Clear mock calls
        mockSetTimeout.mockClear();
        mockClearTimeout.mockClear();
    });
    afterEach(() => {
        handler.clearErrors();
    });
    describe('Error Recording', () => {
        it('should record translation loading errors', () => {
            const error = new Error('Network error');
            handler.recordError('fr-FR', 'interview', error);
            const state = handler.getLoadingState('fr-FR', 'interview');
            expect(state.hasError).toBe(true);
            expect(state.errorMessage).toBe('Network error');
            expect(state.retryCount).toBe(0);
        });
        it('should increment retry count for repeated errors', () => {
            const error = new Error('Network error');
            handler.recordError('fr-FR', 'interview', error);
            handler.recordError('fr-FR', 'interview', error);
            const state = handler.getLoadingState('fr-FR', 'interview');
            expect(state.retryCount).toBe(1);
        });
        it('should activate fallback after max retries', () => {
            const error = new Error('Network error');
            // Exceed max retries (2)
            handler.recordError('fr-FR', 'interview', error);
            handler.recordError('fr-FR', 'interview', error);
            handler.recordError('fr-FR', 'interview', error);
            const state = handler.getLoadingState('fr-FR', 'interview');
            expect(state.isFallbackActive).toBe(true);
            expect(state.failedLanguages).toContain('fr-FR');
        });
    });
    describe('Success Recording', () => {
        it('should clear error state on successful load', () => {
            const error = new Error('Network error');
            handler.recordError('fr-FR', 'interview', error);
            let state = handler.getLoadingState('fr-FR', 'interview');
            expect(state.hasError).toBe(true);
            handler.recordSuccess('fr-FR', 'interview');
            state = handler.getLoadingState('fr-FR', 'interview');
            expect(state.hasError).toBe(false);
            expect(state.isLoading).toBe(false);
            expect(state.errorMessage).toBeUndefined();
        });
        it('should clear retry timeouts on success', () => {
            const error = new Error('Network error');
            handler.recordError('fr-FR', 'interview', error);
            // Should have scheduled a retry
            expect(mockSetTimeout).toHaveBeenCalled();
            handler.recordSuccess('fr-FR', 'interview');
            // Should have cleared the timeout
            expect(mockClearTimeout).toHaveBeenCalled();
        });
    });
    describe('Loading State Management', () => {
        it('should track loading state', () => {
            handler.startLoading('fr-FR', 'interview');
            const state = handler.getLoadingState('fr-FR', 'interview');
            expect(state.isLoading).toBe(true);
            expect(state.hasError).toBe(false);
        });
        it('should provide overall loading state for a language', () => {
            handler.recordError('fr-FR', 'interview', new Error('Error 1'));
            handler.recordError('fr-FR', 'common', new Error('Error 2'));
            handler.recordSuccess('fr-FR', 'errors');
            const overallState = handler.getOverallLoadingState('fr-FR');
            expect(overallState.hasError).toBe(true);
            expect(overallState.failedLanguages).toContain('fr-FR');
        });
    });
    describe('Retry Logic', () => {
        it('should schedule retries with exponential backoff', () => {
            const error = new Error('Network error');
            handler.recordError('fr-FR', 'interview', error);
            expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
            handler.recordError('fr-FR', 'interview', error);
            expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 200);
        });
        it('should not schedule retry after max retries', () => {
            const error = new Error('Network error');
            // Clear previous calls
            mockSetTimeout.mockClear();
            // Exceed max retries
            handler.recordError('fr-FR', 'interview', error);
            handler.recordError('fr-FR', 'interview', error);
            handler.recordError('fr-FR', 'interview', error);
            // Should have scheduled 2 retries, not 3
            expect(mockSetTimeout).toHaveBeenCalledTimes(2);
        });
        it('should handle manual retry', async () => {
            const mockLoadFunction = vi.fn().mockResolvedValue({});
            const success = await handler.retryLoading('fr-FR', 'interview', mockLoadFunction);
            expect(success).toBe(true);
            expect(mockLoadFunction).toHaveBeenCalledWith('fr-FR', 'interview');
        });
        it('should handle failed manual retry', async () => {
            const mockLoadFunction = vi.fn().mockRejectedValue(new Error('Load failed'));
            const success = await handler.retryLoading('fr-FR', 'interview', mockLoadFunction);
            expect(success).toBe(false);
            const state = handler.getLoadingState('fr-FR', 'interview');
            expect(state.hasError).toBe(true);
        });
    });
    describe('Error Statistics', () => {
        it('should provide error statistics', () => {
            handler.recordError('fr-FR', 'interview', new Error('Error 1'));
            handler.recordError('es-ES', 'common', new Error('Error 2'));
            handler.recordError('fr-FR', 'errors', new Error('Error 3'));
            const stats = handler.getErrorStats();
            expect(stats.totalErrors).toBe(3);
            expect(stats.errorsByLanguage['fr-FR']).toBe(2);
            expect(stats.errorsByLanguage['es-ES']).toBe(1);
            expect(stats.errorsByNamespace['interview']).toBe(1);
            expect(stats.errorsByNamespace['common']).toBe(1);
            expect(stats.errorsByNamespace['errors']).toBe(1);
        });
        it('should filter recent errors', () => {
            // Mock Date.now to control timestamps
            const originalNow = Date.now;
            const mockNow = vi.fn();
            Date.now = mockNow;
            const twoHoursAgo = new Date().getTime() - (2 * 60 * 60 * 1000);
            const thirtyMinutesAgo = new Date().getTime() - (30 * 60 * 1000);
            mockNow.mockReturnValueOnce(twoHoursAgo);
            handler.recordError('fr-FR', 'interview', new Error('Old error'));
            mockNow.mockReturnValueOnce(thirtyMinutesAgo);
            handler.recordError('es-ES', 'common', new Error('Recent error'));
            mockNow.mockReturnValue(new Date().getTime());
            const stats = handler.getErrorStats();
            expect(stats.totalErrors).toBe(2);
            expect(stats.recentErrors).toHaveLength(1);
            expect(stats.recentErrors[0].language).toBe('es-ES');
            // Restore Date.now
            Date.now = originalNow;
        });
    });
    describe('Event Listeners', () => {
        it('should notify listeners of state changes', () => {
            const listener = vi.fn();
            const unsubscribe = handler.subscribe(listener);
            handler.recordError('fr-FR', 'interview', new Error('Test error'));
            expect(listener).toHaveBeenCalled();
            unsubscribe();
            // Should not be called after unsubscribe
            listener.mockClear();
            handler.recordError('es-ES', 'common', new Error('Another error'));
            expect(listener).not.toHaveBeenCalled();
        });
    });
    describe('Clear Errors', () => {
        it('should clear all errors and state', () => {
            handler.recordError('fr-FR', 'interview', new Error('Error 1'));
            handler.recordError('es-ES', 'common', new Error('Error 2'));
            let stats = handler.getErrorStats();
            expect(stats.totalErrors).toBe(2);
            handler.clearErrors();
            stats = handler.getErrorStats();
            expect(stats.totalErrors).toBe(0);
            const state = handler.getLoadingState('fr-FR', 'interview');
            expect(state.hasError).toBe(false);
        });
        it('should clear all retry timeouts', () => {
            handler.recordError('fr-FR', 'interview', new Error('Error 1'));
            handler.recordError('es-ES', 'common', new Error('Error 2'));
            handler.clearErrors();
            expect(mockClearTimeout).toHaveBeenCalledTimes(2);
        });
    });
});
describe('Global Translation Error Handler', () => {
    beforeEach(() => {
        translationErrorHandler.clearErrors();
    });
    it('should be a singleton instance', () => {
        expect(translationErrorHandler).toBeInstanceOf(TranslationErrorHandler);
    });
    it('should maintain state across imports', () => {
        translationErrorHandler.recordError('fr-FR', 'test', new Error('Test'));
        const stats = translationErrorHandler.getErrorStats();
        expect(stats.totalErrors).toBe(1);
    });
});
