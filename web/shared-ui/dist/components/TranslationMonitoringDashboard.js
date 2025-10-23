import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
export const TranslationMonitoringDashboard = ({ apiEndpoint = '/api/monitoring', refreshInterval = 30000, className = '', }) => {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, refreshInterval);
        return () => clearInterval(interval);
    }, [selectedTimeRange, refreshInterval]);
    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-100';
            case 'warning': return 'text-yellow-600 bg-yellow-100';
            case 'critical': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'info': return 'text-blue-600 bg-blue-100';
            case 'warning': return 'text-yellow-600 bg-yellow-100';
            case 'error': return 'text-orange-600 bg-orange-100';
            case 'critical': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    if (loading) {
        return (_jsx("div", { className: `p-6 ${className}`, children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-8 bg-gray-200 rounded mb-4" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6", children: [...Array(4)].map((_, i) => (_jsx("div", { className: "h-24 bg-gray-200 rounded" }, i))) }), _jsx("div", { className: "h-64 bg-gray-200 rounded" })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: `p-6 ${className}`, children: _jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "h-5 w-5 text-red-400", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }) }), _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: t('monitoring.dashboard.error_title', 'Error Loading Dashboard') }), _jsx("div", { className: "mt-2 text-sm text-red-700", children: _jsx("p", { children: error }) }), _jsx("div", { className: "mt-4", children: _jsx("button", { onClick: fetchData, className: "bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200", children: t('monitoring.dashboard.retry', 'Retry') }) })] })] }) }) }));
    }
    if (!data)
        return null;
    return (_jsxs("div", { className: `p-6 ${className}`, children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: t('monitoring.dashboard.title', 'Translation Monitoring Dashboard') }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("select", { value: selectedTimeRange, onChange: (e) => setSelectedTimeRange(e.target.value), className: "border border-gray-300 rounded-md px-3 py-2 text-sm", children: [_jsx("option", { value: "1h", children: t('monitoring.dashboard.time_range.1h', 'Last Hour') }), _jsx("option", { value: "24h", children: t('monitoring.dashboard.time_range.24h', 'Last 24 Hours') }), _jsx("option", { value: "7d", children: t('monitoring.dashboard.time_range.7d', 'Last 7 Days') }), _jsx("option", { value: "30d", children: t('monitoring.dashboard.time_range.30d', 'Last 30 Days') })] }), _jsx("button", { onClick: fetchData, className: "bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700", children: t('monitoring.dashboard.refresh', 'Refresh') })] })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.health.status)}`, children: [_jsx("div", { className: `w-2 h-2 rounded-full mr-2 ${data.health.status === 'healthy' ? 'bg-green-600' : data.health.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'}` }), t(`monitoring.dashboard.status.${data.health.status}`, data.health.status.toUpperCase())] }), data.health.issues.length > 0 && (_jsx("div", { className: "mt-2", children: _jsx("ul", { className: "text-sm text-gray-600", children: data.health.issues.map((issue, index) => (_jsxs("li", { children: ["\u2022 ", issue] }, index))) }) }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6", children: [_jsxs("div", { className: "bg-white p-4 rounded-lg shadow border", children: [_jsx("div", { className: "text-sm font-medium text-gray-500", children: t('monitoring.dashboard.metrics.total_errors', 'Total Errors') }), _jsx("div", { className: "text-2xl font-bold text-gray-900", children: data.errors.total })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow border", children: [_jsx("div", { className: "text-sm font-medium text-gray-500", children: t('monitoring.dashboard.metrics.avg_load_time', 'Avg Load Time') }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [Math.round(data.performance.averageLoadTime), "ms"] })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow border", children: [_jsx("div", { className: "text-sm font-medium text-gray-500", children: t('monitoring.dashboard.metrics.cache_hit_rate', 'Cache Hit Rate') }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [Math.round(data.performance.cacheHitRate * 100), "%"] })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow border", children: [_jsx("div", { className: "text-sm font-medium text-gray-500", children: t('monitoring.dashboard.metrics.avg_rating', 'Avg Rating') }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [data.feedback.averageRating.toFixed(1), "/5"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow border", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: t('monitoring.dashboard.errors_by_severity', 'Errors by Severity') }), _jsx("div", { className: "space-y-2", children: Object.entries(data.errors.bySeverity).map(([severity, count]) => (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getSeverityColor(severity)}`, children: t(`monitoring.dashboard.severity.${severity}`, severity) }), _jsx("span", { className: "text-sm font-medium", children: count })] }, severity))) })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow border", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: t('monitoring.dashboard.errors_by_language', 'Errors by Language') }), _jsx("div", { className: "space-y-2", children: Object.entries(data.errors.byLanguage)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([language, count]) => (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: language }), _jsx("span", { className: "text-sm font-medium", children: count })] }, language))) })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow border", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: t('monitoring.dashboard.performance_by_language', 'Performance by Language') }), _jsx("div", { className: "space-y-2", children: Object.entries(data.performance.byLanguage)
                                    .sort(([, a], [, b]) => b.loadTime - a.loadTime)
                                    .slice(0, 5)
                                    .map(([language, metrics]) => (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: language }), _jsxs("span", { className: "text-sm font-medium", children: [Math.round(metrics.loadTime), "ms"] })] }, language))) })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow border", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: t('monitoring.dashboard.recent_feedback', 'Recent Feedback') }), _jsx("div", { className: "space-y-3", children: data.feedback.recent.slice(0, 3).map((feedback, index) => (_jsxs("div", { className: "border-l-4 border-blue-400 pl-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: feedback.language }), _jsx("div", { className: "flex items-center", children: [...Array(5)].map((_, i) => (_jsx("svg", { className: `w-4 h-4 ${i < (feedback.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`, fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" }) }, i))) })] }), feedback.comment && (_jsx("p", { className: "text-sm text-gray-600 mt-1", children: feedback.comment }))] }, index))) })] })] })] }));
};
export default TranslationMonitoringDashboard;
