import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface MonitoringDashboardData {
  errors: {
    total: number;
    byLanguage: Record<string, number>;
    byNamespace: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: any[];
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
    recent: any[];
  };
  health: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastUpdate: string;
    issues: string[];
  };
}

interface TranslationMonitoringDashboardProps {
  apiEndpoint?: string;
  refreshInterval?: number;
  className?: string;
}

export const TranslationMonitoringDashboard: React.FC<TranslationMonitoringDashboardProps> = ({
  apiEndpoint = '/api/monitoring',
  refreshInterval = 30000,
  className = '',
}) => {
  const { t } = useTranslation();
  const [data, setData] = useState<MonitoringDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  const fetchData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedTimeRange) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`${apiEndpoint}/dashboard?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [selectedTimeRange, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {t('monitoring.dashboard.error_title', 'Error Loading Dashboard')}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchData}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  {t('monitoring.dashboard.retry', 'Retry')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('monitoring.dashboard.title', 'Translation Monitoring Dashboard')}
        </h1>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="1h">{t('monitoring.dashboard.time_range.1h', 'Last Hour')}</option>
            <option value="24h">{t('monitoring.dashboard.time_range.24h', 'Last 24 Hours')}</option>
            <option value="7d">{t('monitoring.dashboard.time_range.7d', 'Last 7 Days')}</option>
            <option value="30d">{t('monitoring.dashboard.time_range.30d', 'Last 30 Days')}</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            {t('monitoring.dashboard.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Health Status */}
      <div className="mb-6">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.health.status)}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${data.health.status === 'healthy' ? 'bg-green-600' : data.health.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'}`}></div>
          {t(`monitoring.dashboard.status.${data.health.status}`, data.health.status.toUpperCase())}
        </div>
        {data.health.issues.length > 0 && (
          <div className="mt-2">
            <ul className="text-sm text-gray-600">
              {data.health.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">
            {t('monitoring.dashboard.metrics.total_errors', 'Total Errors')}
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.errors.total}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">
            {t('monitoring.dashboard.metrics.avg_load_time', 'Avg Load Time')}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(data.performance.averageLoadTime)}ms
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">
            {t('monitoring.dashboard.metrics.cache_hit_rate', 'Cache Hit Rate')}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(data.performance.cacheHitRate * 100)}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">
            {t('monitoring.dashboard.metrics.avg_rating', 'Avg Rating')}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.feedback.averageRating.toFixed(1)}/5
          </div>
        </div>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Errors by Severity */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('monitoring.dashboard.errors_by_severity', 'Errors by Severity')}
          </h3>
          <div className="space-y-2">
            {Object.entries(data.errors.bySeverity).map(([severity, count]) => (
              <div key={severity} className="flex justify-between items-center">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getSeverityColor(severity)}`}>
                  {t(`monitoring.dashboard.severity.${severity}`, severity)}
                </span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Errors by Language */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('monitoring.dashboard.errors_by_language', 'Errors by Language')}
          </h3>
          <div className="space-y-2">
            {Object.entries(data.errors.byLanguage)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([language, count]) => (
                <div key={language} className="flex justify-between items-center">
                  <span className="text-sm">{language}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Performance by Language */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('monitoring.dashboard.performance_by_language', 'Performance by Language')}
          </h3>
          <div className="space-y-2">
            {Object.entries(data.performance.byLanguage)
              .sort(([,a], [,b]) => b.loadTime - a.loadTime)
              .slice(0, 5)
              .map(([language, metrics]) => (
                <div key={language} className="flex justify-between items-center">
                  <span className="text-sm">{language}</span>
                  <span className="text-sm font-medium">{Math.round(metrics.loadTime)}ms</span>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('monitoring.dashboard.recent_feedback', 'Recent Feedback')}
          </h3>
          <div className="space-y-3">
            {data.feedback.recent.slice(0, 3).map((feedback, index) => (
              <div key={index} className="border-l-4 border-blue-400 pl-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{feedback.language}</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < (feedback.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                {feedback.comment && (
                  <p className="text-sm text-gray-600 mt-1">{feedback.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationMonitoringDashboard;