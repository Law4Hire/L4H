import { TranslationError, TranslationPerformanceMetrics, UserFeedback } from '../types/monitoring';

export interface TranslationMonitoringConfig {
  apiEndpoint: string;
  enableErrorTracking: boolean;
  enablePerformanceTracking: boolean;
  enableUserFeedback: boolean;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
}

export class TranslationMonitoringService {
  private config: TranslationMonitoringConfig;
  private errorQueue: TranslationError[] = [];
  private performanceQueue: TranslationPerformanceMetrics[] = [];
  private feedbackQueue: UserFeedback[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: TranslationMonitoringConfig) {
    this.config = config;
    this.startFlushTimer();
  }

  /**
   * Track translation error
   */
  trackError(error: Omit<TranslationError, 'id' | 'timestamp'>): void {
    if (!this.config.enableErrorTracking) return;

    const translationError: TranslationError = {
      id: this.generateId(),
      timestamp: new Date(),
      ...error,
    };

    this.errorQueue.push(translationError);

    // Immediate flush for critical errors
    if (error.severity === 'critical') {
      this.flushErrors();
    }

    // Flush if queue is full
    if (this.errorQueue.length >= this.config.batchSize) {
      this.flushErrors();
    }
  }

  /**
   * Track translation performance metrics
   */
  trackPerformance(metrics: Omit<TranslationPerformanceMetrics, 'id' | 'timestamp'>): void {
    if (!this.config.enablePerformanceTracking) return;

    const performanceMetrics: TranslationPerformanceMetrics = {
      id: this.generateId(),
      timestamp: new Date(),
      ...metrics,
    };

    this.performanceQueue.push(performanceMetrics);

    // Flush if queue is full
    if (this.performanceQueue.length >= this.config.batchSize) {
      this.flushPerformance();
    }
  }

  /**
   * Track user feedback
   */
  trackUserFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): void {
    if (!this.config.enableUserFeedback) return;

    const userFeedback: UserFeedback = {
      id: this.generateId(),
      timestamp: new Date(),
      ...feedback,
    };

    this.feedbackQueue.push(userFeedback);

    // Flush if queue is full
    if (this.feedbackQueue.length >= this.config.batchSize) {
      this.flushFeedback();
    }
  }

  /**
   * Track missing translation key
   */
  trackMissingKey(
    key: string,
    namespace: string,
    language: string,
    context?: string
  ): void {
    this.trackError({
      type: 'missing_key',
      severity: 'warning',
      language,
      namespace,
      key,
      message: `Missing translation key: ${key}`,
      context: context || 'unknown',
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolved: false,
    });
  }

  /**
   * Track translation loading failure
   */
  trackLoadingFailure(
    namespace: string,
    language: string,
    error: Error,
    context?: string
  ): void {
    this.trackError({
      type: 'loading_failed',
      severity: 'error',
      language,
      namespace,
      key: '',
      message: `Translation loading failed: ${error.message}`,
      context: context || 'unknown',
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolved: false,
      stackTrace: error.stack,
    });
  }

  /**
   * Track fallback usage
   */
  trackFallbackUsage(
    originalLanguage: string,
    fallbackLanguage: string,
    namespace: string,
    context?: string
  ): void {
    this.trackError({
      type: 'fallback_used',
      severity: 'info',
      language: originalLanguage,
      namespace,
      key: '',
      message: `Fallback to ${fallbackLanguage} used for ${originalLanguage}`,
      context: context || 'unknown',
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolved: false,
      metadata: {
        fallbackLanguage,
        originalLanguage,
      },
    });
  }

  /**
   * Track language switch performance
   */
  trackLanguageSwitch(
    fromLanguage: string,
    toLanguage: string,
    loadTime: number,
    success: boolean
  ): void {
    this.trackPerformance({
      type: 'language_switch',
      language: toLanguage,
      loadTime,
      success,
      metadata: {
        fromLanguage,
        toLanguage,
        switchTime: loadTime,
      },
    });
  }

  /**
   * Track translation loading performance
   */
  trackTranslationLoad(
    namespace: string,
    language: string,
    loadTime: number,
    cacheHit: boolean,
    success: boolean
  ): void {
    this.trackPerformance({
      type: 'translation_load',
      language,
      loadTime,
      success,
      metadata: {
        namespace,
        cacheHit,
        loadTime,
      },
    });
  }

  /**
   * Flush all queues
   */
  async flush(): Promise<void> {
    await Promise.all([
      this.flushErrors(),
      this.flushPerformance(),
      this.flushFeedback(),
    ]);
  }

  /**
   * Flush error queue
   */
  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await this.sendToAPI('/monitoring/errors', errors);
    } catch (error) {
      console.error('Failed to send translation errors:', error);
      // Re-queue errors for retry (up to max retries)
      this.errorQueue.unshift(...errors);
    }
  }

  /**
   * Flush performance queue
   */
  private async flushPerformance(): Promise<void> {
    if (this.performanceQueue.length === 0) return;

    const metrics = [...this.performanceQueue];
    this.performanceQueue = [];

    try {
      await this.sendToAPI('/monitoring/performance', metrics);
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
      // Re-queue metrics for retry
      this.performanceQueue.unshift(...metrics);
    }
  }

  /**
   * Flush feedback queue
   */
  private async flushFeedback(): Promise<void> {
    if (this.feedbackQueue.length === 0) return;

    const feedback = [...this.feedbackQueue];
    this.feedbackQueue = [];

    try {
      await this.sendToAPI('/monitoring/feedback', feedback);
    } catch (error) {
      console.error('Failed to send user feedback:', error);
      // Re-queue feedback for retry
      this.feedbackQueue.unshift(...feedback);
    }
  }

  /**
   * Send data to monitoring API
   */
  private async sendToAPI(endpoint: string, data: any[]): Promise<void> {
    const response = await fetch(`${this.config.apiEndpoint}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush().catch(console.error);
  }
}

// Default configuration
export const defaultMonitoringConfig: TranslationMonitoringConfig = {
  apiEndpoint: '/api',
  enableErrorTracking: true,
  enablePerformanceTracking: true,
  enableUserFeedback: true,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  maxRetries: 3,
};

// Global monitoring service instance
let monitoringService: TranslationMonitoringService | null = null;

export function initializeMonitoring(config?: Partial<TranslationMonitoringConfig>): TranslationMonitoringService {
  const finalConfig = { ...defaultMonitoringConfig, ...config };
  monitoringService = new TranslationMonitoringService(finalConfig);
  return monitoringService;
}

export function getMonitoringService(): TranslationMonitoringService | null {
  return monitoringService;
}