import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranslationErrorHandling, useGlobalTranslationErrorState } from './useTranslationErrorHandling';
import { translationErrorHandler } from '../translation-error-handler';
// Mock react-i18next
const mockT = vi.fn((key) => key);
const mockI18n = {
    language: 'en-US',
    t: mockT,
    reloadResources: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn()
};
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: mockI18n
    })
}));
describe('useTranslationErrorHandling', () => {
    beforeEach(() => {
        translationErrorHandler.clearErrors();
        vi.clearAllMocks();
    });
    it('should initialize with default state', () => {
        const { result } = renderHook(() => useTranslationErrorHandling());
        expect(result.current.hasErrors).toBe(false);
        expect(result.current.isFallbackActive).toBe(false);
        expect(result.current.isRetrying).toBe(false);
        expect(result.current.canRetry).toBe(true);
        expect(result.current.showNotification).toBe(false);
    });
    it('should update state when errors occur', () => {
        const { result } = renderHook(() => useTranslationErrorHandling('fr-FR', 'interview'));
        act(() => {
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Test error'));
        });
        expect(result.current.hasErrors).toBe(true);
        expect(result.current.showNotification).toBe(true);
    });
    it('should update state when fallback is activated', () => {
        const { result } = renderHook(() => useTranslationErrorHandling('fr-FR', 'interview'));
        act(() => {
            // Trigger multiple errors to activate fallback
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 1'));
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 2'));
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 3'));
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 4'));
        });
        expect(result.current.isFallbackActive).toBe(true);
        expect(result.current.failedLanguages).toContain('fr-FR');
    });
    it('should handle manual retry', async () => {
        const { result } = renderHook(() => useTranslationErrorHandling('fr-FR', 'interview'));
        act(() => {
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Test error'));
        });
        expect(result.current.hasErrors).toBe(true);
        let retryResult;
        await act(async () => {
            retryResult = await result.current.retry();
        });
        expect(retryResult).toBe(true);
        expect(mockI18n.reloadResources).toHaveBeenCalledWith('fr-FR', 'interview');
    });
    it('should handle failed retry', async () => {
        mockI18n.reloadResources.mockRejectedValueOnce(new Error('Reload failed'));
        const { result } = renderHook(() => useTranslationErrorHandling('fr-FR', 'interview'));
        act(() => {
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Test error'));
        });
        let retryResult;
        await act(async () => {
            retryResult = await result.current.retry();
        });
        expect(retryResult).toBe(false);
    });
    it('should prevent retry when already retrying', async () => {
        const { result } = renderHook(() => useTranslationErrorHandling('fr-FR', 'interview'));
        act(() => {
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Test error'));
        });
        // Start first retry
        const firstRetryPromise = act(async () => {
            return result.current.retry();
        });
        // Try second retry while first is in progress
        let secondRetryResult;
        await act(async () => {
            secondRetryResult = await result.current.retry();
        });
        expect(secondRetryResult).toBe(false);
        await firstRetryPromise;
    });
    it('should prevent retry when max retries exceeded', () => {
        const { result } = renderHook(() => useTranslationErrorHandling('fr-FR', 'interview', { maxAutoRetries: 2 }));
        act(() => {
            // Exceed max retries
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 1'));
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 2'));
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 3'));
        });
        expect(result.current.canRetry).toBe(false);
    });
    it('should dismiss notification', () => {
        const { result } = renderHook(() => useTranslationErrorHandling('fr-FR', 'interview'));
        act(() => {
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Test error'));
        });
        expect(result.current.showNotification).toBe(true);
        act(() => {
            result.current.dismissNotification();
        });
        expect(result.current.showNotification).toBe(false);
    });
    it('should reset notification dismissed state on language change', () => {
        const { result, rerender } = renderHook(({ language }) => useTranslationErrorHandling(language, 'interview'), { initialProps: { language: 'fr-FR' } });
        act(() => {
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Test error'));
        });
        act(() => {
            result.current.dismissNotification();
        });
        expect(result.current.showNotification).toBe(false);
        // Change language
        rerender({ language: 'es-ES' });
        act(() => {
            translationErrorHandler.recordError('es-ES', 'interview', new Error('Test error'));
        });
        expect(result.current.showNotification).toBe(true);
    });
    it('should check if translation exists', () => {
        mockT.mockImplementation((key) => key === 'existing.key' ? 'Translation' : key);
        const { result } = renderHook(() => useTranslationErrorHandling());
        expect(result.current.hasTranslation('existing.key')).toBe(true);
        expect(result.current.hasTranslation('missing.key')).toBe(false);
    });
    it('should get fallback translation', () => {
        mockT.mockImplementation((key, options) => {
            if (options?.lng === 'en-US' && key === 'test.key') {
                return 'Fallback translation';
            }
            return key;
        });
        const { result } = renderHook(() => useTranslationErrorHandling());
        const fallback = result.current.getFallbackTranslation('test.key');
        expect(fallback).toBe('Fallback translation');
    });
    it('should handle overall loading state when no namespace specified', () => {
        const { result } = renderHook(() => useTranslationErrorHandling('fr-FR'));
        act(() => {
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 1'));
            translationErrorHandler.recordError('fr-FR', 'common', new Error('Error 2'));
        });
        expect(result.current.hasErrors).toBe(true);
    });
});
describe('useGlobalTranslationErrorState', () => {
    beforeEach(() => {
        translationErrorHandler.clearErrors();
    });
    it('should track global error statistics', () => {
        const { result } = renderHook(() => useGlobalTranslationErrorState());
        expect(result.current.hasGlobalErrors).toBe(false);
        expect(result.current.recentErrorCount).toBe(0);
        act(() => {
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 1'));
            translationErrorHandler.recordError('es-ES', 'common', new Error('Error 2'));
        });
        expect(result.current.hasGlobalErrors).toBe(true);
        expect(result.current.errorStats.totalErrors).toBe(2);
    });
    it('should clear all errors', () => {
        const { result } = renderHook(() => useGlobalTranslationErrorState());
        act(() => {
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 1'));
            translationErrorHandler.recordError('es-ES', 'common', new Error('Error 2'));
        });
        expect(result.current.hasGlobalErrors).toBe(true);
        act(() => {
            result.current.clearAllErrors();
        });
        expect(result.current.hasGlobalErrors).toBe(false);
        expect(result.current.errorStats.totalErrors).toBe(0);
    });
    it('should update stats periodically', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useGlobalTranslationErrorState());
        act(() => {
            translationErrorHandler.recordError('fr-FR', 'interview', new Error('Error 1'));
        });
        // Fast-forward time to trigger periodic update
        act(() => {
            vi.advanceTimersByTime(30000);
        });
        expect(result.current.errorStats.totalErrors).toBe(1);
        vi.useRealTimers();
    });
});
