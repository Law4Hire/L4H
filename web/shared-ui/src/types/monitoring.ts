export interface TranslationError {
  id: string;
  timestamp: Date;
  type: 'missing_key' | 'loading_failed' | 'interpolation_error' | 'fallback_used' | 'validation_error';
  severity: 'info' | 'warning' | 'error' | 'critical';
  language: string;
  namespace: string;
  key: string;
  message: string;
  context: string;
  userAgent: string;
  url: string;
  resolved: boolean;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

export interface TranslationPerformanceMetrics {
  id: string;
  timestamp: Date;
  type: 'translation_load' | 'language_switch' | 'cache_hit' | 'bundle_size';
  language: string;
  loadTime: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface UserFeedback {
  id: string;
  timestamp: Date;
  type: 'translation_quality' | 'missing_translation' | 'cultural_issue' | 'technical_issue';
  language: string;
  namespace?: string;
  key?: string;
  rating?: number; // 1-5 scale
  comment?: string;
  userAgent: string;
  url: string;
  metadata?: Record<string, any>;
}

export interface MonitoringDashboardData {
  errors: {
    total: number;
    byLanguage: Record<string, number>;
    byNamespace: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: TranslationError[];
  };
  performance: {
    averageLoadTime: number;
    cacheHitRate: number;
    languageSwitchTime: number;
    byLanguage: Record<string, { loadTime: number; success: number; total: number }>;
  };
  feedback: {
    total: number;
    averageRating: number;
    byLanguage: Record<string, { rating: number; count: number }>;
    recent: UserFeedback[];
  };
  health: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastUpdate: Date;
    issues: string[];
  };
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'error_rate' | 'performance' | 'feedback_rating' | 'missing_keys';
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    timeWindow: number; // minutes
  };
  actions: {
    email?: string[];
    webhook?: string;
    slack?: string;
  };
  enabled: boolean;
}

export interface MonitoringAlert {
  id: string;
  ruleId: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data: Record<string, any>;
  acknowledged: boolean;
  resolvedAt?: Date;
}