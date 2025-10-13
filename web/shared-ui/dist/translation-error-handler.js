export class TranslationErrorHandler {
    constructor(options = {}) {
        Object.defineProperty(this, "errors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "loadingStates", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "retryTimeouts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        this.options = {
            maxRetries: 3,
            retryDelay: 1000,
            enableLogging: true,
            enableUserNotifications: true,
            fallbackLanguage: 'en-US',
            ...options
        };
    }
    /**
     * Record a translation loading error
     */
    recordError(language, namespace, error) {
        const translationError = {
            language,
            namespace,
            error,
            timestamp: new Date(),
            retryCount: this.getRetryCount(language, namespace)
        };
        this.errors.push(translationError);
        // Update loading state
        const key = `${language}-${namespace}`;
        const currentState = this.loadingStates.get(key) || this.createInitialState();
        this.updateLoadingState(key, {
            ...currentState,
            hasError: true,
            errorMessage: error.message,
            retryCount: translationError.retryCount
        });
        // Log error if enabled
        if (this.options.enableLogging) {
            console.error(`Translation loading failed for ${language}/${namespace}:`, error);
            this.logErrorMetrics(translationError);
        }
        // Attempt retry if within limits
        if (translationError.retryCount < this.options.maxRetries) {
            this.scheduleRetry(language, namespace, translationError.retryCount + 1);
        }
        else {
            // Max retries exceeded, activate fallback
            this.activateFallback(language, namespace);
        }
    }
    /**
     * Record successful translation loading
     */
    recordSuccess(language, namespace) {
        const key = `${language}-${namespace}`;
        const currentState = this.loadingStates.get(key) || this.createInitialState();
        this.updateLoadingState(key, {
            ...currentState,
            isLoading: false,
            hasError: false,
            errorMessage: undefined
        });
        // Clear any pending retries
        const retryKey = `${language}-${namespace}`;
        const timeout = this.retryTimeouts.get(retryKey);
        if (timeout) {
            clearTimeout(timeout);
            this.retryTimeouts.delete(retryKey);
        }
        if (this.options.enableLogging) {
            console.info(`Translation loaded successfully for ${language}/${namespace}`);
        }
    }
    /**
     * Start loading state for a translation
     */
    startLoading(language, namespace) {
        const key = `${language}-${namespace}`;
        const currentState = this.loadingStates.get(key) || this.createInitialState();
        this.updateLoadingState(key, {
            ...currentState,
            isLoading: true,
            hasError: false,
            errorMessage: undefined
        });
    }
    /**
     * Get current loading state for a language/namespace combination
     */
    getLoadingState(language, namespace) {
        const key = `${language}-${namespace}`;
        return this.loadingStates.get(key) || this.createInitialState();
    }
    /**
     * Get overall loading state (aggregated across all namespaces for a language)
     */
    getOverallLoadingState(language) {
        const states = Array.from(this.loadingStates.entries())
            .filter(([key]) => key.startsWith(`${language}-`))
            .map(([, state]) => state);
        if (states.length === 0) {
            return this.createInitialState();
        }
        return {
            isLoading: states.some(s => s.isLoading),
            hasError: states.some(s => s.hasError),
            errorMessage: states.find(s => s.errorMessage)?.errorMessage,
            isFallbackActive: states.some(s => s.isFallbackActive),
            failedLanguages: Array.from(new Set(states.flatMap(s => s.failedLanguages))),
            retryCount: Math.max(...states.map(s => s.retryCount), 0)
        };
    }
    /**
     * Manually retry loading for a specific language/namespace
     */
    async retryLoading(language, namespace, loadFunction) {
        const key = `${language}-${namespace}`;
        try {
            this.startLoading(language, namespace);
            await loadFunction(language, namespace);
            this.recordSuccess(language, namespace);
            return true;
        }
        catch (error) {
            this.recordError(language, namespace, error);
            return false;
        }
    }
    /**
     * Get error statistics for monitoring
     */
    getErrorStats() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo);
        const errorsByLanguage = {};
        const errorsByNamespace = {};
        this.errors.forEach(error => {
            errorsByLanguage[error.language] = (errorsByLanguage[error.language] || 0) + 1;
            errorsByNamespace[error.namespace] = (errorsByNamespace[error.namespace] || 0) + 1;
        });
        return {
            totalErrors: this.errors.length,
            errorsByLanguage,
            errorsByNamespace,
            recentErrors
        };
    }
    /**
     * Subscribe to loading state changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Clear all error history (useful for testing or reset)
     */
    clearErrors() {
        this.errors = [];
        this.loadingStates.clear();
        this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
        this.retryTimeouts.clear();
    }
    createInitialState() {
        return {
            isLoading: false,
            hasError: false,
            isFallbackActive: false,
            failedLanguages: [],
            retryCount: 0
        };
    }
    updateLoadingState(key, state) {
        this.loadingStates.set(key, state);
        // Notify listeners
        this.listeners.forEach(listener => listener(state));
    }
    getRetryCount(language, namespace) {
        return this.errors.filter(e => e.language === language && e.namespace === namespace).length;
    }
    scheduleRetry(language, namespace, retryCount) {
        const delay = this.options.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
        const retryKey = `${language}-${namespace}`;
        // Clear any existing retry timeout
        const existingTimeout = this.retryTimeouts.get(retryKey);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        const timeout = setTimeout(() => {
            if (this.options.enableLogging) {
                console.info(`Retrying translation load for ${language}/${namespace} (attempt ${retryCount})`);
            }
            // The actual retry will be handled by the i18n backend
            // This just logs the retry attempt
            this.retryTimeouts.delete(retryKey);
        }, delay);
        this.retryTimeouts.set(retryKey, timeout);
    }
    activateFallback(language, namespace) {
        const key = `${language}-${namespace}`;
        const currentState = this.loadingStates.get(key) || this.createInitialState();
        this.updateLoadingState(key, {
            ...currentState,
            isFallbackActive: true,
            failedLanguages: [...currentState.failedLanguages, language],
            isLoading: false
        });
        if (this.options.enableLogging) {
            console.warn(`Fallback activated for ${language}/${namespace} after ${this.options.maxRetries} failed attempts`);
        }
    }
    logErrorMetrics(error) {
        // Log structured data for monitoring systems
        const errorData = {
            type: 'translation_loading_error',
            language: error.language,
            namespace: error.namespace,
            error_message: error.error.message,
            retry_count: error.retryCount,
            timestamp: error.timestamp.toISOString(),
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'unknown'
        };
        // In a real application, you might send this to a monitoring service
        console.error('Translation Error Metrics:', errorData);
        // Example: Send to monitoring service
        // this.sendToMonitoringService(errorData)
    }
    // Example method for sending metrics to external monitoring
    async sendToMonitoringService(errorData) {
        try {
            // This would be replaced with actual monitoring service integration
            // await fetch('/api/monitoring/translation-errors', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(errorData)
            // })
        }
        catch (error) {
            console.warn('Failed to send error metrics to monitoring service:', error);
        }
    }
}
// Global instance for use across the application
export const translationErrorHandler = new TranslationErrorHandler();
